const DEBUG = false;
import _ from 'supergroup';
import * as util from './utils';
import config from './config';

var AppData = appDataGen(config);
export default AppData;

function appDataGen({cdmSchema,resultsSchema,apiRoot} = config) {

  // api calls return promises, except apiCallMeta
  // which returns a promise wrapped in some metadata

  function cacheDirty() {
    DEBUG && console.error('running cacheDirty');
    return fetch(`${apiRoot}/cacheDirty`)
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
  class ApiFetcher extends util.JsonFetcher {
    constructor({apiCall, params, meta, transformResults}) {
      params = _.merge({}, params, {cdmSchema, resultsSchema});
      let baseUrl = apiCallBaseUrl(apiCall);
      let instance = super(baseUrl, params, meta);
      if (!instance.newInstance) return instance;
      // AppState.ApiStream should do it's own transforming
      // so it can better control (run singleValue first)
      if (transformResults) {
        this.jsonPromise = this.jsonPromise.then(transformResults);
      }
    }
  }
  function apiCallBaseUrl(apiCall) {
    return `${apiRoot}/${apiCall}`;
  }
  function apiGetUrl(apiCall, params) {
    params.resultsSchema = resultsSchema;
    params.cdmSchema = cdmSchema;
    DEBUG && console.log(util.getUrl(apiCallBaseUrl(apiCall), params));
    return util.getUrl(apiCallBaseUrl(apiCall), params);
  }
  function apiCall(apiCall, params={}) {
    params.resultsSchema = resultsSchema;
    params.cdmSchema = cdmSchema;
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
  return {apiCall, apiGetUrl, ApiFetcher, cacheDirty};
}
