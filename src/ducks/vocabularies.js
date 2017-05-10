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
      return payload
  }
  return state
}
export default reducer
/**** end reducers *********************************************************/


/**** start selectors *****************************************************************/
export const vocabularies = state => state.vocabularies
/**** end selectors *****************************************************************/


/**** start epics ******************************************/

const loadVocabularies = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init
    .filter(() => _.isEmpty(store.getState().vocabularies))
    .take(1)
    .mergeMap(()=>{
      let url = api.apiGetUrl(apiPathname)
      return api.cachedAjax(url)
              .map(results=>{
                //console.log(results)
                return {type:vocabActions.GOT_DATA,
                          payload:results}
              })
              .catch(err => {
                console.log('error loading vocabularies', err)
                return Rx.Observable.of({
                  type: apiActions.API_CALL_REJECTED,
                  payload: err.xhr.response,
                  meta: {apiPathname},
                  error: true
                })
              })
    })
)
export const epics = [ loadVocabularies ]

/**** end epics ******************************************/
