/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as api from 'src/api'
import myrouter from 'src/myrouter'

import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { createSelector } from 'reselect'
import { combineEpics } from 'redux-observable'
window.createSelector = createSelector

export const cidsActions = {
  NEW_CIDS: 'vocab-pop/cids/NEW_CIDS',
  GET_NEW_CIDS: 'vocab-pop/cids/GET_NEW_CIDS',
}
const apiPathname = matchBy=> (
  (matchBy === 'codes' && 'codeSearchToCids') ||
  'notWorkingYet'
)

/**** start reducers *********************************************************/
const reducer = (state=[], action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case cidsActions.NEW_CIDS:
      return payload
    case "@@redux-form/CHANGE":
      if (action.meta.form === "concept_codes_form") {
        return []
      }
  }
  return state
}
export default reducer
/**** end reducers *********************************************************/


/**** start selectors *****************************************************************/
export const cids_w_match = state => state.cids||[]
export const cids = createSelector( cids_w_match, cwm=>cwm.map(d=>d.concept_id))
/**** end selectors *****************************************************************/

let epics = [ ]
const getCidsTrigger = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE')
    .mergeMap(action=>{
      let {path,search,hash,state,key} = action
      let query = myrouter.getQuery()
      let go = false
      if (_.has(state, 'vocabulary_id') || 
          _.has(state, 'matchStr') ||
          _.has(state, 'matchBy')) {
        go = true
      }
      if (typeof state === 'undefined') { // initializing?
        go = true
      }
      let {vocabulary_id, matchBy, matchStr} = query
      if (go && vocabulary_id && matchStr) {
        return Rx.Observable.of({type: cidsActions.GET_NEW_CIDS})
      }
      return Rx.Observable.empty()
    })
)
epics.push(getCidsTrigger)
const cidsCall = (action$, store) => (
  action$.ofType(cidsActions.GET_NEW_CIDS)
    .switchMap(action=>{
      let {path,search,hash,state,key} = action
      let query = myrouter.getQuery()
      let {vocabulary_id, matchBy, matchStr} = query
      if (vocabulary_id && matchStr) {
        let params = {vocabulary_id, matchBy, concept_code_search_pattern:matchStr}
        return Rx.Observable.of(api.actionGenerators.apiCall({apiPathname:apiPathname(matchBy),params}))
      }
      return Rx.Observable.empty()
    })
    .catch(err => {
      console.error('error in loadConceptIds', err)
      debugger
      return Rx.Observable.of({
        type: 'vocab-pop/cids/FAILURE',
        meta: {action},
        error: true
      })
    })
)
epics.push(cidsCall)

const loadCids = (action$, store) => (
  action$.ofType(api.apiActions.API_CALL)
    .filter((action) => 
            (action.payload||{}).apiPathname === 'codeSearchToCids')
    .mergeMap((action)=>{
      let {type, payload, meta, error} = action
      let {apiPathname, params, url} = payload
      return api.apiCall({apiPathname, params, url, }, store)
    })
    .catch(err => {
      console.error('error in loadVocabularies', err)
      return Rx.Observable.of({
        type: 'vocab-pop/vocabularies/FAILURE',
        meta: {apiPathname:'codeSearchToCids'},
        error: true
      })
    })
    .map(action=>{
      let {type, payload, meta} = action
      if (!_.includes([api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS], type)) {
        throw new Error("did something go wrong?")
      }
      return {type:cidsActions.NEW_CIDS, payload}
    })
)
epics.push(loadCids)
export {epics}
