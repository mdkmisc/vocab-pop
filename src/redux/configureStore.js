/* eslint-disable */
const DEBUG = true

import * as utils from '../utils'
import _ from '../supergroup'

import apiReducer, * as api from './api'
import myrouter from './myrouter'

import React, { Component } from 'react'
import { createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { combineEpics } from 'redux-observable'
import { createEpicMiddleware } from 'redux-observable'
import { reducer as formReducer } from 'redux-form'

export default function configureStore(initialState = {}) {

  const rootReducer = combineReducers({
    api: apiReducer,
    form: formReducer,
    reduxRouter: myrouter.routerReducer,//redux router, not sure how to use correctly
    //myRouteState: myrouter.routeState,
  })

  const rootEpic = combineEpics(
    ...api.epics,
  )
  const epicMiddleware = createEpicMiddleware(rootEpic)

  const middleware = [
          myrouter.middleware,
          epicMiddleware,
        ]

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = createStore(
    rootReducer,
    // {initialState}
    composeEnhancers(
      applyMiddleware(...middleware)
    )
  )

  if (DEBUG) {
    window.store = store
    window.myrouter = myrouter
    //console.log('global debug stuff: ', {store, myrouter, })
  }

  if (!_.isEmpty(initialState)) throw new Error("ignoring initialState")
  //utils.initialize(store, myrouter)
  return {store, myrouter}
}
