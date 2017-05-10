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
}
const apiPathname = 'codeSearchToCids'

/**** start reducers *********************************************************/
const reducer = (state=[], action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case cidsActions.NEW_CIDS:
      return payload
  }
  return state
}
export default reducer
/**** end reducers *********************************************************/


/**** start selectors *****************************************************************/
export const cids_w_match = state => state.cids||[]
export const cids = createSelector( cids_w_match, cwm=>cwm.map(d=>d.concept_id))
/**** end selectors *****************************************************************/

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
        let url = api.apiGetUrl(apiPathname, params)
        return api.cachedAjax(url)
                .map(results=>{
                  console.log(results)
                  return {type:cidsActions.NEW_CIDS,
                            payload:results}
                })
                .catch(err => {
                  console.log('error loading cids', err)
                  return Rx.Observable.of({
                    type: apiActions.API_CALL_REJECTED,
                    payload: err.xhr.response,
                    meta: {apiPathname},
                    error: true
                  })
                })

      }
      return Rx.Observable.empty()
    })
)
export const epics = [ loadConceptIds, ]
