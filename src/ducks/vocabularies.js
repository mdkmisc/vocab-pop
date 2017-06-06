/* eslint-disable */


/* load other small lookup tables here and rename from vocabularies */

import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';
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
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter((action) => (action.meta||{}).apiPathname === apiPathname)
    .map(action=>{
      let {type, payload, meta} = action
      return {type:vocabActions.GOT_DATA, payload} 
    })
)
epics.push(loadVocabularies)
//export {epics} //combining below
/**** end epics ******************************************/















/* code copied from above. combine at some point */

export const relActions = {
  GOT_DATA: 'vocab-pop/vocabularies-rel/GOT_DATA',
}
const relApiPathname = 'relationships'

/**** start reducers *********************************************************/
const relationshipsReducer = (state=[], action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case relActions.GOT_DATA:
      return _.sortBy(payload, d=>d.relationship_id).concat(
              [{relationship_id:'ancestor',relationship_name:'Ancestor',reverse_relationship_id:'descendant'},
               {relationship_id:'descendant',relationship_name:'Descendant',reverse_relationship_id:'ancestor'},
              ])
  }
  return state
}
export {relationshipsReducer}
/**** end reducers *********************************************************/


/**** start selectors *****************************************************************/
export const relationships = state => state.relationships
export const relMetaById = createSelector(
  relationships,
  rels => util.arr2map(rels, r=>r.relationship_id)
)
export const relMeta = createSelector(relMetaById, byId => id => byId[id])
export const reverseRel = createSelector(
  relMeta, 
  meta => id => meta(id).reverse_relationship_id)

/**** end selectors *****************************************************************/


/**** start epics ******************************************/
const relationshipsCall = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init -- why not on @@INIT?
  //action$.ofType('@@INIT') // DOESN'T WORK ... too early, not sure why
    .filter(() => _.isEmpty(store.getState().relationships))
    .take(1)
    .mergeMap(()=>{
      return Rx.Observable.of(api.actionGenerators.apiCall({apiPathname:relApiPathname}))
    })
    .catch(err => {
      console.error('error in relationshipsCall', err)
      return Rx.Observable.of({
        type: 'vocab-pop/vocabularies-rel/FAILURE',
        meta: {apiPathname:relApiPathname},
        error: true
      })
    })
)
epics.push(relationshipsCall)
const loadRelationships = (action$, store) => (
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter((action) => (action.meta||{}).apiPathname === relApiPathname)
    .map(action=>{
      let {type, payload, meta} = action
      return {type:relActions.GOT_DATA, payload} 
    })
)
epics.push(loadRelationships)
/**** end epics ******************************************/

export {epics} // combined


