/* eslint-disable */
const DEBUG = true

import * as utils from 'src/utils'
import _ from 'src/supergroup'

import cidsReducer, * as cids from 'src/ducks/cids'
import vocabularies, * as vocabs from 'src/ducks/vocabularies'
import conceptReducer, * as cncpt from 'src/ducks/concept'
import csetReducer, * as cset from 'src/ducks/conceptSet'
import apiReducer, * as api from 'src/api'
import tooltipReducer, * as tooltip from 'src/tooltip'
import myrouter from 'src/myrouter'

import React, { Component } from 'react'
import { createStore, compose, combineReducers, applyMiddleware, bindActionCreators } from 'redux'
//import reduceReducers from 'reduce-reducers'
import { combineEpics } from 'redux-observable'
import { createEpicMiddleware } from 'redux-observable'
import { reducer as formReducer } from 'redux-form'

export default function configureStore(initialState = {}) {

  const rootReducer = combineReducers({
    api:apiReducer,
    vocabularies,
    relationships: vocabs.relationshipsReducer,
    cids: cidsReducer,
    concepts: conceptReducer,
    csets: csetReducer,
    //calls,
    form: formReducer,
    tooltips: tooltipReducer,
    reduxRouter: myrouter.routerReducer,//redux router, not sure how to use correctly
  })

  const allEpics = [
    ...api.epics,
    ...vocabs.epics,
    ...cids.epics,
    ...cncpt.epics,
  ]
  const rootEpic = combineEpics(...allEpics)
  const epicMiddleware = createEpicMiddleware(rootEpic)

  const middleware = [ myrouter.middleware, epicMiddleware, ]

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = createStore(
    rootReducer,
    // {initialState}
    composeEnhancers(
      applyMiddleware(...middleware)
    )
  )
  myrouter.routeActionConnected = bindActionCreators(myrouter._routeAction, store.dispatch)

  if (DEBUG) {
    window.store = store
    window.myrouter = myrouter
    //console.log('global debug stuff: ', {store, myrouter, })
  }

  if (!_.isEmpty(initialState)) throw new Error("ignoring initialState")
  return {store, myrouter}
}

/*
import { createSelector } from 'reselect'
window.junk = ({a, b, ...c}) => {
  console.log({a, b, c})

  const number = state=>state
  const N = createSelector(number, number=>new Number(number))
  N(5) // Number {[[PrimitiveValue]]: 5}
  new Number(5) === new Number(5) // false -- different objects
  N(5)===N(5) // true -- memoized!  :)
  N(N(5))===N(N(5)) // false -- not memoized :(
  _.isEqual(N(N(5)),N(N(5))) // true -- maybe I don't care that they're not ===
}
window.junk({a:1, b:2, d:'foo', e:'bar'})
*/
