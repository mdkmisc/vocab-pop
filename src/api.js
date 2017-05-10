
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
export const cachedAjax = url => {
  //console.log(url.slice(0,90))
  if (isCached(url)) return Rx.Observable.of(util.storageGet(url))
  let rxAjax = Rx.Observable.ajax.getJSON(url,{mode: 'no-cors'})
  rxAjax.subscribe(results => {
    util.storagePut(url, results)
  })
  return rxAjax
}
export const isCached = (url='') => {
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
