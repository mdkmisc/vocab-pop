const DEBUG = true;
import React, { Component } from 'react';
import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';

import Rx from 'rxjs/Rx';
import _ from 'supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import yaml from 'js-yaml';
import settingsYaml from './appSettings.yml';
//import qs from 'qs';
//var qs = require('qs');
//if (DEBUG) window.qs = qs;
var myqs = {
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

let apiStreams = {};


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

// exported streams
//          BehaviorSubject means subscribers get latest
//          value and get called when value changes
export var tableConfig = new Rx.BehaviorSubject({});
export var statsByTable = new Rx.BehaviorSubject([]);
export var conceptCount = new Rx.BehaviorSubject(0);
export var conceptStats = new Rx.BehaviorSubject([]);
export var classRelations = new Rx.BehaviorSubject([]);
export var userSettings = new Rx.BehaviorSubject({filters:{}});
export var apiCalls = new Rx.Subject({});

var streams = {
                  tableConfig,
                  statsByTable,
                  conceptCount,
                  conceptStats,
                  classRelations,
                  userSettings,
                  //stateChange,
};
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
  console.log('state change', change);
  console.warn('get rid of userSettings');
  userSettings.next(newState);
  stateChange.next(change);
  if (_.has(change, 'filters')) {
    console.warn("quit fetching data on filter change like this");
    fetchData();
  }
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
export function subscribeState(path, cb) {
  return (
    stateChange
        .filter(change => _.getPath(change, path))
        .map(change => _.getPath(change, path))
        .subscribe(cb));
}

export function initialize({history:_history}) {
  history = _history;
  let urlStateOnLoadingPage = getState();
  let appDefaults = { filters: _appSettings.filters, };
  saveState(_.merge({}, appDefaults, urlStateOnLoadingPage));

  tableConfig.next(_appSettings.tables);

  /*
  conceptStats.subscribe(
    cs => {
      var sbt = _.supergroup(cs, ['table_name','column_name','domain_id','vocabulary_id']);
      statsByTable.next(sbt);
    });
  */
}

function fetchData() {
  console.log("NOT FETCHING DATA");
  return;

  AppData.cacheDirty().then(() => {
    AppData.classRelations(userSettings.getValue().filters).then(d=>classRelations.next(d));
    AppData.conceptCount(userSettings.getValue().filters).then(d=>conceptCount.next(d));
    AppData.conceptStats(userSettings.getValue().filters).then(d=>conceptStats.next(d));
  })
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
        this.behaviorSubj.next(this);
        if (cb) {
          cb(this.results);
        }
        return this.results;
        //this.behaviorSubj.complete();
      });
  }
  /* subscribe(cb) { return this.behaviorSubj.subscribe(cb); } */
}
export class StreamsSubscriber {
  constructor(callback) {
    this.callback = callback;
  }
  filter(filter) {
    //this.subscription.unsubscribe();
    if (this.subscription) this.subscription.unsubscribe();
    this.streams = _.filter(ApiStream.instances, filter);
    this.latest = 
      Rx.Observable.combineLatest(
        this.streams.map(d=>d.behaviorSubj));
    //this.subscription = this.latest.subscribe(this.stream);
    if (this.subscription) 
      this.subscription.unsubscribe();
    return this.subscription = this.latest.subscribe(this.callback);
  }
  setCallback(cb) {
    this.callback = cb;
  }
}

/* @function makeStream
 *  @param opts object
 *  @param opts.apiCall string   // name of api call
 *  @param opts.params [object]  // apiCall params
 *  @param opts.singleValue [boolean]  // whether to return a single value instead of array
 *  @param opts.transformResults [function]  // callback on results returning object to call setState with
 *  @returns string // streamKey, which is valid get url, though stream is based on post url
 */
export function makeStream({apiCall, 
                            params, 
                            singleValue = false,
                            transformResults
                          }) {

  let streamKey = AppData.apiGetUrl(apiCall, params);

  if (_.has(streams, streamKey))
    return streamKey;

  let stream = streams[streamKey] = new Rx.BehaviorSubject([]);

  AppData.apiCall(apiCall, params)
          .then(results => {
            if (singleValue)
              results = results[0];
            if (transformResults)
              results = transformResults(results);
            stream.next(results);
            return results;
          });
  return streamKey;
}


/* @function subscribe
 *  @param component ReactComponent
 *  @param streamName string // name of existing stream
 *  @param subName [string|boolean]  
 *      // name of state property or false to call 
 *      // setState with results (results must be singleValue object, not array)
 * has major side effects, just for convenience.
 * makes api call and subscribes component state to results
 *  @returns streamName string
 */
export function subscribe(component, streamName, subName) {
  let getNamesFromResults = false;
  if (subName === false) {
    getNamesFromResults = true;
  }
  subName = subName || streamName;
  component._subscriptions = component._subscriptions || {};

  component._subscriptions[subName] =
    component._subscriptions[subName] ||
    getStream(streamName).subscribe(
      results => {
        setTimeout(
          () => {
            console.log(component.constructor.name, 
                        'has new value for', streamName);
            if (getNamesFromResults) {
              component.setState(
                _.merge({},component.state, results));
            } else {
              component.setState({[subName]: results});
            }
          }, 100);
      });
  return component._subscriptions[subName];
}
export function getStream(streamName) {
  return streams[streamName];
}
export function unsubscribe(component) {
  _.each(component._subscriptions, sub => sub.unsubscribe());
}

/*
  Rx.Observable.combineLatest(appSettings, statsByTable)
              .scan((acc, [as, ts] = []) => {
                debugger;
                return _.merge({}, 
                               _.fromPairs(ts.map(t=>[t.toString(),{}])),
                               as.tables,
                               acc);
              }, {})
              .subscribe(tc=>{
                console.log(tc);
              })
*/


/*
conceptStats.subscribe(
  conceptStats => {
    tableNames.forEach(tableName =>(tables[tableName] = tables[tableName] || {}));
  });
*/
// fetch on load
(function() {
  /*
  let attrQueries = settings.conceptAttributes.map(
    (attr) => {
      return (
        _conceptStats({attr})
        .then((counts) => {
          counts.forEach(count=>{
            if (attr === 'table_name') {
              count.table_name = count.table_name.replace(/^[^\.]+\./, '');
            }
          });
          let sg = _.supergroup(counts, attr);
          appDataEE.emitEvent(`conceptStats/${attr}`, [sg]);
          return sg;
        })
      );
    });
  let breakdowns = {};
  appData.breakdowns = 
    Promise.all(attrQueries)
      .then((attrs) => {
        attrs.forEach(attr => {
          breakdowns[attr.dim] = attr;
        })
        return breakdowns;
      });
  */
})();

// this component is just for debugging, it shows current AppState
export class AppState extends Component {
  constructor(props) {
    const {location, params, route, router, routeParams, children} = props;
    super(props);
    this.state = {};

    tableSetup();
  }
  componentDidMount() {
    subscribe(this, 'statsByTable');
    subscribe(this, 'tableConfig');
    subscribe(this, 'classRelations');
    subscribe(this, 'userSettings');
    subscribe(this, 'conceptCount');
  }
  componentWillUnmount() {
    unsubscribe(this, 'statsByTable');
    unsubscribe(this, 'tableConfig');
    unsubscribe(this, 'classRelations');
    unsubscribe(this, 'userSettings');
    unsubscribe(this, 'conceptCount');
  }
  render() {
    console.log('AppState', this.state);
    const {location, params, route, router, routeParams, children} = this.props;
    return <Inspector data={ this.state } />;
  }
}

export function getTableConfig() {
  // is this still being used? shouldn't be
  return _appSettings.tables;
}


//import Rx from 'rxjs/Rx';
//var currentSettings = Rx.Observable(settings);

// yaml settings have info about how to display tables and some
// other random stuff not using most of. this function merges
// that data with table data from database
/*
export function moreTables(tableNames) {
  var tables = _.clone(tables);
  tableNames.forEach(tableName =>(tables[tableName] = tables[tableName] || {}));
  tableSetup();
  appSettings.next(_.merge({}, 
}
*/

// sets up table list for Tables component
function tableSetup() {
  _appSettings.tableList = 
    _.map(_appSettings.tables, 
          (table, tableName) => {
            table.tableName = table.tableName || tableName;
            table.rank = table.rank || 300;
            table.headerLevel = (table.rank).toString().length - 1;
            if (table.headerLevel > 1) 
              table.hidden = true;
            return table;
          });
  _appSettings.tableList = _.sortBy(_appSettings.tableList, ['rank','tableName']);
}


//let settings = _.merge({}, domainsYaml);
