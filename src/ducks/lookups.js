/* eslint-disable */
import { combineEpics } from 'redux-observable'
import { createSelector } from 'reselect'
//DEBUG:
window.createSelector = createSelector

import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import _ from 'src/supergroup'; // in global space anyway...
var d3 = require('d3')
import * as api from 'src/api'
import myrouter from 'src/myrouter'

// circular dependency, might be a problem:
import conceptReducer from 'src/ducks/concept'

let vocabulariesApi = new api.Api({
  apiName: 'vocabulariesApi',
  apiPathname: 'vocabularies',
})

let codesToCidsApi = new api.Api({
  apiName: 'codesToCidsApi',
  apiPathname: 'codeSearchToCids',
  defaultResults: [],
})

export const apis = {
  vocabulariesApi,
  codesToCidsApi,
}

export default (state={}, action) => {
  //console.warn("vocabReducer does nothing",{state,action})
  return state
}

const newLookupParams = params => {
}
export const mapDispatchToProps = 
  dispatch => {
    let actionsByApi = _.mapValues(
      apis, 
      api=>{
        return bindActionCreators(api.actionCreators, dispatch)
      })
    return {actions: actionsByApi}
  }

const loadVocabularies = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init
  /*
    .do(action=>{
      console.log({action, state: store.getState()})
      debugger
    })
  */
    .filter(() => _.isEmpty(store.getState().vocabularies))
    .take(1)
    .mergeMap(()=>{
      let loadAction = vocabulariesApi.actionCreators.load()
      let fakeState = vocabulariesApi.callsReducer({},loadAction)
      let fakeCall = fakeState.primary
      return Rx.Observable.of(loadAction)
    })
    /*
    .mergeMap((action)=>{
      let loadAction = vocabulariesApi.actionCreators.load(action)
      return Rx.Observable.of(loadAction)
    })
    */
)
const loadConceptIds = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE')
    .switchMap(action=>{
      let {path,search,hash,state,key} = action
      let query = myrouter.getQuery()
      let go = false
      if (_.has(state, 'vocabulary_id') || _.has(state, 'concept_code_search_pattern')) {
        go = true
      }
      if (typeof state === 'undefined') { // initializing?
        go = true
      }
      let {vocabulary_id, concept_code_search_pattern} = query
      if (go && vocabulary_id && concept_code_search_pattern) {
        let params = {vocabulary_id, concept_code_search_pattern}
        let loadAction = codesToCidsApi.actionCreators.load({params})
        let fakeState = codesToCidsApi.callsReducer({},loadAction)
        let fakeCall = fakeState.primary
        return Rx.Observable.of(fakeCall)
      }
      return Rx.Observable.empty()
    })
)
export const epics = [ loadVocabularies, loadConceptIds, ]
