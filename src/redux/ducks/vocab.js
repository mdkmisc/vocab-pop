import { browserHistory, } from 'react-router'
import * as AppState from '../../AppState'
import Rx from 'rxjs/Rx'
import myrouter from '../myrouter'

import { createSelector } from 'reselect'
import _ from '../../supergroup'; // in global space anyway...
var d3 = require('d3')

// selector stuff
const recs = state => state.vocab.recs
export const sourceConceptCodesSG = createSelector(
  recs,
  recs => {
    console.log('computing selector for', recs)
    let scc = 
      _.supergroup( (recs||[]), 
                    d=>`${d.src_concept_code}: ${d.src_concept_name}`,
                    { dimName:'source' }
                  )
    scc.forEach(d => {
                  d.src_concept_code = d.toString().split(/:/)[0]
                  d.src_concept_name = d.toString().split(/: /)[1]
                })
    scc = scc.sort((a,b)=>d3.ascending(a.src_concept_code,b.src_concept_code))
    scc.addLevel('relationship')
    scc.addLevel(d=>`${d.target_concept_code}: ${d.target_concept_name}`,{dimName:'target'})

    /*
    scc.flattenTree().forEach(
      val => Object.defineProperty(val, 'title',
                              {get:function() {return this.toString() }})
    )
    */
    return scc
  }
)
export const sourceRelationshipsSG = createSelector(
  recs,
  recs => {
    let sr = _.supergroup((recs||[]), 'relationship')
    sr.addLevel(d=>`${d.target_concept_code}: ${d.target_concept_name}`,{dimName:'target'})
    return sr
  }
)
export const sourceRecordCountsSG = createSelector(
  recs,
  // recs.filter(d=>(d.src_rcs||[]).length).map(d=>(d.src_rcs||[]))
  recs => {
    let cnts = 
      _.flattenDeep(
        recs.map(
          d=>[
            (d.target_rcs||[]).map(c=>({rec:d,cnt:c})),
            (d.src_rcs||[]).map(c=>({rec:d,cnt:c}))
          ]
        )
      )
      .map(d=>({
        cnt:d.cnt,
        rec:d.rec,
        tblcol:`${d.cnt.tbl}.${d.cnt.col}`,
        rc:d.cnt.rc,
        src:d.cnt.src,
        crc:d.cnt.crc,
      }))
    let tblcols = _.supergroup(cnts, 'tblcol')
    return tblcols
  }
)

/* eslint-disable */
export const VOCABULARY_ID = 'VOCABULARY_ID'
export const CONCEPT_CODES = 'CONCEPT_CODES'
export const CONCEPT_CODE_SEARCH_PATTERN = 'CONCEPT_CODE_SEARCH_PATTERN'
export const VOCABULARY_ID_CONCEPT_CODE_SEARCH_PATTERN = 'VOCABULARY_ID_CONCEPT_CODE_SEARCH_PATTERN'

export const LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN = 'LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN';
export const LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED = 'LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED';
export const LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_REJECTED = 'LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_REJECTED';

export const LOAD_VOCABS = 'LOAD_VOCABS';
export const LOAD_VOCABS_FULFILLED = 'LOAD_VOCABS_FULFILLED';
export const LOAD_VOCABS_REJECTED = 'LOAD_VOCABS_REJECTED';



let someDefaultVals = {
      vocabulary_id:'ICD9CM', 
      concept_code_search_pattern:'401.1%,401.2,401.3%',
    }
const vocabReducer = (state={recs:[]}, action) => {
//const vocabReducer = (state=someDefaultVals, action) => {}
  //console.log('vocab REDUCER', {state, action})
  switch (action.type) {
    case '@@redux-form/UPDATE_SYNC_ERRORS':
      debugger
      return state
    case LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN:
    case VOCABULARY_ID:
    case CONCEPT_CODE_SEARCH_PATTERN:
    case VOCABULARY_ID_CONCEPT_CODE_SEARCH_PATTERN:
      let newState = {
        ...state,
        ...action.payload,
        fromSrcErr: undefined,
        recs:undefined,
        isPending: true,
      }
      //console.log('state change', state, newState)
      return newState
    case LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED:
      let recs = action.payload
      if (recs.length) {
        return { ...state, isPending: false, recs, }
      }
      return { ...state, isPending: false, recs:undefined,
        fromSrcErr: {statusText: 'No matching concepts'},
        };
    case LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_REJECTED:
      return {
        ...state,
        isPending: false,
        fromSrcErr: action.payload,
      };
    case LOAD_VOCABS:
      return {
        ...state,
        vocabErr: undefined,
        vocabPending: true,
        values: action.payload,
        vocabs:undefined,
      };
    case LOAD_VOCABS_FULFILLED:
      let vocabs = action.payload
      return { ...state, vocabs,
                vocabPending: false }
    case LOAD_VOCABS_REJECTED:
      return {
        ...state, vocabPending: false,
        vocabErr: action.payload,
      };
    default:
      //console.log('unhandled action', action)
      return state
  }
}
export default vocabReducer

export const loadFromConceptCodesEpic =
  (action$, store) => {
    //console.log(action$)
    return (
      action$
        .filter(
          action=>{
            //console.log('filtering',action.type)
            return _.includes([
              VOCABULARY_ID,
              CONCEPT_CODE_SEARCH_PATTERN,
              LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN
            ], action.type)
          }
        )
        .do(action=>console.log('epic',action))
        .switchMap(action => {
          let {type, payload} = action
          let state = store.getState().vocab
          let params = {}
          if (type === VOCABULARY_ID) {
            params.vocabulary_id = payload.vocabulary_id
            params.concept_code_search_pattern = state.concept_code_search_pattern
          } else if (type === CONCEPT_CODE_SEARCH_PATTERN) {
            params.concept_code_search_pattern = payload.concept_code_search_pattern
            params.vocabulary_id = state.vocabulary_id
          } else if (type === LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN) {
            params.vocabulary_id = payload.vocabulary_id
            params.concept_code_search_pattern = payload.concept_code_search_pattern
          }
          let stream = new AppState.ApiStream({
            apiCall: 'codesToSource',
            params,
            wantRxAjax: true,
          })
          return (
            stream.rxAjax.flatMap(
              response => {
                //console.log('stream', stream.url, 'came back with', response)
                /*
                return Rx.Observable.of(
                          { type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                            payload: response});
                */
                return (
                  Rx.Observable.concat(
                      Rx.Observable.of(
                          { type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                            payload: response}),
                      Rx.Observable.of(
                          { type: myrouter.QUERY_PARAMS, 
                            payload: params})
                  )
                  /*
                  Rx.Observable.concat(
                      Rx.Observable.of(
                        (payload) => ({
                          type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                          payload})),
                      Rx.Observable.of(
                        { type: myrouter.QUERY_PARAMS, 
                          payload: params})
                  )
                  */
                  .catch(error => {
                    return Rx.Observable.of({
                              type: `${type}_REJECTED`,
                              payload: error.xhr.response,
                              error: true
                            })
                  })
                )
              }
            )
          )
        })
  //browserHistory.push({vocabulary_id, concept_code_search_pattern})
  )}

export const loadVocabs = (
    (values) => ({ type: LOAD_VOCABS, payload: values }))
export const loadedVocabsFulfilled = 
    (payload) => ({ type: LOAD_VOCABS_FULFILLED, 
                   payload})
export const loadVocabsEpic =
  (action$) => (
    action$.ofType(LOAD_VOCABS)
      .mergeMap(action => {
        let stream = new AppState.ApiStream({
          apiCall: 'vocabularies',
          params: {},
          wantRxAjax: true,
        })
        return (
          stream.rxAjax
            .map(response => loadedVocabsFulfilled(response))
            .catch(error => {
              return Rx.Observable.of({
                        type: LOAD_VOCABS_REJECTED,
                        payload: error.xhr.response,
                        error: true
                      })
            }))
      })
  )
