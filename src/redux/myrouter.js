import _ from '../supergroup'
import React, { Component, PropTypes } from 'react'
import {  //ConnectedRouter, 
          push as reduxPush,
          routerMiddleware as reduxRouterMiddlewareCreator,
          routerReducer as reduxRouterReducer,
        } from 'react-router-redux'
import { BrowserRouter as ReactBrowserRouter, } from 'react-router-dom'
//import { browserHistory } from 'react-router'; 
////  maybe go with crowd and keep using browserHistory, only in react-router up to v3
//let history = browserHistory;   // this is working, but going to try react-router-redux
                                // one more time
//
// or, since their example (https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)
// says:
// Create a history of your choosing (we're using a browser history in this case)
// maybe i can stick with browserHistory
// ...
// maybe not...but this might be a waste of time
import createHistory from 'history/createBrowserHistory'

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

const myhistory = createHistory()
class MyRouter extends Component {
  /*
  constructor(props) {
    super(props)
    let tempHist = createHistory()
    this.myhistory = myhistory || tempHist
  }
  */
  static history() {
    return myhistory
  }
  render() {
    let {children} = this.props
    return <ReactBrowserRouter history={this.constructor.history()}>
              {children}
           </ReactBrowserRouter>
  }
}

const routeState  = (state=myrouter.myhistory.location, action) => {
  //console.log('routeState REDUCER', {state, action})
  switch (action.type) {
    /* should be selector, not reducer
    case 'get':
      debugger
      return _.get(state, action.path) // probably wrong
    */
    case QUERY_ADD:
      return addParams(action.payload)
    case QUERY_DELETE:
      return deleteParams(action.payload)
    default:
      return state
  }
}
let reduxRouterMiddleware = reduxRouterMiddlewareCreator(myhistory)

export const getQuery = (path) => {
  let query = myqs.parse(myrouter.myhistory.location.search.slice(1))
  if (path) 
    return _.get(query, path)
  return query
  //let qp = new URLSearchParams(myrouter.myhistory.location.search)
  //let query = _.fromPairs([...qp.entries()])
  //let test = myqs.parse(myrouter.myhistory.location.search)
  //console.log({query, test})
  //debugger
}
export const addParams = (params) => {
  let query = myqs.parse(myrouter.myhistory.location.search.slice(1))
  query = _.merge(query, params)
  myrouter.myhistory.push({search: myqs.stringify(query)})
  return myrouter.myhistory.location
}
export const addParam = (path, val) => {
  let query = myqs.parse(myrouter.myhistory.location.search.slice(1))
  _.set(query, path, val)
  myrouter.myhistory.push({search: myqs.stringify(query)})
  return myrouter.myhistory.location
}
export const deleteParams = (params) => {
  if (typeof params === 'string') {
    params = [params]
  }
  let query = myqs.parse(myrouter.myhistory.location.search.slice(1))
  params.forEach(p => _.unset(query, p))
  myrouter.myhistory.push({search: myqs.stringify(query)})
  return myrouter.myhistory.location
}

// toss out everything and see what sticks
var myrouter = {
  getQuery,
  addParams,
  addParam,
  fromqs: myqs.parse,
  toqs: myqs.stringify,
  deleteParams,
  MyRouter,
  routeState,
  reduxRouterMiddleware,
  reduxRouterReducer,
  reduxPush,
  ReactBrowserRouter,
  myhistory,
  QUERY_ADD,
  QUERY_DELETE,
}
export default myrouter

