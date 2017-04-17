/* eslint-disable */
const DEBUG = true;

//import config from '../config'
import * as utils from '../utils'
import _ from '../supergroup'

import myrouter from './myrouter'
import * as api from './api'
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

export default function configureStore(initialState = {}) {

  const rootReducer = combineReducers({
    //config: () => config,
    apiCalls: api.apiCalls,
    cacheDirty: api.cacheDirty,
    vocab,
    form: formReducer,
    routeState: myrouter.routeState,
    //reduxRouterReducer: myrouter.reduxRouterReducer,
  });

  const rootEpic = combineEpics(
    api.apiCallEpic,
    loadVocabsEpic,
    formValToRoute,
    fetchConceptIdsForCodes,
    fetchConceptInfo
  );
  const epicMiddleware = createEpicMiddleware(rootEpic);

  const middleware = [
          myrouter.reduxRouterMiddleware, // not sure if needed
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
    //console.log('global debug stuff: ', {store, myrouter, })
  }

  if (!_.isEmpty(initialState)) throw new Error("ignoring initialState");
  //utils.initialize(store, myrouter);
  return {store, myrouter};
}
