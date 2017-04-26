
/* eslint-disable */
const DEBUG = true;

import { createSelector } from 'reselect'
import { combineReducers, } from 'redux'

import {apiActions, Apis, parseAction, makeAction} 
      from './apiGlobal'
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

export const apis = Apis

export const loader = apiName => apis.get(apiName).loader

// some of the structure came from
// https://github.com/reactjs/redux/tree/master/examples/tree-view

// reducers
const apiCall = (state={}, action) => {
  let {type, payload, apiName, apiPathname, params, url,
        results, error, err, apiObj} = parseAction(action)
  if (typeof apiName === 'undefined') return state
  let pending 
  switch (type) {
    case apiActions.API_CALL:
      pending = false
      params = payload
      if (apiObj.paramValidation && !apiObj.paramValidation(payload)) {
        console.error('invalid params', params)
        return state
      }
      url = apiGetUrl(apiPathname, payload)
      break
    case apiActions.API_CALL_STARTED:
      pending = true
      break
    case apiActions.API_CALL_FULFILLED: // payload should have results
      pending = false
      results = payload
      break
    case apiActions.API_CALL_REJECTED:
      pending = false
      err = payload
      error = true
    default:
      return state
  }
  action = makeAction({
    action, meta:{url, pending, error, params, results}
  })
  delete action.payload // payload should be in meta in correct field now
  //examineAction({from:'apiCall',action, state})
  return action
}
const apiCalls = (state={}, action) => {
  let {type, payload, apiName, url, apiObj={}} = parseAction(action)
  console.log(action)
  if (type === apiActions.API_CALL) {
    action = apiCall(null, action)
  } else if (type.match('^'+apiActions.API_CALL)) {
    action = apiCall(action, action)
    //examineAction({from:'apiCalls',action, url, state})
  } else {
    return state
  }
  return { ...state, [action.meta.storeId]: action, }
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
      let {apiName, storeName, } = parseAction(action)
      let storeId = Apis.storeId(apiName,storeName)
      action = store.getState().api.apiCalls[storeId]
      let {type, payload, url, apiObj,} = parseAction(action)
      let ajax = 
        checkCacheDirty(store)
                //.do(response=>examineAction({from:'apiCallEpic after start',action$, response, action, state:store.getState()}))
          .switchMap(dirty=>{
            return cachedAjax(url)
          })
          .switchMap(results=>{
            action = makeAction(
              {action, payload:results,
                type:apiActions.API_CALL_FULFILLED})
            return Rx.Observable.of(action)
          })
          .catch(err => {
            action = makeAction(
              {action, payload:err,
                type:apiActions.API_CALL_REJECTED})
            return Rx.Observable.of(action)
          })

      action = makeAction({
        action, type:apiActions.API_CALL_STARTED})
      //examineAction({from:'starting',action, state:store.getState()})
      console.error(action)
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

export default combineReducers({ 
  apiCalls, 
})
