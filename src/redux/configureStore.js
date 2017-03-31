/* eslint-disable */
const DEBUG = true;

import * as AppState from '../AppState'
import _ from '../supergroup';

import sourceTargetSource from './ducks/sourceTargetSource'

import React, { Component } from 'react'
import { createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { ConnectedRouter, routerReducer, routerMiddleware, push } from 'react-router-redux'
import reduxPromiseMiddleware from 'redux-promise-middleware';
import { reducer as formReducer } from 'redux-form';

import { BrowserRouter as Router, } from 'react-router-dom'
//import { browserHistory } from 'react-router';
//let router = new Router();
//let history = browserHistory;   // this is working, but going to try react-router-redux
                                // one more time
// or, since their example (https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)
// says:
// Create a history of your choosing (we're using a browser history in this case)
// maybe i can stick with browserHistory
// ...
// maybe not...but this might be a waste of time
import createHistory from 'history/createBrowserHistory'
const history = createHistory()
      // Now you can dispatch navigation actions from anywhere!
      // store.dispatch(push('/foo'))

// ? const router = routerMiddleware(browserHistory);

//const appMiddleware = [thunk, router, reduxPromiseMiddleware(), logger, dataService];
//const appMiddleware = [reduxPromiseMiddleware(), dataService];
const middleware = [reduxPromiseMiddleware(), routerMiddleware(history)];

//let query = _.fromPairs(Array.from(new URLSearchParams(history.getCurrentLocation().search.slice(1)).entries()));
// Add the reducer to your store on the `router` key
// Also apply our middleware for navigating
const store = createStore(
  combineReducers({
    app: appReducer,
    form: formReducer,
    routerReducer
  }),
  applyMiddleware(...middleware)
)
if (DEBUG) {
  window.store = store;
  window.hist = history;
}

export default function configureStore(initialState = {}) {
  if (!_.isEmpty(initialState)) throw new Error("ignoring initialState");
  AppState.initialize(store, history);
  return {store, history};
}
