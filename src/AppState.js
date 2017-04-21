
// NOTHING LEFT IN THIS FILE EXCEPT ERROR THROWING STUBS SO 
// I'LL KNOW WHAT OTHER PARTS OF THE CODE NEED FIXING


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

import myrouter from '../myrouter'

var {cdmSchema,resultsSchema,apiRoot,apiModel} = {} // nothing till init
var {apiCall, apiGetUrl, apiCallBaseUrl} = {} // nothing till init
var ready = new Rx.Subject();
var readyPromise = ready.toPromise();

const throwError = () => {
  console.error("not using anymore")
  throw new Error("stop")
  debugger
}

/*
export var classRelations = new Rx.BehaviorSubject([]);
export var userSettings = new Rx.BehaviorSubject({filters:{}});
export var apiCalls = new Rx.Subject({});
var stateChange = new Rx.BehaviorSubject();
*/
export var classRelations = throwError
export var userSettings = throwError
export var apiCalls = throwError

var stateChange = throwError
export function deleteState(key) {
  throwError()
  //saveState(key, null, true);
}
export function saveState(key, val, deleteProp) {
  throwError()
  //return saveStateN({key,val,deleteProp});
}
/*
_.mixin({
  getPath: (obj,path) => (_.isEmpty(path) 
                            ? obj
                            : _.get(obj, path))
  });
window.getState = getState;
window.saveState = saveState;
window.deleteState = deleteState;
*/
export function getState(path) {
  throwError()
  /*
  return _.get(reduxStore.getState(), path);
  console.log('get state from redux!!', path);
  return {};
  */
  /*
  var loc = OLD_GLOBAL_HISTORY.getCurrentLocation();
  //var state = qs.parse(loc.search.substr(1),{ strictNullHandling: true });
  var state = myqs.parse(loc.search.substr(1));
  return _.getPath(state, path);
  */
}
export function stateStream(path) {
  throwError()
  /*
  if (!path) return stateChange;
  return (
    stateChange
        .filter(change => _.getPath(change, path))
        .map(change => _.getPath(change, path)));
  */
}
export function subscribeState(path, cb) {
  throwError()
  /*
  return stateStream(path).subscribe(cb);
  */
}

/* @class ApiStream
 *  @param opts object
 *  @param opts.apiCall string   // name of api call
 *  @param opts.params [object]  // apiCall params
 *  @param opts.singleValue [boolean]  // whether to return a single value instead of array
 *  @param opts.transformResults [function] apply function to rows before returning them
 *  @returns string // streamKey, which is valid get url, though stream is based on post url
 */
export class ApiStream {
  // instances are unique (or re-used if they wouldn't be)
  // and stored in ApiStream.instances (as a result
  // of inheriting from util.JsonFetcher)
  constructor({apiCall, params, meta, transformResults, 
              singleValue, cb, wantRxAjax}) {
    throwError()
    /*

    if (!wantRxAjax) throw new Error("switching to rx and redux")
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
      */
  }
  /*
  unsubscribe() { return this.resultsSubj.unsubscribe(); }
  subscribe(cb) { 
    return this.resultsSubj.subscribe(results=>{
      if (results === 'NoResultsYet') return;
      cb(results, this); 
    });
  }
  */
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
    throwError()
    super()
  }
}

