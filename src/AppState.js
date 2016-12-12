import React, { Component } from 'react';
import Rx from 'rxjs/Rx';
import _ from 'supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import yaml from 'js-yaml';
import settingsYaml from './appSettings.yml';
import _AppData from './AppData'; // can't import till appSettings loaded

// default app settings:
export var appSettings = yaml.safeLoad(settingsYaml);


let completeState = {appSettings};
export function subscribe(req) {
  if (! _.has(completeState, req))
    console.error(`can't find ${req} in state`);
  var obs = Rx.Observable.fromPromise(completeState[req]);
  return obs.subscribe.bind(obs);
}

// fetch on load
(function() {
  const AppData = _AppData(appSettings);
  completeState.conceptCount = AppData.conceptCount();
  completeState.classRelations = AppData.classRelations();
  completeState.conceptStats = AppData.conceptStats();
  tableSetup();
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


export function getTableConfig() {
  return appSettings.tables;
}

export class AppStateDump extends Component {
  render() {
    let data = completeState;
    return <Inspector data={ data } />;
  }
}

//import Rx from 'rxjs/Rx';
//var currentSettings = Rx.Observable(settings);

// yaml settings have info about how to display tables and some
// other random stuff not using most of. this function merges
// that data with table data from database
export function moreTables(tableNames) {
  tableNames.forEach(
    tableName => {
      appSettings.tables[tableName] = appSettings.tables[tableName] || {};
    });
  tableSetup();
}

// sets up table list for Tables component
function tableSetup() {
  appSettings.tableList = 
    _.map(appSettings.tables, 
          (table, tableName) => {
            table.tableName = table.tableName || tableName;
            table.rank = table.rank || 300;
            table.headerLevel = (table.rank).toString().length - 1;
            if (table.headerLevel > 1) 
              table.hidden = true;
            return table;
          });
  appSettings.tableList = _.sortBy(appSettings.tableList, ['rank','tableName']);
}


//let settings = _.merge({}, domainsYaml);
