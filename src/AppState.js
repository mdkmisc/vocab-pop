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
export var userSettings = new Rx.BehaviorSubject({});
export var stateChange = new Rx.Subject({});

function fetchData() {
  console.log("FETCHING DATA");
  AppData.classRelations(userSettings.getValue().filters).then(d=>classRelations.next(d));
  AppData.conceptCount(userSettings.getValue().filters).then(d=>conceptCount.next(d));
  AppData.conceptStats(userSettings.getValue().filters).then(d=>conceptStats.next(d));
}

export function saveState(key, val) {
  var change = typeof val === 'undefined' ? key : {[key]: val};
  var current = userSettings.getValue();
  var newState = _.merge(current, change);
  userSettings.next(newState);
  stateChange.next(change);
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

  // userSettings stored on route querystring
  userSettings.subscribe(userSettings => {
        var loc = history.getCurrentLocation();
        var curQuery = queryParse(loc.query);
        if (_.isEqual(userSettings, curQuery))
          return;

        var query = {};
        _.each(userSettings,
          (v,k) => {
            query[k] = JSON.stringify(v);
          });
        history.push({pathname: loc.pathname, query});
    });
  // don't need to do initial data fetch because setting
  // state on load will do it
  //AppData.cacheDirty().then(fetchData)
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
    console.log('mounting AppState');
    this.statsByTable = statsByTable
          .subscribe(statsByTable=>this.setState({statsByTable}));
    this.tableConfig = tableConfig
          .subscribe(tableConfig=>this.setState({tableConfig}));
    this.classRelations = classRelations
          .subscribe(classRelations=>this.setState({classRelations}));
    this.userSettings = userSettings
          .subscribe(userSettings=>this.setState({userSettings}));
    this.conceptCount = conceptCount
          .subscribe(conceptCount=>this.setState({conceptCount}));
  }
  componentWillUnmount() {
    console.log('unmounting AppState');
    this.statsByTable.unsubscribe();
    this.tableConfig.unsubscribe();
    this.classRelations.unsubscribe();
    this.userSettings.unsubscribe();
    this.conceptCount.unsubscribe();
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
