//const DEBUG = true;
import React, { Component } from 'react';
//import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';
import Rx from 'rxjs/Rx';
import _ from 'supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import yaml from 'js-yaml';
import settingsYaml from './appSettings.yml';


//var d3 = require('d3');
//import qs from 'qs';
//var qs = require('qs');
//if (DEBUG) window.qs = qs;
export var myqs = {
  stringify: obj=>encodeURI(JSON.stringify(obj)),
  parse: json=>JSON.parse(decodeURI(json||'{}'))
}


/* initialization flow
 *
 * 1) index.js imports this (AppState)
 * 2) appSettings.yml is loaded, parsed and exported
 *    as AppState.appSettings, which is immediately
 *    available to any component that imports AppState
 */
let _appSettings = yaml.safeLoad(settingsYaml); // default app settings:
export var appSettings = _appSettings; 
/* 3) import AppData, but it's not usable until it's
 *    been initialized with appSettings which provides
 *    values for {cdmSchema, resultsSchema, apiRoot}
 */
import _AppData from './AppData';
const AppData = _AppData(_appSettings);

//let apiStreams = {};


/* makeStream should only make api calls once
 *  (does that already)
 * a component should only need one subscription
 *  for all the api calls (and user settings?)
 *  it wants to track.
 *
 */

//var apiStreams = new Rx.BehaviorSubject({});
/*
 *  calls initialize with a router history object
 */




export var history; /* global history object set in index.js */

export var classRelations = new Rx.BehaviorSubject([]);
export var userSettings = new Rx.BehaviorSubject({filters:{}});
export var apiCalls = new Rx.Subject({});

var stateChange = new Rx.BehaviorSubject();
export function saveState(key, val) {
  let change;
  if (typeof val === 'undefined') {
    // no key/val, received entire change object
    change = _.merge({}, key);
  } else {
    change = _.set({}, key, val);
  }
  let loc = history.getCurrentLocation();
  //let oldState = qs.parse(loc.search.substr(1),{ strictNullHandling: true });
  let oldState = myqs.parse(loc.search.substr(1));
  let newState = _.merge({}, oldState, change);
  if (typeof stateChange.getValue() === 'undefined') {
    stateChange.next(newState); // make sure there's an initial state change
    return;
  }
  if (_.isEqual(oldState, newState)) return;

  let newLoc = {  pathname: loc.pathname, 
                  //search: '?' + qs.stringify(newState,{ strictNullHandling: true }),
                  search: '?' + myqs.stringify(newState),
                };
  //console.log('new location', newLoc);
  history.push(newLoc);
  //console.log('state change', change);
  stateChange.next(change);
  /*
  console.warn('get rid of userSettings');
  userSettings.next(newState);
  if (_.has(change, 'filters')) {
    console.warn("quit fetching data on filter change like this");
    fetchData();
  }
  */
}
_.mixin({
  getPath: (obj,path) => (_.isEmpty(path) 
                            ? obj
                            : _.get(obj, path))
  });
window.getState = getState;
window.saveState = saveState;
export function getState(path) {
  var loc = history.getCurrentLocation();
  //var state = qs.parse(loc.search.substr(1),{ strictNullHandling: true });
  var state = myqs.parse(loc.search.substr(1));
  return _.getPath(state, path);
}
export function stateStream(path) {
  return (
    stateChange
        .filter(change => _.getPath(change, path))
        .map(change => _.getPath(change, path)));
}
export function subscribeState(path, cb) {
  return stateStream(path).subscribe(cb);
}

export function initialize({history:_history}) {
  history = _history;
  let urlStateOnLoadingPage = getState();
  let appDefaults = { filters: _appSettings.filters, };
  saveState(_.merge({}, appDefaults, urlStateOnLoadingPage));
  return AppData.cacheDirty();
}

/* @class ApiStream
 *  @param opts object
 *  @param opts.apiCall string   // name of api call
 *  @param opts.params [object]  // apiCall params
 *  @param opts.singleValue [boolean]  // whether to return a single value instead of array
 *  @param opts.transformResults [function]  // callback on results returning object to call setState with
 *  @returns string // streamKey, which is valid get url, though stream is based on post url
 */
export class ApiStream extends AppData.ApiFetcher {
  // instances are unique (or re-used if they wouldn't be)
  // and stored in ApiStream.instances (as a result
  // of inheriting from util.JsonFetcher)
  constructor({apiCall, params, meta, transformResults, 
              singleValue, cb}) {
    super({apiCall, params, meta, });
    this.behaviorSubj = new Rx.BehaviorSubject(this);
    this.jsonPromise.then(
      results=>{
        if (results.error) {
          this.behaviorSubj.error(results.error);
          return;
        }
        if (singleValue) results = results[0];
        if (transformResults)
          results = transformResults(results);
        this.results = results;
        if (this.behaviorSubj.isStopped) {
          console.warn("got results for unsubscribed ApiStream", results);
          return;
        }
        this.behaviorSubj.next(this);
        if (cb) {
          cb(this.results);
        }
        return this.results;
        //this.behaviorSubj.complete();
      });
  }
  subscribe(cb) { return this.behaviorSubj.subscribe(cb); }
  unsubscribe() { return this.behaviorSubj.unsubscribe(); }
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
        this.streams.map(d=>d.behaviorSubj));
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
      appSettings,
    };
  }
  componentDidUpdate() {
  }
  render() {
    return <Inspector 
              data={ this.state.appSettings['use cases'] } 
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

