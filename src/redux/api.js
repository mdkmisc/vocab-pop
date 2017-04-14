
/* eslint-disable */
//const DEBUG = true;
import * as util from './utils';
import React, { Component } from 'react';
//import { Route, RouteHandler, Link, Router, browserHistory } from 'react-router';
import Rx from 'rxjs/Rx';
//import { ajax } from 'rxjs/observable/dom/ajax';
import _ from './supergroup'; // lodash would be fine here
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
// adapted from cachedAjax in ohdsi.utils
import LZString from 'lz-string';
import _ from 'lodash';
import Rx from 'rxjs/Rx';
var ALLOW_CACHING = [
  '.*',
  //'/WebAPI/[^/]+/person/',
];


const apiPrefix = store => {
  const config = store.getState().config
  const {cdmSchema,resultsSchema,apiRoot,apiModel} = config
  ({apiCall, apiGetUrl, cacheDirty, apiCallBaseUrl} = appDataGen(config));
  return (
    Rx.Observable.ajax.getJSON(`${apiCallBaseUrl('')}cacheDirty`)
      .do(results => {
        if (results) {
          DEBUG && console.warn(`cache dirty. removing ${_.keys(sessionStorage).length} items in sessionStorage`);
          sessionStorage.clear();
        } else {
          DEBUG && console.warn(`cache clean. ${_.keys(sessionStorage).length} items in sessionStorage`);
        }
        return results;
      })
      .mapTo(() => Rx.Observable.empty())
  )
}


// for tree ideas, trying to use https://github.com/reactjs/redux/tree/master/examples/tree-view

// reducers
const apiCall = (state={}, action) => {
  switch (action.type) {
    case INITIATE:
      return {
        ...state,
        params: action.payload,
                      apiName: 'codeSearchToCids',
        apiName: action.apiName,
        url: 
        err: undefined,
        results: undefined,
        pending: true,
      }
    case FULFILLED:
      return {
        ...state,
        results: action.payload,
        err: undefined,
        pending: false,
      }
    case REJECTED:
      return {
        ...state,
        err: action.payload,
        pending: false,
      }
    default:
      return state
  }
}
export const apiCalls = (state, action) => {
  const {type, payload, meta, error } = action
  if (error) debugger
  const { apiName, url } meta
  switch (type) {
    case API_CALL:

      let call = createCall({apiName, params: payload, meta})
      {
        id: action.callId,
        childCalls: []
      }
  /* from example...may need later
  if (action.type === DELETE_NODE) {
    const descendantIds = getAllDescendantIds(state, nodeId)
    return deleteMany(state, [ nodeId, ...descendantIds ])
  }
  */
    case ADD_CHILD:
    case REMOVE_CHILD:
      return {
        ...state,
        childIds: childIds(state.childIds, action)
      }
    default:
      return state
  }
}
const createCall = p => {
  let {apiName, params, meta} = p
  let stream = new AppState.ApiStream({
                  apiName,
                  params,
                  meta,
                  wantRxAjax: true,
                })
  return stream
}

export const apiCallEpic = (action$, store) => {
  action$.ofType(CREATE_CALL)
  /* response to sts.container: 
      dispatch({
        type:duck.API_CALL,
        apiCall: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN,
        payload:{vocabulary_id,concept_code_search_pattern}
      });
   */
    .do(action=>examineAction({from:'apiCallEpic',action$, action, store}))
    //.switchMap(action => {})
    .mergeMap(action => {
      return Rx.Observable.concat(
        apiPrefix(store),
        apiCall(action)
      let state = action.substate || store.getState().vocab
      let {type, payload, apiName, } = action
      let params = _.pick(Object.assign({}, state, 
                                            payload), 
                          ['vocabulary_id','concept_code_search_pattern'])
      let ajax = startAjax({apiName, params, meta: {state,action}})
      store.dispatch(
      let calls = 
      return (
        ajax
          .do(action=>examineAction({from:'apiCallEpic ajax return',action$, action, store}))
          .do(action=>store.dispatch({
              type: apiName,
              payload,
          }))
          .map(
            response =>
          .switchMap(response => {
            return (
              Rx.Observable.of(
                  { type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                    payload: response}
              )
              .catch(error => {
                return Rx.Observable.of({
                          type: `${type}_REJECTED`,
                          payload: error.xhr.response,
                          error: true
                        })
              })
            )
          }
        )
      )
    })
}
export const apiCalls = (state={}, action) => {
  const {type, payload, meta, error } = action
  const { apiName, url } meta

  switch (action.type) {
    case LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN:
    case LOAD_CONCEPTS:
    case LOAD_VOCABS:
      if (state[action.type])
        throw new Error("already have one going", {action,state})
      let {type, payload, } = action
      return {
        ...state,
        [action.type]: apiCall( state[action.type], 
                                { ...action,
                                  apiCall: action.type,
                                  [type: INITIATE],
                                }),
      }
    default:
      return state
  }
}

export const apis (state = {}, action) => {
  // organize apiCalls by apiName
  const { apiName } = action.meta
  if (typeof apiName === 'undefined') {
    return state
  }
  return {
    ...state,
    [apiName]: apiCalls(state[apiName], action)
  }
}





// for tree ideas, trying to use https://github.com/reactjs/redux/tree/master/examples/tree-view

const apiCall = (state={}, action) => {
  switch (action.type) {
    case INITIATE:
      return {
        ...state,
        params: action.payload,
                      apiName: 'codeSearchToCids',
        apiName: action.apiName,
        err: undefined,
        results: undefined,
        pending: true,
      }
    case FULFILLED:
      return {
        ...state,
        results: action.payload,
        err: undefined,
        pending: false,
      }
    case REJECTED:
      return {
        ...state,
        err: action.payload,
        pending: false,
      }
    default:
      return state
  }
}
const apiCalls = (state, action) => {
  const {type, payload, meta, error } = action
  if (error) debugger
  const { apiName, url } meta
  switch (type) {
    case API_CALL:

      let call = createCall({apiName, params: payload, meta})
      {
        id: action.callId,
        childCalls: []
      }
  /* from example...may need later
  if (action.type === DELETE_NODE) {
    const descendantIds = getAllDescendantIds(state, nodeId)
    return deleteMany(state, [ nodeId, ...descendantIds ])
  }
  */
    case ADD_CHILD:
    case REMOVE_CHILD:
      return {
        ...state,
        childIds: childIds(state.childIds, action)
      }
    default:
      return state
  }
}
const createCall = p => {
  let {apiName, params, meta} = p
  let stream = new AppState.ApiStream({
                  apiName,
                  params,
                  meta,
                  wantRxAjax: true,
                })
  return stream
}
export const apiCallEpic = (action$, store) => {
  action$.ofType(CREATE_CALL)
  /* response to sts.container: 
   *  dispatch({type:duck.API_INITIATE,
   *            apiCall: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN,
   *            payload:{vocabulary_id,concept_code_search_pattern}})
   */
    .do(action=>examineAction({from:'apiCallEpic',action$, action, store}))
    .switchMap(action => {
      let state = action.substate || store.getState().vocab
      let {type, payload, apiName, } = action
      let params = _.pick(Object.assign({}, state, 
                                            payload), 
                          ['vocabulary_id','concept_code_search_pattern'])
      let ajax = startAjax({apiName, params, meta: {state,action}})
      store.dispatch(
      let calls = 
      return (
        ajax
          .do(action=>examineAction({from:'apiCallEpic ajax return',action$, action, store}))
          .do(action=>store.dispatch({
              type: apiName,
              payload,
          }))
          .map(
            response =>
          .switchMap(response => {
            return (
              Rx.Observable.of(
                  { type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                    payload: response}
              )
              .catch(error => {
                return Rx.Observable.of({
                          type: `${type}_REJECTED`,
                          payload: error.xhr.response,
                          error: true
                        })
              })
            )
          }
        )
      )
    })
}
export const apiCalls = (state={}, action) => {
  const {type, payload, meta, error } = action
  const { apiName, url } meta

  switch (action.type) {
    case LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN:
    case LOAD_CONCEPTS:
    case LOAD_VOCABS:
      if (state[action.type])
        throw new Error("already have one going", {action,state})
      let {type, payload, } = action
      return {
        ...state,
        [action.type]: apiCall( state[action.type], 
                                { ...action,
                                  apiCall: action.type,
                                  [type: INITIATE],
                                }),
      }
    default:
      return state
  }
}

export const apis (state = {}, action) => {
  // organize apiCalls by apiName
  const { apiName } = action.meta
  if (typeof apiName === 'undefined') {
    return state
  }
  return {
    ...state,
    [apiName]: apiCalls(state[apiName], action)
  }
}
//import yaml from 'js-yaml';

var reduxStore = {};
var reduxHistory = {};
var {cdmSchema,resultsSchema,apiRoot,apiModel} = {} // nothing till init
var {apiCall, apiGetUrl, cacheDirty, apiCallBaseUrl} = {} // nothing till init
var ready = new Rx.Subject();
var readyPromise = ready.toPromise();

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





throw new Error('delete all below')


export function getState(path) {
  return _.get(reduxStore.getState(), path);
  console.log('get state from redux!!', path);
  return {};
  /*
export var myqs = {
  stringify: obj=>encodeURI(JSON.stringify(obj)),
  parse: json=>JSON.parse(decodeURI(json||'{}'))
}
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

//var cache = {}; // only save till reload
//var cache = localStorage; // save indefinitely
var cache = sessionStorage; // save for session
export function fetchKey(url, opts={}) {
  // switch to using the getUrl
  // var key = `${url}:${JSON.stringify(opts)}`;
  // return key;
  return getUrl(url, opts);
}
export function getUrl(url, params={}) {
  if (url.match(/(post|get)/i)) {
    console.warn('quit using post/get in api names');
    url = url.replace(/post/,'get').replace(/Post/,'Get');
  }

  if (_.isEmpty(params))
    return url;

  return encodeURI(
          url + '?' + _.keys(params)
                        .sort()
                        .map( key => `${key}=${params[key]}`)
                        .join('&'));
}

export function cachedPostJsonFetch(url, params={}, queryName) { // stop using queryName...put it in params in the first place
  if (queryName) {
    console.warn('quit using separate queryName arg in cachedPostJsonFetch calls');
  }
  queryName = queryName || params.queryName || 'no query name';
  var get = getUrl(url, params);
  //console.log(queryName, get);
  return cachedJsonFetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          }).then(function(json) {
            if (json.error) {
              json.error.url = get;
              json.error.queryName = queryName;
            }
            json.url = get;
            json.queryName = queryName;
            return json;
          })
}
export function cachedGetJsonFetch(url, params={}) {
  let get = getUrl(url, params);
  let queryName = params.queryName || 'no query name';
  return (cachedJsonFetch(get)
            .then(function(json) {
              if (json.error) {
                json.error.url = get;
                json.error.queryName = queryName;
              }
              json.url = get;
              json.queryName = queryName;
              return json;
            })
        );
}
/* not used in vocab-pop
export function jsonFetchMeta(url, params={}, meta={}) {
  // so you get back not just the promise, but also the getUrl,
  // which is a unique key for the fetch and a key into storage,
  // and you also get back meta data if you send any (which might
  // be useful)
  let key = getUrl(url, params);
  let promise = cachedGetJsonFetch(url, params);
  return {key, promise, meta};
}
*/
function handleErrors(p) {
    let {jsonPromise,response} = p
    if (!response.ok) {
      //console.error('got error with', response)
      throw p
    }
    return p
}
function jsonFetch(url, opts={}, readyPromise) {
  console.log(url, opts, readyPromise);
  return (readyPromise
            .then(()=>fetch(url, opts))
            .then(response=>response.json().then(json=>({json, response}))))
            .catch(err=>{throw err})
}
export function cachedJsonFetch(url, opts={}, readyPromise) {
  var allowed = _.find(ALLOW_CACHING, allowedUrl => url.match(allowedUrl));
  if (allowed) {
    //console.log(`using cache for ${url}. remove ${allowed} from ohdsi.util.ALLOW_CACHING to disable caching for it`);
  } else {
    //console.log(`not caching ${url}. add to ohdsi.util.ALLOW_CACHING to enable caching for it`);
    return jsonFetch(url, opts, readyPromise);
  }
  var key = fetchKey(url, opts)
  if (storageExists(key, cache)) {
    var results = storageGet(key, cache)
    //console.log('already cached', key, results)
    return Promise.resolve(results)
  }
  let promise = jsonFetch(url, opts, readyPromise)
  return (promise.then(handleErrors)
                  .then(({json,response}) => {
                    storagePut(key, json, cache)
                    return json
                  })
                  .catch(({json,response}) => {
                    json.error = response
                    throw json
                  })
         )
}
/* @class ApiCall
 *  @param opts object
 *  @param opts.apiName string   // name of api call
 *  @param opts.payload [object]  // apiName params
 *  @param opts.singleValue [boolean]  // whether to return a single value instead of array
 *  @param opts.transformResults [function] apply function to rows before returning them
 *  @returns string // streamKey, which is valid get url, though stream is based on post url
 */
export class ApiCall extends util.JsonFetcher {
  // instances are unique (or re-used if they wouldn't be)
  // and stored in ApiStream.instances (as a result
  // of inheriting from util.JsonFetcher)
  constructor({apiName, payload, meta, transformResults, 
              singleValue, cb, wantRxAjax}) {

    if (!wantRxAjax) throw new Error("switching to rx and redux")
    // from old AppData.ApiFetcher constructor:
    let baseUrl = apiCallBaseUrl(apiName, payload);
    let instance = super(baseUrl, payload, meta, readyPromise, wantRxAjax );
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
export class JsonFetcher { // this.url is the unique key
  constructor(baseUrl, params, meta, readyPromise, wantRxAjax) {
    /*
    if (JsonFetcher.blockTillReadyForFetching) {
      throw new Error("not ready to fetch");
    }
    */
    this.baseUrl = baseUrl;
    this.params = params;
    this.meta = meta;
    this.url = getUrl(baseUrl, params);
    if (_.has(JsonFetcher.instances, this.url)) {
      //console.warn('JsonFetcher already exists. promises probably done already', this.url);
      let instance = JsonFetcher.instances[this.url];
      if (!_.isEqual(this.meta, instance.meta)) {
        throw new Error("treating Fetchers with different meta objs as the same, probably don't want to");
      }
      instance.newInstance = false;
      return instance;
    }
    this.queryName = params.queryName || 'no query name';
    //console.log("apicall", this.url);
    if (wantRxAjax) { // trying to start using https://redux-observable.js.org/docs/basics/Epics.html
                      // without breaking a lot of other stuff
      this.rxAjax = Rx.Observable.ajax.getJSON(this.url)
    } else {
      this.fetchPromise = cachedJsonFetch(this.url, undefined, readyPromise);
      this.fetchPromise.then(json => {
                          //console.log('fetchPromise resolved in utils!!!', json)
                          return this.json=json
                        })
                        .catch(err => {
                          //console.log('fetchPromise failed in utils!!!', err)
                        })
    }
    this.newInstance = true;
    JsonFetcher.instances[this.url] = this;
  }
}
JsonFetcher.instances = {}
JsonFetcher.blockTillReadyForFetching = true // modified in AppState

export function storagePut(key, val, store = sessionStorage) {
  store[key] = LZString.compressToBase64(JSON.stringify(val));
  //let json = JSON.stringify(val);
  //let compressed = LZString.compressToBase64(json);
  //alert([json.length, compressed.length]);
  //console.log(`recs: ${val.length}, json: ${json.length}, compressed: ${compressed.length}`);
}
export function storageExists(key, store = sessionStorage) {
  return _.has(store, key);
}
export function storageGet(key, store = sessionStorage) {
  return JSON.parse(LZString.decompressFromBase64(store[key]));
}
export function storageKeys(store = sessionStorage) {
  return Object.keys(store);
}

