/* eslint-disable */
import _ from 'src/supergroup'
import muit from 'src/muitheme'
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
const myqs = {
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
      if (typeof v !== 'object')
        return v
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

const getQuery = (path) => {
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
const routeAjaxError = (ajaxUrl, err) => {
  //if (err.xhr.responseURL !== ajaxUrl) { debugger }
  let msgs = [err.message, err.xhr.statusText, err.xhr.response].filter(d=>d)
  return routeError(ajaxUrl, msgs)
}
const routeError = (url, msgs, mainMsg='Error') => {
  debugger
  let gotoUrl = new URL(window.location.href)
  if (window.location.pathname === '/ajax-error') {
    console.log("already at ajax-error")
    return
  }
  gotoUrl.pathname = 'ajax-error'
  let query = myqs.parse((gotoUrl.search||'?').slice(1))
  query.targetUrl = url
  if (Array.isArray(msgs)) {
    query.errMsgs = msgs.join(', ')
  } else if (typeof msgs === 'string') {
    query.errMsg = msgs
  } else {
    query = {...query, ...msgs}
  }
  query.mainMsg = mainMsg

  gotoUrl.search = myqs.stringify(query)
  // not working, no time to fix
  //return myrouter.routeActionConnected(gotoUrl)
  window.location.replace(gotoUrl.href)
}
const _routeAction = o => {
  //console.log('routeAction', reduxPush(o), 'only works if you dispatch it!')
  let action = reduxPush(o)
  //console.log('routeAction', {action, o})
  return action
}
const addParams = (params) => {
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  query = _.merge(query, params)
  //myrouter.history.push({search: myqs.stringify(query)})
  return myrouter.routeActionConnected({search: myqs.stringify(query), state:{action:'addParams',params}})
}
const addParam = (path, val) => {
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  _.set(query, path, val)
  //myrouter.history.push({search: myqs.stringify(query)})
  //return myrouter.routeActionConnected({search: myqs.stringify(query), state:{addParam:{path,val}}})
  return myrouter.routeActionConnected({search: myqs.stringify(query), state:{action:'addParam',params:{[path]:val}}})
}
const deleteParams = (params) => {
  if (typeof params === 'string') {
    params = [params]
  }
  let query = myqs.parse(myrouter.history.location.search.slice(1))
  params.forEach(p => _.unset(query, p))
  //myrouter.history.push({search: myqs.stringify(query)})
  return myrouter.routeActionConnected({search: myqs.stringify(query), state:{action:'deleteParams',params}})
}
const setPathname = pathname => {
  if (pathname === myrouter.history.location.pathname)
    return {type:'EMPTY'}
  return myrouter.routeActionConnected(myrouter.history.createHref({
    ...myrouter.history.location,
    pathname,
    state:{action:'setPathname',pathname}
  }))
}
const queryListener = (params=[], cb) => {

  let query = getQuery()

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
  history,// history/createBrowserHistory
  routeAjaxError,
  routeError,

  _routeAction,
  // routeActionConnected needs to be connected to routeAction and dispatcher
  // which is happening in configureStore
  routeActionConnected: ()=>{throw new Error("CONNECT THIS!")}, 
}
export default myrouter

