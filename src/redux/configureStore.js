/* eslint-disable */
const DEBUG = true

import * as utils from '../utils'
import _ from '../supergroup'

//import apiReducer, * as api from './api'
import vocabReducer, * as vocab from './ducks/vocab'
import myrouter from './myrouter'

import React, { Component } from 'react'
import { createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { combineEpics } from 'redux-observable'
import { createEpicMiddleware } from 'redux-observable'
import { reducer as formReducer } from 'redux-form'

export default function configureStore(initialState = {}) {

  const rootReducer = combineReducers({
    //vocab: vocabReducer,  // stop using?
    // for now:
    calls: vocab.callReducers,
    form: formReducer,
    reduxRouter: myrouter.routerReducer,//redux router, not sure how to use correctly
    /*
    junk: (state={},action) => {
      switch(action.type) {
        case 'FOO':
          return {...state, foo:action}
        case 'BAR':
          return {...state, bar:action}
      }
      return state
    }
    */
    //myRouteState: myrouter.routeState,
  })

  const act = (...args) => {
    console.log(args)
    debugger
    return {type:'BLAH',payload:{args,foo:'bleep'}}
  }
  /*
  let filt = action=>{
                let ret = action.type === '@@router/LOCATION_CHANGE'
                //console.log('in filt',{action,ret})
                return ret
              }
  */
  const allEpics = [
    /*
    action$ => action$.filter(filt).map((action)=>{
      return {type:'FOO',payload:action,meta:{from:'mergemap on stream everything'}}
    }),
    action$ => {
      let str = action$.map((action)=>{
        let act = {type:'FOO',payload:action,meta:{from:'map on stream with sub everything'}}
        let ret = Rx.Observable.of(act)
        //ret.subscribe(d=>console.log('setting FOO with', d))
        return ret
      })
      str.subscribe(d=>console.log('sub to STREAM', d))
      return str
    },
    action$ => {
      let act = {type:'FOO',payload:action$,meta:{from:'map NO action$ everything'}}
      console.log('setting FOO', act)
      let ret = Rx.Observable.of(act)
      //ret.subscribe(d=>console.log(d))
      return ret
    },
    (action$, store) => (
      action$//.ofType('@@INIT')
        .filter(filt)
        .map(action=>{
          console.log('launching setup',action)
          debugger
          return {type:'FOO',payload:action,meta:{from:'mergemap on stream everything'}}
          return vocabulariesApi.actionCreators.setup()
        })
        .map(action=>{
          let call = store.getState().calls.vocabulariesApi.primary
          console.log('got action, return call', action, call)
          return {type:'BAR',payload:action,meta:{from:'mergemap on stream everything'}}
          return call
        })
    ),
    */
    vocab.epic
  ]
  const rootEpic = combineEpics(...allEpics)
  /*
  const rootEpic = (action$,store) => { // redux-observable stopped working...this weird crap seems to fix it
    let root = Rx.Observable.merge(
      ..._.map(allEpics, 
               d => {
                  console.log('dealing with d', d)
                  let ret = Rx.Observable.from(d(action$,store))
                  //ret.subscribe(d=>console.log('jeeze', d))
                  return ret
               })
    )
    //root.subscribe(d=>console.log('WHOLE ROOT',d))
    return root
  }
  */
  //debugger
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


