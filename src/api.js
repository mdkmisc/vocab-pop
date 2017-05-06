
/* eslint-disable */
const DEBUG = true;

import myrouter from 'src/myrouter'
import { createSelector } from 'reselect'
import { combineReducers, } from 'redux'

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
export const apiActions = {
  API_CALL: 'vocab-pop/api/API_CALL',
  API_CALL_NEW: 'vocab-pop/api/API_CALL_NEW',
  API_CALL_LOAD: 'vocab-pop/api/API_CALL_LOAD',
  API_CALL_FULFILLED: 'vocab-pop/api/API_CALL_FULFILLED',
  API_CALL_REJECTED: 'vocab-pop/api/API_CALL_REJECTED',
  CACHE_DIRTY: 'vocab-pop/api/CACHE_DIRTY'
}

export const examineAction = o => {
  let {from, action, response, state} = o
  let {type, payload={}, meta={}} = action
  console.log(o)
  console.log({...action, }, '\naction')
  console.log({...payload, }, '\npayload')
  console.log({...state, }, '\nstate\n\n---------------')
  //console.log({from, action, type, response, ...payload, ...meta, state})
}
window.examineAction = examineAction

const apiCallEpic = (action$, store) => (
  action$
    //.do(action=>examineAction({from:'apiCallEpic start',action$, action, state:store.getState()}))
    .ofType(apiActions.API_CALL_LOAD)
    //.do(action=>examineAction({from:'apiCallEpic load',action$, action, state:store.getState()}))
    .mergeMap(action=>{
      let {apiName, storeName, } = flattenAction(action)
      let {type, payload, url, } = flattenAction(action)
      return (
        cachedAjax(url)
        .map(results=>{
          //console.log('results', results)
          action = util.makeAction(
            {action, payload:results,
              type:apiActions.API_CALL_FULFILLED})
          return action
          //return Rx.Observable.of(action)
        })
        .catch(err => {
          debugger
          console.log('error inside merge', error)
          return Rx.Observable.of({
            ...action,
            type: apiActions.API_CALL_REJECTED,
            payload: err.xhr.response,
            error: true
          })
        })
      )
    })
    .catch(err => {
      debugger
      console.log('error after merge', error)
      return Rx.Observable.of({
        ...action,
        type: apiActions.API_CALL_REJECTED,
        payload: err.xhr.response,
        error: true
      })
    })
)
const checkCache = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init
    .filter(() => _.isEmpty(store.getState().cacheDirty))
    .take(1)
    .mergeMap(()=>{
      return checkCacheDirty(store)
    })
)
export const epics = [
  checkCache,
  apiCallEpic,
]

export const cachedAjax = url => {
  //console.log(url.slice(0,90))
  if (isCached(url)) return Rx.Observable.of(util.storageGet(url))
  let rxAjax = Rx.Observable.ajax.getJSON(url,{mode: 'no-cors'})
  rxAjax.subscribe(results => {
    util.storagePut(url, results)
  })
  return rxAjax
}
export const isCached = url => {
  var allowed = _.find(ALLOW_CACHING, allowedUrl => url.match(allowedUrl));
  if (!allowed) return
  return util.storageExists(url)
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
                             type:apiActions.API_CALL_REJECTED})
        return Rx.Observable.of(action)
      })
      .map(results => {
        //return Rx.Observable.empty()
        return {type: apiActions.CACHE_DIRTY, payload: {[Date()]:results}}
      })
  return ajax
}

// these are 'selectors' but they don't need to be
// connected to anything beyond config, which is
// imported here. also they might only be used here
const {cdmSchema, resultsSchema} = config
const baseUrl = () => `${config.apiRoot}/${config.apiModel}`
const apiGetUrl = (apiPathname, params) => 
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

export const newDataActionFilter = (action, apiNameWanted, storeNameWanted='primary') => {
  let {type, payload, apiName, storeName, apiPathname, params, url,
        results, error, err, api, } = flattenAction(action)
  return (
    type === apiActions.API_CALL_FULFILLED &&
    apiName === apiNameWanted &&
    storeName === storeNameWanted
  )
}

export const apiSelectorMakers = apiName => {
  const calls = state => {
    return _.get(state, `calls.${apiName}`)||{}
  }
  const primaryCall = createSelector(calls, calls.primary)
  const otherCall = createSelector(calls, storeName => calls[storeName])
  const call = createSelector(
    calls,
    calls => (storeName='primary') => calls[storeName]||{}
  )
  const callPhase = createSelector(call, call => storeName=>call(storeName).type)
  const isSetup = createSelector(callPhase, callPhase => storeName=>!!callPhase(storeName))
  const isStarted = createSelector(callPhase, callPhase => storeName=>callPhase(storeName)!==apiActions.API_CALL)
  const callMeta = createSelector(call, call => storeName=>call(storeName).meta||{})
  const callStuff = createSelector(callMeta, callMeta => storeName=>callMeta(storeName).call||{})
  const isPending = createSelector(callStuff, callStuff => storeName=>callStuff(storeName).pending)
  const results = createSelector(callStuff, callStuff => storeName=>callStuff(storeName).results)

  return {
    calls,
    call,
    callStuff,
    callPhase,
    isSetup,
    isStarted,
    //apiStore,
    results,
  }
}

export class Api {
  constructor(props) {
    Object.assign(this, props)
    this.I_am_an_Api_instance_I_dont_belong_in_a_store = true
    props.I_am_an_api_store_obj = true

    this.apiReducer = // stuff about the api that goes in a store
      (state=props, action) => {
        //console.log(`I'm an api store obj, I don't expect to change`, {state,action})
        return state
      }
    this.callReducer = (state={}, action) => {
      let {type, payload, apiName, apiPathname, params, url,
            results, error, err, api, } = flattenAction(action)
      if (typeof apiName === 'undefined') 
        return state
      let pending 
      switch (type) {
        case apiActions.API_CALL:
          pending = true
          params = payload
          if (api.paramValidation && !api.paramValidation(payload)) {
            console.error('invalid params', params)
            return state
          }
          url = apiGetUrl(apiPathname, payload)
          type = apiActions.API_CALL_LOAD
          break
        case apiActions.API_CALL_LOAD:
          return action
        case apiActions.API_CALL_FULFILLED: // payload should have results
          pending = false
          if (this.resultsReducer) {
            console.error("ignoring results, make sure resultsReducer runs")
            //err = payload
            //error = true
            //type = apiActions.API_CALL_REJECTED
          } else {
            results = payload
          }
          break
        case apiActions.API_CALL_REJECTED:
          pending = false
          err = payload
          error = true
        default:
          return state
      }
      action = util.makeAction({
        type, action, meta:{call:{url, pending, error, err, params, results}, api}
      })
      delete action.payload // payload should be in meta in correct field now
      //examineAction({from:'apiCall',action, state})
      return action
    }
    this.callsReducer = // stuff about the api that goes in a store
      (state={}, action) => {
        let {type, payload, apiName, apiPathname, params, url,
              results, error, err, api, } = flattenAction(action)
        if (apiName !== props.apiName)
          return state
        let call
        if (action.type === apiActions.API_CALL) {
          call = this.callReducer({},action)
        } 
        if (action.type.match('^'+apiActions.API_CALL)) {
          let {storeName} = (action.meta||{})
          call = call || this.callReducer(state[storeName], action)
          //console.error({action, call, state})
          return { ...state, [storeName]: call, }
        }
        return state
      }
    this.actionCreators = {
      load: (opts={}) => {
              let {params, storeName='primary'} = opts
              return ({ type: apiActions.API_CALL,
                        payload: params,
                        meta: {storeName, api:props}
                      })
            },
    }

    // get rid of all this stuff and move to ducks when possible
    this.selectors = apiName => ({
      //...plainSelectors,  // already wasn't using
      //...props.plainSelectors,
      ...apiSelectorMakers(apiName),
      ..._.mapValues(
            props.apiSelectorMakers, s=>s(apiName)),
    })
  }
}

export const flattenAction = action => {
  let {type, payload, meta, } = action
  let actionError = action.error
  let {storeName, api, call} = (meta||{})
  let {apiName, apiPathname} = (api||{})
  let {url, params, results, error, err, } = (call||{})
  if (error && actionError) {
    throw new Error("not sure what to do")
  }
  return {type, payload, apiName, apiPathname, storeName, url, 
          api, call, params, results, error, err}
}