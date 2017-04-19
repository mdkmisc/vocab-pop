
/* eslint-disable */
const DEBUG = true;

import { createSelector } from 'reselect'
import { combineReducers, } from 'redux'

import {actionTypes, apiStore} from './apiGlobal'
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
// some of the structure came from
// https://github.com/reactjs/redux/tree/master/examples/tree-view

const { API_CALL,
        API_CALL_NEW,
        API_CALL_STARTED,
        API_CALL_FULFILLED,
        API_CALL_REJECTED,
        CACHE_DIRTY,
                      } = actionTypes

export const actionCreators = {
  ...vocab.apiActionCreators,
}
export const apiNames = {
  ...vocab.apiNames,
}

// reducers
const apiCall = (state={}, action) => {
  let {type, payload={}, meta={}, error } = action
  //const { expectedParamKeys, url, results, status, err } = meta.apiObj
  if (typeof payload.apiName === 'undefined') return state
  let status = type
  payload = {...payload, status}
  //examineAction({from:'apiCall',action, state})
  switch (type) {
    case API_CALL:
      return {...payload, pending: false, status: API_CALL_NEW}
    case API_CALL_STARTED:
      return {...payload, pending: true}
    case API_CALL_FULFILLED: // payload should have results
      return {...payload, pending: false}
    case API_CALL_REJECTED:
      return {...payload, pending: false, error: true}
  }
  return state
}
const apiCalls = (state={}, action) => {
  let {type, payload={}, meta={}, error } = action
  if (type.match('^'+API_CALL)) {
    let {apiName, params, url} = payload
    let callState = state[url]
    if (type === API_CALL) {
      url = apiGetUrl(apiName, params)
      payload = {...payload, url}
      action = {...action, payload}
      callState = undefined
    }
    callState = apiCall(callState, action)
    //examineAction({from:'apiCalls',action, url, state})
    return { ...state, [url]: callState, 
              currentResults:currentResults(callState,action) }
  }
  return state
}
const currentResults = (state={}, action) => {
  let {type, payload={}, meta={}, error } = action
  if (type === API_CALL_FULFILLED) {
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
  action$.ofType(API_CALL)
    //.do(action=>examineAction({from:'apiCallEpic start',action$, action, state:store.getState()}))
    .mergeMap(action=>{
      let {payload} = action
      let {apiName, params} = payload
      let url = apiGetUrl(apiName, params)
      payload = store.getState().api.apiCalls[url]
      action = {...action, payload}
      let ajax = 
        checkCacheDirty(store)
                //.do(response=>examineAction({from:'apiCallEpic after start',action$, response, action, state:store.getState()}))
          .switchMap(dirty=>{
            return cachedAjax(url)
          })
          .switchMap(results=>{
            payload = {...payload, results}
            action = {...action, payload, 
                        type:API_CALL_FULFILLED}
            return Rx.Observable.of(action)
          })
          .catch(err => {
            payload = {...payload, err}
            action = {...action, payload, 
                        type:API_CALL_REJECTED}
            return Rx.Observable.of(action)
          })

      //payload = {...payload, ajax}
      action = {...action, payload, type:API_CALL_STARTED}
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
        return Rx.Observable.of({type: CACHE_DIRTY, payload: {[Date()]:results}})
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
export const selectors = {
  apiStore,
}





// these are 'selectors' but they don't need to be
// connected to anything beyond config, which is
// imported here. also they might only be used here
const {cdmSchema, resultsSchema} = config
const baseUrl = () => `${config.apiRoot}/${config.apiModel}`
const apiGetUrl = (apiName, params) => 
  getUrl(`${baseUrl()}/${apiName}`, 
         {...params, cdmSchema, resultsSchema})

const getUrl = (url, params={}) => {
  //console.error('in getUrl', {url,params})
  if (_.isEmpty(params)) return url
  return encodeURI(
    url + '?' + _.keys(params) 
                  .sort()
                  .map( key => `${key}=${params[key]}`)
                  .join('&')
  )
}

export default combineReducers({ 
  apiCalls, 
  currentResults, 
  vocab: vocab.apiReducer,
  //...selectors,
  // probably don't need exporting
  //cdmSchema, resultsSchema, baseUrl, apiGetUrl, 
})
