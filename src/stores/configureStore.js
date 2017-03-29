/* eslint-disable */

import config from '../config'
import AppData from '../AppData';
import * as AppState from '../AppState'
import _ from '../supergroup';


import React, { Component } from 'react'
import { BrowserRouter as Router, 
          Route, IndexRoute, 
          } from 'react-router-dom'

import { createStore, compose, applyMiddleware } from 'redux';
//import { syncHistoryWithStore, routerReducer } from 'react-router-redux'
import { createDevTools } from 'redux-devtools'
import LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'
const DevTools = createDevTools(
  <DockMonitor toggleVisibilityKey="ctrl-h" changePositionKey="ctrl-q">
    <LogMonitor theme="tomorrow" preserveScrollTop={false} />
  </DockMonitor>
)



import reduxPromiseMiddleware from 'redux-promise-middleware';
//import { routerMiddleware } from 'react-router-redux';
//import { createLogger } from 'redux-logger'
//const logger = createLogger();

//import { services } from '../services/api';
// departing Pavel's framework here and following http://www.sohamkamani.com/blog/2016/06/05/redux-apis/
// import {dataService} from '../services/api';
// never mind


import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

import vocabPop from '../reducers/index';
let reducers = combineReducers({
  vocabPop,
  //routing: routerReducer,
  form: formReducer,
});
//console.log('REDUCERS', reducers(), reducer);

import createHistory from 'history/lib/createBrowserHistory'
//console.log(Router, )
//console.log(Router, createHistory)
const history = createHistory()

//let router = Router();
//const router = routerMiddleware(browserHistory);




//const appMiddleware = [thunk, router, reduxPromiseMiddleware(), logger, dataService];
//const appMiddleware = [reduxPromiseMiddleware(), dataService];
const appMiddleware = [reduxPromiseMiddleware(), ];

export default function configureStore(initialState = {}) {
  const middlewareEnhancer = applyMiddleware(...appMiddleware);
  let enhancer = middlewareEnhancer;
  
  if (window && window.__REDUX_DEVTOOLS_EXTENSION__) {
    enhancer = compose(middlewareEnhancer, window.__REDUX_DEVTOOLS_EXTENSION__());
  }

  let query = _.fromPairs(Array.from(new URLSearchParams(history.getCurrentLocation().search.slice(1)).entries()));
  const store = createStore(
    reducers,
    {},
    //query,
    //{...initialState, ...DevTools.instrument()},
    //DevTools.instrument(),
    enhancer
  );
  //const history = syncHistoryWithStore(browserHistory, store)
  AppState.giveAwayStore(store, history);
  // i'm sure this is dumb, but trying to follow example at
  //https://github.com/reactjs/react-router-redux/blob/master/examples/basic/app.js
  return {store, history};
}
