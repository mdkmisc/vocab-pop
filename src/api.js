
/* eslint-disable */
const DEBUG = true;

import myrouter from 'src/myrouter'
import { createSelector } from 'reselect'
import { combineReducers, } from 'redux'
import { connect } from 'react-redux'

import config from 'src/config'
import * as util from 'src/utils';
import React, { Component } from 'react';
//import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';
import Rx from 'rxjs/Rx';
//import { ajax } from 'rxjs/observable/dom/ajax';
import _ from 'src/supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
var ALLOW_CACHING = [
  '.*',
  //'/WebAPI/[^/]+/person/',
];

// these are 'selectors' but they don't need to be
// connected to anything beyond config, which is
// imported here. also they might only be used here
const {cdmSchema, resultsSchema} = config
//console.log(config)
const baseUrl = () => `${config.apiRoot}/${config.apiModel}`
export const apiGetUrl = (apiPathname, params) => 
  getUrl(`${baseUrl()}/${apiPathname}`, 
         {...params, cdmSchema, resultsSchema})

const getUrl = (path, params={}) => {
  //console.error('in getUrl', {url,params})
  if (_.isEmpty(params)) return path

  let qs = myrouter.toqs(params)
  let url = `${path}?${qs}`
  //console.log({url,params})
  return url
}
export const isCached = (url='') => {
  var allowed = _.find(ALLOW_CACHING, allowedUrl => url.match(allowedUrl));
  if (!allowed) return
  return util.storageExists(url)
}

const apiActions = {
  API_CALL: 'vocab-pop/api/API_CALL',
  CACHED_RESULTS: 'vocab-pop/api/CACHED_RESULTS',
  NEW_RESULTS: 'vocab-pop/api/NEW_RESULTS',
  REJECTED: 'vocab-pop/api/REJECTED',

  CACHE_DIRTY: 'vocab-pop/api/CACHE_DIRTY',
}
export {apiActions}
export const reducer = (
  state={ active:{},
          complete:{},
          failed:{}
        }, action) => {
  let {status,active,complete,failed} = state
  let {type, payload, meta, error} = action
  let apiPathname, params, url, results, msg
  switch (type) {
    case apiActions.CACHE_DIRTY:
      // check this
      return {...state, cacheDirty: (state.cachDirty||[]).push(payload)}
    case apiActions.API_CALL:
      ({apiPathname, params, url} = payload)
      if (_.has(active, url)) {
        if (_.isEqual(active[url].params,params)) {
          return state
        }
        throw new Error("do something")
      }
      active = {...active, [url]: {params,msg,apiPathname}}
      break
    case apiActions.CACHED_RESULTS:
    case apiActions.NEW_RESULTS:
      //debugger
      ({apiPathname, params, url, msg='no message'} = meta)
      results = payload
      if (!_.has(active, url)) {
        throw new Error("do something")
      }
      if (_.has(complete, url)) {
        console.log('loading for a second time. not sure handling this correctly', url)
        //throw new Error("do something")
      }
      active = _.pickBy(active, (v,k) => k !== url)
      complete = {...complete, [url]: {params,msg,apiPathname}}
      break
    case apiActions.REJECTED:
      ({apiPathname, url, results} = meta)
      if (!_.has(active, url)) {
        throw new Error("do something")
      }
      if (_.has(complete, url)) {
        throw new Error("do something")
      }
      if (_.has(failed, url)) {
        throw new Error("do something")
      }
      active = _.pickBy(active, (v,k) => k !== url)
      failed = {...failed, [url]: action}
      break
    default:
      return state
  }
  let newState = {status,active,complete,failed}
  return _.isEqual(state, newState) ? state : newState
}
export default reducer
export const actionGenerators = {
  apiCall: props => {
    let { apiPathname, params, } = props
    let url = apiGetUrl(apiPathname, params)
    return {type: apiActions.API_CALL, payload: {apiPathname,params,url}}
  },
  cachedResults: ({apiPathname,params,url,results}) => 
      ({type: apiActions.CACHED_RESULTS, 
        payload: results, 
        meta:{apiPathname,params,url}}),
  newResults: ({apiPathname,params,url,results}) => 
      ({type: apiActions.NEW_RESULTS, payload: results, meta:{apiPathname,params,url}}),
}
export const cachedAjax = props => {
  //debugger
  let {apiPathname, params, url} = props
  console.log(url.slice(0,90))
  if (isCached(url)) {
    let results = util.storageGet(url)
    return Rx.Observable.of(actionGenerators.cachedResults({apiPathname,params,url,results}))
    //return Rx.Observable.of(results)
  }
  debugger
  let rxAjax = 
    Rx.Observable.ajax.getJSON(url,{mode: 'no-cors'})
              .map(results => {
                console.log('some results', results)
                debugger
                return actionGenerators.newResults({apiPathname,params,url,results})
              })
              .catch((err,a,b,c) => {
                debugger
                throw err
              })
  rxAjax.subscribe(action => {
    util.storagePut(action.meta.url, action.payload)
  })
  return rxAjax
}
export const apiCall = (props, store) => {
  let { apiPathname, 
        params, 
        url,

        msgFunc= r => Array.isArray(r) ? `${r.length} records` :'got something...',
        paramsValidation=d=>d,
        resultsTransform=d=>d,
        //successMap=results=>{console.error("do something with results!",results)},
        catchFunc=err => {
          console.log('error with some apiCall', err)
          return Rx.Observable.of({
            type: apiActions.REJECTED,
            payload: (err.xhr||{}).response || err,
            meta: {apiPathname, params, url},
            error: true
          })
        },
  } = props

  //console.log(apiPathname, JSON.stringify(params))
  return cachedAjax({apiPathname, params, url})
              //.do(action=>{debugger})
              .do(action=>{
                action = {...action, meta:{...action.meta,msg:msgFunc(action.payload)}}
                store.dispatch(action)
              })
              //.map(successMap)
              .catch(catchFunc)
}
function handleErrors(p) {
    let {jsonPromise,response} = p
    if (!response.ok) {
      //console.error('got error with', response)
      throw p
    }
    return p
}

const checkCacheDirty = (store) => { // make sure to use this
  let ajax =
    Rx.Observable.ajax.getJSON(apiGetUrl('cacheDirty'),{mode: 'no-cors'})
      .map(results => {
        if (results) {
          DEBUG && console.warn(`cache dirty. removing ${_.keys(util.storage()).length} items in util.storage()`);
          util.storageClear()
        } else {
          DEBUG && console.warn(`cache clean. ${_.keys(util.storage()).length} items in util.storage()`);
        }
        return results
      })
      .catch((err, obs) => {
        let action = util.makeAction({payload:err,
                             type:apiActions.REJECTED})
        return Rx.Observable.of(action)
      })
      .map(results => {
        //return Rx.Observable.empty()
        return {type: apiActions.CACHE_DIRTY, payload: {[Date()]:results}}
      })
  return ajax
}



import Snackbar from 'material-ui/Snackbar';
import RaisedButton from 'material-ui/RaisedButton';


class ApiSnackbar extends Component {

  constructor(props) {
    super(props)
    this.state = {
      open: false,
      msg: 'nothing yet',
      msgs:['blah','foo'],
    }
  }
  componentDidUpdate(prevProps) {
    return
    let {api} = this.props
    //let msg = `${_.keys(api.active).length} active, ${_.keys(api.complete).length} complete`
    //setTimeout(()=>this.setState({open:true}), 500)

    let msgs = [
                'Active: ' + _.map(api.active,(v,k)=>`${v.apiPathname}: ${v.msg}`),
                'Complete: ' + _.map(api.complete,(v,k)=>`${v.apiPathname}: ${v.msg}`),
                'Failed: ' + _.map(api.failed,(v,k)=>`${v.apiPathname}: ${v.msg}`),
    ]
    msgs.filter(msg=>!_.includes(this.state.msgs, msg))
    if (msgs.length) {
      //console.log(msgs)
      //debugger
      this.setState({open:true, msgs: this.state.msgs.concat(msgs)})
    }
  }

  handleTouchTap = () => {
    this.setState({
      open: true,
    });
  };

  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  };

  render() {
    let {api} = this.props
    return (
      <div>
        <RaisedButton
          onTouchTap={this.handleTouchTap}
          label="Add to my calendar"
        />
        <Snackbar
          open={this.state.open}
          message={this.state.msgs.join('\n')}
          autoHideDuration={400}
          onRequestClose={this.handleRequestClose}
        />
      </div>
    );
  }
}
ApiSnackbar = connect(
  (state, props) => {
    //debugger
    return {
      api: state.api,
    }
  }
  //, dispatch => mapDispatchToProps
)(ApiSnackbar)

export {ApiSnackbar}


class ApiWatch extends Component {
  constructor(props) {
    super(props)
    this.state = {msgs:['blah','foo']}
  }
  componentDidUpdate() {
    let {api} = this.props
    //let msg = `${_.keys(api.active).length} active, ${_.keys(api.complete).length} complete`
    let msgs = [
                'Active: ' + _.map(api.active,(v,k)=>`${v.apiPathname}: ${v.msg}`),
                'Complete: ' + _.map(api.complete,(v,k)=>`${v.apiPathname}: ${v.msg}`),
                'Failed: ' + _.map(api.failed,(v,k)=>`${v.apiPathname}: ${v.msg}`),
    ]
    msgs.filter(msg=>!_.includes(this.state.msgs, msg))
    if (msgs.length) {
      //console.log(msgs)
      //debugger
      this.setState({msgs: this.state.msgs.concat(msgs)})
    }
    //setTimeout(()=>this.setState({open:true}), 500)
  }
  render() {
    let {api} = this.props
    let {msgs} = this.state
    //let msg = JSON.stringify(api)
    let msg = [
                'Active: ' + _.map(api.active,(v,k)=>`${v.apiPathname}: ${v.msg}`),
                'Complete: ' + _.map(api.complete,(v,k)=>`${v.apiPathname}: ${v.msg}`),
                'Failed: ' + _.map(api.failed,(v,k)=>`${v.apiPathname}: ${v.msg}`),
    ].join('\n')

    //let msg = `${_.keys(api.active).length} active, ${_.keys(api.complete).length} complete`
    return (
      <pre>
        {msgs.join('\n')}

        {msg}
      </pre>
    );
  }
}
ApiWatch = connect(
  (state, props) => {
    //debugger
    return {
      api: state.api,
    }
  }
  //, dispatch => mapDispatchToProps
)(ApiWatch)

export {ApiWatch}
