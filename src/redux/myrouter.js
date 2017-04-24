import _ from '../supergroup'
import React, { Component, PropTypes } from 'react'
import {  ConnectedRouter, 
          push as reduxPush,
          routerMiddleware,
          routerReducer, } from 'react-router-redux'


import createHistory from 'history/createBrowserHistory'
const history = createHistory()
const middleware = routerMiddleware(history)

var stableStringify = require('json-stable-stringify');
const qs = require('query-string');
export var myqs = {
  stringify: (obj,jsonChildren=true) => {
    if (!jsonChildren)
      throw new Error("not sure what to do")
    let o = _.mapValues(obj, v => typeof v === 'object' ? stableStringify(v) : v)
    // qs.stringify will make sure top level params are sorted (so stable)
    return qs.stringify(o)
  },
  parse: (str, jsonChildren=true) => {
    if (!jsonChildren)
      throw new Error("not sure what to do")
    let o = qs.parse(str)
    let obj = _.mapValues(o, v => {
      let parsed = v
      try {
        parsed = JSON.parse(v)
      } catch(e) {
      }
      return parsed
    })
    return obj
  }
}


const QUERY_ADD = 'QUERY_ADD';
const QUERY_DELETE = 'QUERY_DELETE';


export const getQuery = (path) => {
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  if (path) 
    return _.get(query, path)
  return query
  //let qp = new URLSearchParams(myrouter.history.location.search)
  //let query = _.fromPairs([...qp.entries()])
  //let test = myqs.parse(myrouter.history.location.search)
  //console.log({query, test})
  //debugger
}
export const addParams = (params) => {
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  query = _.merge(query, params)
  //myrouter.history.push({search: myqs.stringify(query)})
  return reduxPush({search: myqs.stringify(query)})
}
export const addParam = (path, val) => {
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  _.set(query, path, val)
  //myrouter.history.push({search: myqs.stringify(query)})
  return reduxPush({search: myqs.stringify(query)})
}
export const deleteParams = (params) => {
  if (typeof params === 'string') {
    params = [params]
  }
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  params.forEach(p => _.unset(query, p))
  //myrouter.history.push({search: myqs.stringify(query)})
  return reduxPush({search: myqs.stringify(query)})
}
export const setPathname = pathname => {
  if (pathname === myrouter.history.location.pathname)
    return {type:'EMPTY'}
  return reduxPush(myrouter.history.createHref({...myrouter.history.location,pathname}))
}

// toss out everything and see what sticks
var myrouter = {
  getQuery,
  addParams,
  addParam,
  setPathname,
  fromqs: myqs.parse,
  toqs: myqs.stringify,
  deleteParams,
  //routeState,
  routerReducer,  // redux
  middleware,     // redux
  ConnectedRouter,// redux
  reduxPush,
  history,        // history/createBrowserHistory
  QUERY_ADD,
  QUERY_DELETE,
}
export default myrouter

