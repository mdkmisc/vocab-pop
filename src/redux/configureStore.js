/* eslint-disable */
const DEBUG = true;

import config from '../config'
import * as AppState from '../AppState'
import _ from '../supergroup'

import myrouter from './myrouter'
import * as rrRouter from 'react-router-redux'
//console.log(rrRouter)

import vocab, {
          formValToRoute, fetchConceptInfo,
          fetchConceptIdsForCodes, loadVocabsEpic
        } from './ducks/vocab'

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

import { browserHistory } from 'react-router';

export default function configureStore(initialState = {}) {
  /*
  console.log({
    sourceTargetSource,
    conceptView,
    api,
    config,
    myrouter,
    configReducer,
    routeState: myrouter.routeState
  })
  */
  //console.log(vocab)
  /*
  var appReducer = combineReducers({
    vocab,
    api,
    config: configReducer,
  });
  */
  //console.log('done comining reducers', appReducer)

  const rootEpic = combineEpics(
    loadVocabsEpic,
    formValToRoute,
    fetchConceptIdsForCodes,
    fetchConceptInfo
  );
  const epicMiddleware = createEpicMiddleware(rootEpic);
  //console.log(epicMiddleware)

  const rootReducer = combineReducers({
    vocab,
    config: configReducer,
    form: formReducer,
    routeState: myrouter.routeState,
    //reduxRouterReducer: myrouter.reduxRouterReducer,
  });
  const middleware = [
          //routerMiddleware(history),  // some weirdness
          myrouter.reduxRouterMiddleware,
          epicMiddleware,
        ];

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = createStore(
    rootReducer,
    { vocab: myrouter.getQuery() },
    composeEnhancers(
      applyMiddleware(...middleware)
    )
  );

  if (DEBUG) {
    window.store = store
    window.myrouter = myrouter
    console.log('global debug stuff: ', {store, myrouter, })
    //console.log(store,history)
  }

  if (!_.isEmpty(initialState)) throw new Error("ignoring initialState");
  AppState.initialize(store, myrouter);
  return {store, myrouter};
}
