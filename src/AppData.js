const DEBUG = true;

import _ from 'supergroup';
import * as util from './utils';
import settings from './Settings';
import EventEmitter from 'wolfy87-eventemitter';
export var appDataEE = new EventEmitter();
import Rx from 'rxjs/Rx';


const { cdmSchema, resultsSchema, apiRoot, } = settings;

export var appData = {};

export var appDataResolved = {};

if (DEBUG) window.appData = appData;
if (DEBUG) window.appDataResolved = appDataResolved;

export var conceptStats = Rx.Observable.fromPromise(_conceptStats());

// fetch on load
(function() {
  appData.conceptCount = conceptCount();


  //conceptStatsResult.subscribe(x => console.log(x), e => console.error(e));


  /*
  appData.conceptStats = 
    conceptStats()
    .then(cs => {
      appDataEE.emitEvent('conceptStats', [cs]);
      return cs;
    });
  */
  appData.classRelations = classRelations();

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

export function dataToStateWhenReady(component, items) {
  // this doesn't work very well. switching to event broadcast



  // items is an array of appData keys, or, if empty, gets all
  if (!items) {
    items = _.keys(appData);
  }
  let promises = items.map(
    (item) => {
      return appData[item].then(
              (data) => {
                component.setState({[item]: data})
                if (DEBUG) appDataResolved[item] = data;
              }
      );
    });
  let allp = Promise.all(promises);
  window.allp = allp;
  console.log('all p', allp);
  return allp;
}

export function classRelations(params={}, queryName="classRelations") {
  params = _.clone(params);
  let apiCall = 'concepts';
  params.resultsSchema = resultsSchema;
  params.cdmSchema = cdmSchema;
  params.queryName = queryName;

  return (util.cachedPostJsonFetch(
          `${apiRoot}/${apiCall}Post`, params)
          .then(function(json) {
            if (json.error)
              console.error(json.error.message, json.error.queryName, json.error.url);

            json.forEach(rec=>{
              rec.is_hierarchical = !!parseInt(rec.is_hierarchical, 10);
              rec.defines_ancestry = !!parseInt(rec.defines_ancestry, 10);
              rec.c1_ids = parseInt(rec.c1_ids, 10);
              rec.c2_ids = parseInt(rec.c2_ids, 10);
              rec.c= parseInt(rec.c, 10);
            })

            return json;
          }));
}
export function conceptCount(params={}, queryName="conceptCount") {
  params = _.clone(params);
  let apiCall = 'concepts';
  params.resultsSchema = resultsSchema;
  params.cdmSchema = cdmSchema;
  params.queryName = queryName;

  return (util.cachedPostJsonFetch(
          `${apiRoot}/${apiCall}Post`, params)
          .then(function(json) {
            if (json.error)
              console.error(json.error.message, json.error.queryName, json.error.url);
            if (json.length !== 1)
              console.error('unexpect result count', json, json.queryName, json.url);
            return parseInt(json[0].count, 10);
          }));
}
function _conceptStats(params={}, queryName="conceptStats") {
  params = _.clone(params);
  let apiCall = 'concepts';
  params.resultsSchema = resultsSchema;
  params.cdmSchema = cdmSchema;
  params.queryName = queryName;
  return (util.cachedPostJsonFetch(
          `${apiRoot}/${apiCall}Post`, params)
          .then(function(json) {
            if (json.error)
              console.error(json.error.message, json.error.queryName, json.error.url);

            json.forEach(rec=>{
              rec.conceptrecs = parseInt(rec.conceptrecs, 10);
              rec.dbrecs = parseInt(rec.dbrecs, 10);
              //rec.count = parseInt(rec.count, 10);
              //rec.table_name = rec.table_name.replace(/^[^\.]+\./, '');
            })

            return json;
          }));
}


export function recsfetch(params, queryName) {
  params = _.clone(params);
  let {concept_id, maxgap, } = params;
  if (!_.isNumber(concept_id)) throw new Error("need concept_id param, number");
  if (typeof maxgap !== "undefined") {
    params.maxgap = parseInt(maxgap, 10);
  }
  params.bundle = params.bundle || 'exp'; // or era or single

  params.aggregate = false;
  params.resultsSchema = 'omop5_synpuf_5pcnt_results';

  if (typeof params.person_id === 'undefined') {
    params.noLimit = false;
    params.limit = 5000;
  } else {
    params.noLimit = true;
  }
  params.queryName = queryName || 'no query name';

  return (util.cachedPostJsonFetch(
          //'http://localhost:3000/api/daysupplies/dsgpPost', params)
          'http://localhost:3000/api/cdms/sqlpost', params, queryName)
          
          .then(function(json) {
            if (json.error)
              console.error(json.error.message, json.error.queryName, json.error.url);
            return json;
          }));
}
export function distfetch(params, queryName) {
  params = _.clone(params);
  let {ntiles, concept_id, maxgap} = params;
  if (!_.isNumber(ntiles)) throw new Error("need ntiles param, number");
  if (!_.isNumber(concept_id)) throw new Error("need concept_id param, number");
  if (typeof maxgap !== "undefined") {
    params.maxgap = parseInt(maxgap, 10);
  }
  params.measurename = params.measurename || 'gap'; // or duration
  params.bundle = params.bundle || 'exp'; // or era or single

  params.aggregate = true;
  params.resultsSchema = 'omop5_synpuf_5pcnt_results';

  params.noLimit = true;

  params.queryName = queryName || 'no query name';

  return (util.cachedPostJsonFetch(
          //'http://localhost:3000/api/daysupplies/dsgpPost', params)
          'http://localhost:3000/api/cdms/sqlpost', params, queryName)
          
          .then(function(json) {
            if (json.error)
              console.error(json.error.message, json.error.url);
            let recs = json.map( rec => {
                rec.count = parseInt(rec.count, 10);
                if (params.bundle === 'exp') {
                  rec.exp_num = parseInt(rec.exp_num, 10);
                } else if (params.bundle === 'era') {
                  rec.era_num = parseInt(rec.era_num, 10);
                } else if (params.bundle === 'allexp') {
                } else if (params.bundle === 'allera') {
                } else {
                  throw new Error("not handling yet");
                }
                rec.avg = parseFloat(rec.avg);
                if (isNaN(rec.avg))
                  rec.avg = null;
                return rec;
              }
            );
            recs.json = json;
            return recs;
            //var byExp = _.supergroup(recs, ['exp_num','ntile']);
            //return byExp;
          }));
}
export function frequentUsers(params, queryName) {
  params = _.clone(params);
  let {concept_id, sampleCnt} = params;
  if (!_.isNumber(concept_id)) throw new Error("need concept_id param, number");
  if (!_.isNumber(sampleCnt)) throw new Error("need sampleCnt param, number");

  params.cdmSchema = 'omop5_synpuf_5pcnt';
  params.queryName = queryName;

  return (util.cachedPostJsonFetch(
          'http://localhost:3000/api/cdms/sampleUsersPost', params, queryName)
          .then(function(json) {
            if (json.error)
              console.error(json.error.message, json.error.queryName, json.error.url);
            return json;
          }));
}
