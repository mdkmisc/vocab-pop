/* eslint-disable */
//const DEBUG = true;
import * as util from './utils';
import React, { Component } from 'react';
//import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';
import Rx from 'rxjs/Rx';
import _ from './supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
//import yaml from 'js-yaml';

var reduxStore = {};
var reduxHistory = {};
var config;
var {cdmSchema,resultsSchema,apiRoot,apiModel} = {} // nothing till init
var {apiCall, apiGetUrl, cacheDirty, apiCallBaseUrl} = {} // nothing till init
var ready = new Rx.Subject();
var readyPromise = ready.toPromise();

export function initialize(store, history) {
  //console.error('initializing AppState with history and store')
  reduxStore = store
  reduxHistory = history
  config = reduxStore.getState().config;
  ({cdmSchema,resultsSchema,apiRoot,apiModel} = config);
  ({apiCall, apiGetUrl, cacheDirty, apiCallBaseUrl} = appDataGen(config));
  let dirtyPromise = cacheDirty()
  dirtyPromise.then(() => {
    util.JsonFetcher.blockTillReadyForFetching = false
    ready.next(true);
    ready.complete();
  })
  /*
  console.log('this stuff is broken for now! switching to redux');
  OLD_GLOBAL_HISTORY = JUNK_HISTORY_FOR_GLOBAL;
  let urlStateOnLoadingPage = getState();
  return AppData.cacheDirty();
  */
}
function appDataGen({cdmSchema,resultsSchema,apiRoot,apiModel} = config) {
  function apiCallBaseUrl(apiCall, params={}) {
    params.cdmSchema = params.cdmSchema || cdmSchema;
    params.resultsSchema = params.resultsSchema || resultsSchema;

    let _apiRoot = params.apiRoot || apiRoot;
    let _apiModel = params.apiModel || apiModel;
    delete params.apiRoot;
    delete params.apiModel;
    return `${_apiRoot}/${_apiModel}/${apiCall}`;
  }
  function apiGetUrl(apiCall, params) {
    DEBUG && console.log(util.getUrl(apiCallBaseUrl(apiCall, params), params));
    return util.getUrl(apiCallBaseUrl(apiCall), params);
  }
  // api calls return promises, except apiCallMeta
  // which returns a promise wrapped in some metadata

  function cacheDirty() {
    //DEBUG && console.error('running cacheDirty');
    return fetch(`${apiCallBaseUrl('')}cacheDirty`)
      .then(response => {
        return response.json()
          .then(
            results => {
              if (results) {
                //console.warn('sessionStorage cache is dirty, emptying it');
                DEBUG && console.warn(`cache dirty. removing ${_.keys(sessionStorage).length} items in sessionStorage`);
                sessionStorage.clear();
              } else {
                DEBUG && console.warn(`cache clean. ${_.keys(sessionStorage).length} items in sessionStorage`);
              }
              return results;
            })
      });
  }
  function apiCall(apiCall, params={}) {
    return (
      util.cachedGetJsonFetch(
            apiCallBaseUrl(apiCall), params
      )
        .then(function(json) {
          if (json.error)
            console.error(json.error.message, json.error.queryName, json.error.url);
          /*
          json.forEach(rec=>{
            //rec.conceptrecs = parseInt(rec.conceptrecs, 10);
            //rec.dbrecs = parseInt(rec.dbrecs, 10);
            //rec.table_name = rec.table_name.replace(/^[^\.]+\./, '');
          })
          */
          return json;
        }));
  }
  return {apiCall, apiGetUrl, cacheDirty, apiCallBaseUrl};
}

//var d3 = require('d3');
//import qs from 'qs';
//var qs = require('qs');
//if (DEBUG) window.qs = qs;
export var myqs = {
  stringify: obj=>encodeURI(JSON.stringify(obj)),
  parse: json=>JSON.parse(decodeURI(json||'{}'))
}


/* makeStream should only make api calls once
 *  (does that already)
 * a component should only need one subscription
 *  for all the api calls (and user settings?)
 *  it wants to track.
 *
 */


//export var OLD_GLOBAL_HISTORY; /* global history object set in index.js */

export var classRelations = new Rx.BehaviorSubject([]);
export var userSettings = new Rx.BehaviorSubject({filters:{}});
export var apiCalls = new Rx.Subject({});

var stateChange = new Rx.BehaviorSubject();
export function deleteState(key) {
  saveState(key, null, true);
}
export function saveStateN({change, key, val, deleteProp, deepMerge=true}) {
  //if (!ready.isStopped) throw {err: "not ready!"}
  console.error("switching to redux!", change, key, val, reduxStore, reduxHistory );
  //router.history.push(router.history.location.pathname, {[key]:val});
  //return router.history.location; // just to return something...this is all broken

  /*
  // need a named param version but don't want to break the original
  if (!change) {
    if (typeof val === 'undefined') {
      // no key/val, received entire change object
      change = _.merge({}, key);
    } else {
      change = _.set({}, key, val);
    }
  }
  let loc = OLD_GLOBAL_HISTORY.getCurrentLocation();
  //let oldState = qs.parse(loc.search.substr(1),{ strictNullHandling: true });
  let oldState = myqs.parse(loc.search.substr(1));
  let newState = deepMerge
                    ? _.merge({}, oldState, change)
                    : Object.assign({}, oldState, change);

  if (typeof stateChange.getValue() === 'undefined') {
    stateChange.next(newState); // make sure there's an initial state change
    return;
  }

  if (deleteProp) {
    let tmp = _.cloneDeep(oldState);
    _.unset(tmp, key);
    newState = tmp;
  }
  if (_.isEqual(oldState, newState)) return;

  //console.log('AppState.saveState', key, val, newState);
  let newLoc = {  pathname: loc.pathname, 
                  //search: '?' + qs.stringify(newState,{ strictNullHandling: true }),
                  search: '?' + myqs.stringify(newState),
                };
  //console.log('new location', newLoc);
  OLD_GLOBAL_HISTORY.push(newLoc);
  //console.log('state change', change);
  stateChange.next(change);
  */
}
export function saveState(key, val, deleteProp) {
  return saveStateN({key,val,deleteProp});
}
_.mixin({
  getPath: (obj,path) => (_.isEmpty(path) 
                            ? obj
                            : _.get(obj, path))
  });
window.getState = getState;
window.saveState = saveState;
window.deleteState = deleteState;
export function getState(path) {
  return _.get(reduxStore.getState(), path);
  console.log('get state from redux!!', path);
  return {};
  /*
  var loc = OLD_GLOBAL_HISTORY.getCurrentLocation();
  //var state = qs.parse(loc.search.substr(1),{ strictNullHandling: true });
  var state = myqs.parse(loc.search.substr(1));
  return _.getPath(state, path);
  */
}
export function stateStream(path) {
  if (!path) return stateChange;
  return (
    stateChange
        .filter(change => _.getPath(change, path))
        .map(change => _.getPath(change, path)));
}
export function subscribeState(path, cb) {
  return stateStream(path).subscribe(cb);
}

/* @class ApiStream
 *  @param opts object
 *  @param opts.apiCall string   // name of api call
 *  @param opts.params [object]  // apiCall params
 *  @param opts.singleValue [boolean]  // whether to return a single value instead of array
 *  @param opts.transformResults [function] apply function to rows before returning them
 *  @returns string // streamKey, which is valid get url, though stream is based on post url
 */
export class ApiStream extends util.JsonFetcher {
  // instances are unique (or re-used if they wouldn't be)
  // and stored in ApiStream.instances (as a result
  // of inheriting from util.JsonFetcher)
  constructor({apiCall, params, meta, transformResults, 
              singleValue, cb, wantRxAjax}) {

    // from old AppData.ApiFetcher constructor:
    let baseUrl = apiCallBaseUrl(apiCall, params);
    let instance = super(baseUrl, params, meta, readyPromise, wantRxAjax );
    if (!instance.newInstance) return instance;
    if (!instance.newInstance) {
      if (instance.resultsSubj && instance.resultsSubj.isStopped)
        instance.resultsSubj = new Rx.BehaviorSubject(instance.results);
      return instance;
    }
    // AppState.ApiStream should do it's own transforming
    // so it can better control (run singleValue first)
    if (wantRxAjax) {
      // sloppy patch
      return
    }
    if (transformResults) {
      this.fetchPromise = this.fetchPromise.then(transformResults);
    }



    this.resultsSubj = new Rx.BehaviorSubject('NoResultsYet');
    this.fetchPromise.then(
      results=>{
        //console.log('fetchPromise resolved in ApiState!!!', results)
        if (results.error) {
          this.resultsSubj.error(results.error);
          return;
        }
        if (singleValue) results = results[0];
        if (transformResults) {
          //console.log('transform', results);
          results = transformResults(results);
          //console.log('to', results);
        }
        this.results = results;
        if (this.resultsSubj.isStopped) {
          console.warn("got results for unsubscribed ApiStream", results);
          return;
        }
        this.resultsSubj.next(this.results);
        if (cb) {
          cb(this.results);
        }
        return this.results;
        //this.resultsSubj.complete();
      })
      .catch(err => {
        //console.log('fetchPromise failed in utils!!!', err)
      })
  }
  unsubscribe() { return this.resultsSubj.unsubscribe(); }
  subscribe(cb) { 
    return this.resultsSubj.subscribe(results=>{
      if (results === 'NoResultsYet') return;
      cb(results, this); 
    });
  }
}
/*
export class StreamsSubscriber {
  constructor(callback) {
    this.callback = callback;
  }
  /* picks the streams and subscribes the callback
   * if there's an existing subscription, unsubscribe from it
   * /
  filter(filtFunc) { 
    this.filtFunc = filtFunc;
    if (this.subscription) this.subscription.unsubscribe();
    this.streams = _.filter(ApiStream.instances, filtFunc);
    this.latest = Rx.Observable.combineLatest(
        this.streams.map(d=>d.resultsSubj));
    if (this.subscription) 
      this.subscription.unsubscribe();
    return (this.subscription = 
              this.latest.debounceTime(20)
                  .subscribe(this.callback));
  }
  setCallback(cb) {
    this.callback = cb;
  }
  unsubscribe() {
    if (this.subscription) 
      this.subscription.unsubscribe();
  }
}
*/

// this component is just for debugging, it shows current AppState
export class AppState extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //appSettings,
    };
  }
  componentDidUpdate() {
  }
  render() {
    return <Inspector 
              data={{nothingHereRightNow:true}}
              //data={ this.state.appSettings['use cases'] } 
              search={false}
              isExpanded={()=>true}
              /*
              isExpanded={
                keypath => {
                  console.log(keypath);
                  return keypath.match(/(use cases|to-dos)/);
                }
              }
              */
            />;
  }
}

