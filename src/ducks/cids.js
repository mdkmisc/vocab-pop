/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as api from 'src/api'
import myrouter from 'src/myrouter'
import * as cset$ from 'src/ducks/conceptSet'

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
  (matchBy === 'text' && 'conceptNameSearch') ||
  `noApiPathFor_${matchBy}`
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

/**** start action creators *********************************************************/
export const getNewCids = 
  (payload) => ({
    type: cidsActions.GET_NEW_CIDS,
    payload,
  })
/**** end action creators *********************************************************/

/**** start selectors *****************************************************************/
export const cids_w_match = state => state.cids||[]
export const cids = createSelector( cids_w_match, cwm=>cwm.map(d=>d.concept_id))
/**** end selectors *****************************************************************/

let epics = [ ]
const getCidsTrigger = (action$, store) => (
  action$.ofType('@@redux-form/CHANGE','@@redux-form/INITIALIZE')
    .filter(action=>action.meta.form === 'concept_codes_form')
    .debounceTime(500)
    .mergeMap(action=>{
      let {payload, meta: {form, field,}} = action
      let formState = store.getState().form[form]
      let {values} = formState
      let {vocabulary_id, matchBy, matchStr} = values
      //myrouter.addParams(values)
      if (vocabulary_id && matchBy && matchStr) {
        return Rx.Observable.of(getNewCids(values))
      }
      return Rx.Observable.empty()
    })
)
epics.push(getCidsTrigger)

const cidsCall = (action$, store) => (
  action$.ofType(cidsActions.GET_NEW_CIDS)
    .switchMap(action=>{
      let {payload:{vocabulary_id, matchBy, matchStr}} = action
      if (matchBy === 'codes') {
        let params = {vocabulary_id, concept_code_search_pattern:matchStr}
        return Rx.Observable.of(api.actionGenerators.apiCall(
          {apiPathname:apiPathname(matchBy),params}))
      } else if (matchBy === 'text') {
        let params = {vocabulary_id, match_str: matchStr}
        return Rx.Observable.of(api.actionGenerators.apiCall(
          {apiPathname:apiPathname(matchBy),params}))
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
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter(
      (action) => 
        (action.meta||{}).apiPathname === 'codeSearchToCids' ||
        (action.meta||{}).apiPathname === 'conceptNameSearch'
    )
    .map(action=>{
      let {type, payload, meta, error} = action
      if (error) {
        console.error(error)
        debugger
        return action
      }
      return {type:cidsActions.NEW_CIDS, payload}
    })
)
epics.push(loadCids)
export {epics}
