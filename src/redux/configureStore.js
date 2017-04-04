/* eslint-disable */
const DEBUG = true;

import config from '../config'
import * as AppState from '../AppState'
import _ from '../supergroup'

import * as myrouter from './myrouter'
import * as rrRouter from 'react-router-redux'
//console.log(rrRouter)

import sourceTargetSource, {
          loadFromSourceCodesEpic,
          loadVocabsEpic
        } from './ducks/sourceTargetSource'

import React, { Component } from 'react'
import { createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { combineEpics } from 'redux-observable';
import { createEpicMiddleware } from 'redux-observable';
import { reducer as formReducer } from 'redux-form';



import { ajax } from 'rxjs/observable/dom/ajax';

const api = (state={}, action) => {
  return state;
}
const configReducer = () => {
  return config;
}

console.log({
  sourceTargetSource,
  api,
  config,
  myrouter,
  configReducer,
  routeState: myrouter.routeState
})
var appReducer = combineReducers({
  sourceTargetSource,
  api,
  config: configReducer,
  routeState: myrouter.routeState
});

export const rootEpic = combineEpics(
  loadFromSourceCodesEpic,
  loadVocabsEpic
);
const epicMiddleware = createEpicMiddleware(rootEpic);
//console.log(epicMiddleware)

export const rootReducer = combineReducers({
  app: appReducer,
  form: formReducer,
  //routeReducer: myrouter.routerReducer,
});
const middleware = [
        //reduxPromiseMiddleware(), 
        //routerMiddleware(history),  // some weirdness
        rrRouter.routerMiddleware(myrouter.history),
        epicMiddleware,
      ];

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers(
    applyMiddleware(...middleware)
  )
);

if (DEBUG) {
  window.store = store;
  window.hist = myrouter.history;
  //console.log(store,history)
}

export default function configureStore(initialState = {}) {
  if (!_.isEmpty(initialState)) throw new Error("ignoring initialState");
  AppState.initialize(store, myrouter.history);
  return {store, history:myrouter.history};
}
