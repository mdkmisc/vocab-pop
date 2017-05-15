/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as api from 'src/api'

import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { createSelector } from 'reselect'
import { combineEpics } from 'redux-observable'

export const vocabActions = {
  GOT_DATA: 'vocab-pop/vocabularies/GOT_DATA',
}
const apiPathname = 'vocabularies'

/**** start reducers *********************************************************/
const reducer = (state=[], action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case vocabActions.GOT_DATA:
      return _.sortBy(payload, d=>d.vocabulary_id)
  }
  return state
}
export default reducer
/**** end reducers *********************************************************/


/**** start selectors *****************************************************************/
export const vocabularies = state => state.vocabularies
/**** end selectors *****************************************************************/


/**** start epics ******************************************/
let epics = []
const vocabCall = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init
    .filter(() => _.isEmpty(store.getState().vocabularies))
    .take(1)
    .mergeMap(()=>{
      return Rx.Observable.of(api.actionGenerators.apiCall({apiPathname}))
    })
    .catch(err => {
      console.error('error in vocabCall', err)
      return Rx.Observable.of({
        type: 'vocab-pop/vocabularies/FAILURE',
        meta: {apiPathname},
        error: true
      })
    })
)
epics.push(vocabCall)
const loadVocabularies = (action$, store) => (
  action$.ofType(api.apiActions.API_CALL)
    .filter((action) => (action.payload||{}).apiPathname === apiPathname)
    .mergeMap((action)=>{
      let {type, payload, meta, error} = action
      let {apiPathname, params, url} = payload
      return api.apiCall({apiPathname, /*params,*/ url, }, store)
    })
    .catch(err => {
      console.error('error in loadVocabularies', err)
      return Rx.Observable.of({
        type: 'vocab-pop/vocabularies/FAILURE',
        meta: {apiPathname},
        error: true
      })
    })
    .map(action=>{
      let {type, payload, meta} = action
      if (!_.includes([api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS], type)) {
        throw new Error("did something go wrong?")
      }
      return {type:vocabActions.GOT_DATA, payload} 
    })
)
epics.push(loadVocabularies)
export {epics}
/**** end epics ******************************************/
