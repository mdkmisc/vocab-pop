const DEBUG = true;
import yaml from 'js-yaml';
import _ from 'supergroup'; // lodash would be fine here

import settingsYaml from './settings.yml';
let settings = yaml.safeLoad(settingsYaml);
tableSetup();
if (DEBUG)
  window.settings = settings;

//import Rx from 'rxjs/Rx';
//var currentSettings = Rx.Observable(settings);

function moreTables(tableNames) {
  tableNames.forEach(
    tableName => {
      settings.tables[tableName] = settings.tables[tableName] || {};
    });
  tableSetup();
}

function tableSetup() {
  settings.tableList = 
    _.map(settings.tables, 
          (table, tableName) => {
            table.tableName = table.tableName || tableName;
            table.rank = table.rank || 300;
            table.headerLevel = (table.rank).toString().length - 1;
            if (table.headerLevel > 1) 
              table.hidden = true;
            return table;
          });
  settings.tableList = _.sortBy(settings.tableList, ['rank','tableName']);
}

export {settings as default, moreTables, };

//let settings = _.merge({}, domainsYaml);
