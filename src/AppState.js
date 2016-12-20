import React, { Component } from 'react';
import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';

import Rx from 'rxjs/Rx';
import _ from 'supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import yaml from 'js-yaml';
import settingsYaml from './appSettings.yml';
import _AppData from './AppData'; // can't import till appSettings loaded

var _appSettings = yaml.safeLoad(settingsYaml); // default app settings:
const AppData = _AppData(_appSettings);

// thought i might do more with appSettings, but nothing now
export var appSettings = _appSettings; 

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
export var stateChange = new Rx.Subject({});
export var apiCalls = new Rx.Subject({});

var streams = {
                  tableConfig,
                  statsByTable,
                  conceptCount,
                  conceptStats,
                  classRelations,
                  userSettings,
                  stateChange,
};
function fetchData() {
  console.log("FETCHING DATA");
  AppData.cacheDirty().then(() => {
    AppData.classRelations(userSettings.getValue().filters).then(d=>classRelations.next(d));
    AppData.conceptCount(userSettings.getValue().filters).then(d=>conceptCount.next(d));
    AppData.conceptStats(userSettings.getValue().filters).then(d=>conceptStats.next(d));
  })
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

var currentState = {};
export function saveState(key, val) {
  var change = typeof val === 'undefined' ? key : {[key]: val};
  currentState = _.merge({}, currentState, change);
  stateChange.next(change);
}
function saveStateToUrl() {
  var loc = history.getCurrentLocation();
  var curQuery = queryParse(loc.query);
  if (_.isEqual(currentState, curQuery))
    return;

  var query = {};
  _.each(currentState,
    (v,k) => {
      query[k] = JSON.stringify(v);
    });
  console.log('new history item', query);
  history.push({pathname: loc.pathname, query});
  userSettings.next(currentState);
}

export function initialize({history:_history}) {
  history = _history;
  tableConfig.next(_appSettings.tables);

  conceptStats.subscribe(
    cs => {
      var sbt = _.supergroup(cs, ['table_name','column_name','domain_id','vocabulary_id']);
      statsByTable.next(sbt);
    });

  stateChange.subscribe(
    change => {
      saveStateToUrl();
      if (_.has(change, 'filters')) {
        fetchData();
      }
    }
  );

  var initialState = _.merge(
    { filters: _appSettings.filters, },
    queryParse(history.getCurrentLocation().query)
  );
  saveState(initialState);
}

function queryParse(query) {
  let obj = {};
  _.each(query, (v,k) => {
                  obj[k] = JSON.parse(v);
                });
  return obj;
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
    debugger;
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
