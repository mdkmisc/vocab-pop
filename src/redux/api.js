
/* eslint-disable */
const DEBUG = true;

import { createSelector } from 'reselect'
import { combineReducers, } from 'redux'

import {apiActions, Apis,} from './apiGlobal'
import config from '../config'
import * as util from '../utils';
import React, { Component } from 'react';
//import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';
import Rx from 'rxjs/Rx';
//import { ajax } from 'rxjs/observable/dom/ajax';
import _ from '../supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
var ALLOW_CACHING = [
  '.*',
  //'/WebAPI/[^/]+/person/',
];

import * as vocab from './ducks/vocab'

/* added themselves...not good, but don't fix now
const _apis = {
  ...vocab.apis,
}
*/
export const apis = Apis

export const loader = apiName => apis.get(apiName).loader

// some of the structure came from
// https://github.com/reactjs/redux/tree/master/examples/tree-view

// reducers
const apiCall = (state={}, action) => {
  let {type, payload={}, meta={}, error } = action
  const {apiName, paramValidation} = payload
  //const { expectedParamKeys, url, results, status, err } = meta.apiObj
  if (typeof apiName === 'undefined') return state
  let status = type
  payload = {...payload, status}
  //examineAction({from:'apiCall',action, state})
  switch (type) {
    case apiActions.API_CALL:
      return {...payload, pending: false, status: apiActions.API_CALL_NEW}
    case apiActions.API_CALL_STARTED:
      return {...payload, pending: true}
    case apiActions.API_CALL_FULFILLED: // payload should have results
      return {...payload, pending: false}
    case apiActions.API_CALL_REJECTED:
      return {...payload, pending: false, error: true}
  }
  return state
}
const apiCalls = (state={}, action) => {
  let {type, payload={}, meta={}, error } = action
  if (type.match('^'+apiActions.API_CALL)) {
    let {apiName, params, url, paramValidation} = payload
    let {apiObj={}} = meta
    if (apiObj.paramTransform)
      params = apiObj.paramTransform(params)
    let callState = state[url]
    if (type === apiActions.API_CALL) {
      if (paramValidation && !paramValidation(params)) {
        console.error('invalid params', params)
        return state
      }
      url = apiGetUrl(apiName, params)
      payload = {...payload, url}
      action = {...action, payload}
      callState = undefined
    }
    callState = apiCall(callState, action)
    //examineAction({from:'apiCalls',action, url, state})
    return { ...state, [url]: callState, 
              //currentResults:currentResults(callState,action) 
           }
  }
  return state
}
const currentResults = (state={}, action) => {
  let {type, payload={}, meta={}, error } = action
  if (type === apiActions.API_CALL_FULFILLED) {
    //console.log(action)
    let {apiName, storeName, url} = payload
    return {...state,
            [storeName]: url}
  }
  return state
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

const apiCallEpic = (action$, store) => (
  action$.ofType(apiActions.API_CALL)
    //.do(action=>examineAction({from:'apiCallEpic start',action$, action, state:store.getState()}))
    .mergeMap(action=>{
      let {payload} = action
      let {apiName, params} = payload
      let api = Apis.get(apiName)
      if (api.paramTransform)
        params = api.paramTransform(params)
      let url = apiGetUrl(apiName, params)
      payload = store.getState().api.apiCalls[url]
      //console.log(url.slice(0,90))
      action = {...action, payload}
      //console.log({params, url,action})
      let ajax = 
        checkCacheDirty(store)
                //.do(response=>examineAction({from:'apiCallEpic after start',action$, response, action, state:store.getState()}))
          .switchMap(dirty=>{
            //console.log(url.slice(0,90))
            return cachedAjax(url)
          })
          .switchMap(results=>{
            payload = {...payload, results}
            action = {...action, payload, 
                        type:apiActions.API_CALL_FULFILLED}
            return Rx.Observable.of(action)
          })
          .catch(err => {
            payload = {...payload, err}
            action = {...action, payload, 
                        type:apiActions.API_CALL_REJECTED}
            return Rx.Observable.of(action)
          })

      //payload = {...payload, ajax}
      action = {...action, payload, type:apiActions.API_CALL_STARTED}
      //examineAction({from:'starting',action, state:store.getState()})
      store.dispatch(action)
      return ajax
    })
)
export const epics = [
  apiCallEpic,
  ...(vocab.apiEpics||{}),
]

export const cachedAjax = url => {
  //console.log(url.slice(0,90))
  if (isCached(url)) return Rx.Observable.of(util.storageGet(url))
  let rxAjax = Rx.Observable.ajax.getJSON(url)
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
  return (
    Rx.Observable.ajax.getJSON(apiGetUrl('cacheDirty'))
      .do(results => {
        if (results) {
          DEBUG && console.warn(`cache dirty. removing ${_.keys(util.storage()).length} items in util.storage()`);
          util.storageClear()
        } else {
          DEBUG && console.warn(`cache clean. ${_.keys(util.storage()).length} items in util.storage()`);
        }
      })
      .mergeMap(results => {
        return Rx.Observable.of({type: apiActions.CACHE_DIRTY, payload: {[Date()]:results}})
      })
  )
}

/* instructions on connecting selectors with access to props (as well as state)
 * from: https://github.com/reactjs/reselect#connecting-a-selector-to-the-redux-store
 * currently wired up in SourceTargetSource/container.js
 */

/*
const apiResults = 
  _.mapValues(apiNames, apiName =>
        createSelector(
                  apiStore,
                  apiStore => {  // assume storeName === apiName
                    return apiStore(apiName)
                  }
                )
  )
*/


// these are 'selectors' but they don't need to be
// connected to anything beyond config, which is
// imported here. also they might only be used here
const {cdmSchema, resultsSchema} = config
const baseUrl = () => `${config.apiRoot}/${config.apiModel}`
const apiGetUrl = (apiName, params) => 
  getUrl(`${baseUrl()}/${apiName}`, 
         {...params, cdmSchema, resultsSchema})

const getUrl = (path, params={}) => {
  //console.error('in getUrl', {url,params})
  if (_.isEmpty(params)) return path

  let qs = myrouter.toqs(params)
  let url = `${path}?${qs}`
  //console.log({url,params})
  return url
}

export default combineReducers({ 
  //apis: (state,props) => apis, // so apiGlobal can get to it without circular dependency
  apiCalls, 
  currentResults, 
})
