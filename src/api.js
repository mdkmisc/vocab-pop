
/* eslint-disable */
const DEBUG = true;

import myrouter from 'src/myrouter'
import { createSelector } from 'reselect'
import { combineReducers, } from 'redux'
import { connect } from 'react-redux'
import { combineEpics } from 'redux-observable'

import config from 'src/config'
import * as util from 'src/utils';
import React, { Component } from 'react';
//import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';
import Rx from 'rxjs/Rx';
//import { ajax } from 'rxjs/observable/dom/ajax';
import _ from 'src/supergroup'; // lodash would be fine here

const getToken = () => {
  let authToken = myrouter.getQuery('token') || util.storageGet('authToken')
  if (!authToken) {
    util.storagePut('returnToUrl', window.location.href,undefined,true)
    let authUrl = process.env.REACT_APP_API_AUTH
    window.location.replace(authUrl)
  }
  if (util.storageGet('authToken') !== authToken) {
    util.storagePut('authToken', authToken)
  }
  return authToken
}
const getUser = () => {
  let user = util.storageGet('user')
  if (!user) {
    getToken()
    return {}
  }
  return user
}
// HANDLE TOKEN PATH
if (window.location.pathname === '/token') {
  let query = myrouter.getQuery()
  let url = util.storageGet('returnToUrl')



  sessionStorage.clear() // cachedirty not working.... temp measure
          // this isn't working either, just do it by hand for now



  util.storagePut('authToken', query.token, undefined, true)
  util.storagePut('user', JSON.parse(query.user), undefined, true)
  if (url ) {
    window.location.replace(url)
  }
}



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
  CACHED_RESULTS: 'vocab-pop/api/CACHED_RESULTS',
  NEW_RESULTS: 'vocab-pop/api/NEW_RESULTS',
  REJECTED: 'vocab-pop/api/REJECTED',
  UNAUTHORIZED: 'vocab-pop/api/UNAUTHORIZED',

  ADD_TO_QUEUE: 'vocab-pop/api/ADD_TO_QUEUE',
  NEXT_IN_QUEUE: 'vocab-pop/api/NEXT_IN_QUEUE',
  CHECKING_QUEUE: 'vocab-pop/api/CHECKING_QUEUE',

  CACHE_DIRTY: 'vocab-pop/api/CACHE_DIRTY',
}
export {apiActions}
export const reducer = (
  state={ 
          events: [],
          queue:{},
          active:{},
          complete:{},
          failed:{}
        }, action) => {
  let {events,queue,active,complete,failed} = state
  let {type, payload, meta, error} = action
  let apiPathname, params, url, results, msg
  switch (type) {
    case apiActions.CHECKING_QUEUE:
      console.log('reducer queue check', action)
      events = [...events, 'checked queue']
      break
    case apiActions.ADD_TO_QUEUE:
      ({apiPathname, params, url} = payload)
      if (_.has(queue, url)) { // don't add same if it's already queued
        if (_.isEqual(queue[url].params,params)) {
          return state
        }
        debugger
        throw new Error("do something -- in queue already, but not same")
      }
      queue = {...queue, [url]: {params,msg,apiPathname, meta, status:'queued'}}
      break
    case apiActions.NEXT_IN_QUEUE:
      ({apiPathname, params, url} = payload)
      let nextCall = {...payload, status: 'active', url:undefined}
      queue = {...queue, [url]: nextCall}
      active = {...active, [url]: nextCall}
      break
    case apiActions.CACHE_DIRTY:
      // check this
      return {...state, cacheDirty: (state.cachDirty||[]).push(payload)}
      break
    case apiActions.CACHED_RESULTS:
    case apiActions.NEW_RESULTS:
      //debugger
      ({apiPathname, params, url, msg='no message'} = meta)
      results = payload
      console.log('RESULTS', action)
      if (!_.has(active, url)) {
        throw new Error("do something -- got results, but not active")
      }
      if (_.has(complete, url)) {
        console.log('loading for a second time. not sure handling this correctly', url)
        //throw new Error("do something")
      }
      active = _.pickBy(active, (v,k) => k !== url)
      queue = {...queue, [url]: {...queue[url], status:'complete'}}
      complete = {...complete, [url]: {params,msg,apiPathname}}
      break
    case apiActions.UNAUTHORIZED:
      ({apiPathname, url, results} = meta)
      active = _.pickBy(active, (v,k) => k !== url)
      failed = {...failed, [url]: action}
      break
    case apiActions.REJECTED:
      ({apiPathname, url, results} = meta)
      if (!_.has(active, url)) {
        throw new Error("do something -- rejected but not active")
      }
      if (_.has(complete, url)) {
        throw new Error("do something -- complete but not active")
      }
      if (_.has(failed, url)) {
        throw new Error("do something -- failed but not active")
      }
      active = _.pickBy(active, (v,k) => k !== url)
      failed = {...failed, [url]: action}
      break
    default:
      return state
  }
  let newState = {events,queue,active,complete,failed}
  if (_.isEqual(state, newState)) {
    //console.log("no change in api reducer", {action, state})
    return state
  } else {
    //console.log("yes change in api reducer", {action, state, newState})
    return newState
  }
}
export default reducer


/**** start epics ******************************************/
let epics = []

/* not working ... almost... for now just clear cache on HANDLE TOKEN PATH
const checkCacheEpic = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init -- why not on @@INIT?
  //action$.ofType('@@INIT') // DOESN'T WORK ... too early, not sure why
    .take(1)
    .mergeMap(()=>{
      if (window.location.pathname === '/token') {
        return Rx.Observable.empty()
      }
      return checkCacheDirty()
    })
    .catch(err => {
      console.error('error in checkCacheEpic', err)
      return Rx.Observable.empty()
    })
)
epics.push(checkCacheEpic)
*/

const watchTheQueue = (action$, store) => (
  action$
    .debounceTime(3000)
    .switchMap(action=>{
      //console.log("making timer(s)", action)
      let timer = Rx.Observable.timer(100, 400)
      return timer
      return Rx.Observable.of(timer)
    })
    //.map((i,a,b,c)=>{i,a,b,c})
    //.switch()
    .mergeMap(timer=>{
      let queue = _.get(store.getState(),'api.queue')
      let queuedCalls = Object.entries(queue).filter(([k,v],i) => v.status === 'queued')
      if (!queuedCalls.length) {
        return Rx.Observable.empty()
      }
      let queuedCall = {...queuedCalls[0][1], url:queuedCalls[0][0]}
      let user = getUser()
      if (user.tester) {
        let action = actionGenerators.nextInQueue(queuedCall)
        if (!action.type) {
          debugger
        }
        return Rx.Observable.of(action)
      }
      return Rx.Observable.of({
        type: apiActions.UNAUTHORIZED,
        payload: {msg:'User not authorized', user},
        meta: queuedCall,
        error: true
      })
    })
)
epics.push(watchTheQueue)
const processActive = (action$, store) => (
  action$.ofType(apiActions.NEXT_IN_QUEUE)
    .mergeMap((action)=>{
      let {type, payload, error} = action
      let {apiPathname, params, url,meta} = payload
      return apiCall({apiPathname, params, url, meta }, store)
    })
)
epics.push(processActive)
const unauthorized = (action$, store) => (
  action$.ofType(apiActions.UNAUTHORIZED)
    .mergeMap((action)=>{
      let {type, payload, meta, error} = action
      let {msg, user} = payload
      let {apiPathname, params, url} = meta
      let err = {...user, ...meta}
      myrouter.routeError(url, err, msg)
      return Rx.Observable.empty()
    })
)
epics.push(unauthorized)
export {epics}
/**** end epics ******************************************/


export const actionGenerators = {
  apiCall: props => {
    let { apiPathname, params, meta } = props
    let url = apiGetUrl(apiPathname, params)
    let token = getToken()
    url += (url.match(/\?/) ? '&' : '?') + `token=${token}`
    return {type: apiActions.ADD_TO_QUEUE, payload: {apiPathname,params,url},meta}
  },
  nextInQueue: nextCall => ({type: apiActions.NEXT_IN_QUEUE, payload: nextCall}),
  cachedResults: ({apiPathname,params,url,results,meta}) => 
      ({type: apiActions.CACHED_RESULTS, payload: results, meta:{...meta, apiPathname,params,url}}),
  newResults: ({apiPathname,params,url,results,meta}) => 
      ({type: apiActions.NEW_RESULTS,    payload: results, meta:{...meta, apiPathname,params,url}}),
}
export const cachedAjax = props => {
  //debugger
  let {apiPathname, params, url, meta} = props
  //console.log(url.slice(0,90))
  if (isCached(url)) {
    let results = util.storageGet(url)
    return Rx.Observable.of(actionGenerators.cachedResults({apiPathname,params,url,results, meta}))
    //return Rx.Observable.of(results)
  }
  let rxAjax = Rx.Observable.ajax.getJSON(url) //(,{mode: 'no-cors'})
                  .map(results => {
                    return actionGenerators.newResults({apiPathname,params,url,results, meta})
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
        meta,

        msgFunc= r => Array.isArray(r) ? `${r.length} records` :'got something...',
        paramsValidation=d=>d,
        resultsTransform=d=>d,
        //successMap=results=>{console.error("do something with results!",results)},
// IGNORE catchFunc FOR NOW!!!!!
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
  //console.log('apiCall doing nothing')
  //return Rx.Observable.empty()

  //console.log(apiPathname, JSON.stringify(params))
  return cachedAjax({apiPathname, params, url, meta})
              .catch(catchFunc)
}

const checkCacheDirty = () => { // make sure to use this
  let url = apiGetUrl('cacheDirty')
  let token = getToken()
  url += (url.match(/\?/) ? '&' : '?') + `token=${token}`
  let ajax =
    Rx.Observable.ajax.getJSON(url,{mode: 'no-cors'})
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
