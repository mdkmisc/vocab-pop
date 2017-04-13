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
                    d=>`${d.concept_code}: ${d.concept_name}`,
                    { dimName:'source' }
                  )
    scc.forEach(d => {
                  d.concept_code = d.toString().split(/:/)[0]
                  d.concept_name = d.toString().split(/: /)[1]
                })
    scc = scc.sort((a,b)=>d3.ascending(a.concept_code,b.concept_code))
    //scc.addLevel('relationship')
    //scc.addLevel(d=>`${d.target_concept_code}: ${d.target_concept_name}`,{dimName:'target'})

    /*
    scc.flattenTree().forEach(
      val => Object.defineProperty(val, 'title',
                              {get:function() {return this.toString() }})
    )
    */
    return scc
  }
)
/*
export const sourceRecordCountsSG = createSelector(
  recs,
  recs => {
    let tblcols = _.supergroup( 
                      _.flatten((recs||[]).map(d=>d.rcs)),
                      ['tbl','col'])
    return tblcols
  }
)
*/
export const sourceRelationshipsSG = createSelector(
  recs,
  recs => {
    let sr = _.supergroup( 
                      _.flatten((recs||[]).map(d=>d.rels)),
                      ['relationship',])

    sr.addLevel(d=>`${d.vocabulary_id} / ${d.domain_id} / ${d.concept_class_id}`,{dimName:'vocab/domain/class'})
    sr.leafNodes().forEach(d => {
      d.vocabulary_id = _.uniq(d.records.map(r=>r.vocabulary_id)).join(',')
      d.domain_id = _.uniq(d.records.map(r=>r.domain_id)).join(',')
      d.concept_class_id = _.uniq(d.records.map(r=>r.concept_class_id)).join(',')
      //d.counts = _.supergroup(_.flatten(d.records.map(d=>d.rcs)),['tbl','col'])
    })

    sr.addLevel('concept_id')
    sr.leafNodes().forEach(d => {
      d.concept_name = _.uniq(d.records.map(r=>r.concept_name)).join(',')
      d.concept_code = _.uniq(d.records.map(r=>r.concept_code)).join(',')
      //d.counts = _.supergroup(_.flatten(d.records.map(d=>d.rcs)),['tbl','col'])
    })
    return sr
  }
)
/*
export const relcounts = createSelector(
  recs,
  // recs.filter(d=>(d.rcs||[]).length).map(d=>(d.rcs||[]))
  recs => (
      _.flattenDeep(
        (recs||[]).map(
          d=>[
            (d.target_rcs||[]).map(c=>({rec:d,cnt:c})),
            (d.rcs||[]).map(c=>({rec:d,cnt:c}))
          ]
        )
      )
      .map(d=>({
        cnt:d.cnt,
        rec:d.rec,
        tbl:d.cnt.tbl,
        col:d.cnt.col,
        tblcol:`${d.cnt.tbl}.${d.cnt.col}`,
        rc:d.cnt.rc,
        src:d.cnt.src,
        crc:d.cnt.crc,
        total:_.sum(['rc','src','crc'].map(c=>d.cnt[c])),
      }))
  )
)
*/

/* eslint-disable */
export const VOCABULARY_ID = 'VOCABULARY_ID'
export const CONCEPT_CODES = 'CONCEPT_CODES'
export const CONCEPT_CODE_SEARCH_PATTERN = 'CONCEPT_CODE_SEARCH_PATTERN'

export const LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN = 'LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN';
export const LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED = 'LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED';
export const LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_REJECTED = 'LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_REJECTED';

export const LOAD_CONCEPTS = 'LOAD_CONCEPTS';
export const LOAD_CONCEPTS_FULFILLED = 'LOAD_CONCEPTS_FULFILLED';
export const LOAD_CONCEPTS_REJECTED = 'LOAD_CONCEPTS_REJECTED';

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
      return {
        ...state,
        ...action.payload,
        fromSrcErr: undefined,
        recs:undefined,
        isPending: true,
      }
    case LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED:
      return {
        ...state,
        matchedConceptIds: action.payload,
        isPending: false,
      }
    case LOAD_CONCEPTS:
      return {
        ...state,
        ...action.payload,
        recs:undefined,
        isPending: true,
      }
    case LOAD_CONCEPTS_FULFILLED:
      let recs = action.payload
      if (typeof recs === 'string') debugger
      if (recs.length) {
        return { ...state, isPending: false, recs, }
      }
      return { ...state, isPending: false, recs:undefined,
        fromSrcErr: {statusText: 'No matching concepts'},
        };
    case LOAD_CONCEPTS_REJECTED:
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

export const formValToRoute = (action$,store) =>
  action$
    .ofType('@@redux-form/CHANGE')
    .do(action=>console.log('formValToRoute epic sees',action))
    .filter(action => action.meta.form === 'concept_codes_form')
    .do(action=>store.dispatch({
        type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN, 
        payload: { [action.meta.field]: action.payload },
    }))
    .map(
      action => ({  type: myrouter.QUERY_PARAMS, 
                    payload: { [action.meta.field]: action.payload }}))

export const fetchConceptIdsForCodes = (action$, store) =>
  action$.ofType(LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN)
    .do(action=>console.log('fcidfc epic sees',action))
    .switchMap(action => {
      let {type, payload} = action
      let state = store.getState().vocab
      let params = _.pick(Object.assign({}, state, payload), 
                          ['vocabulary_id','concept_code_search_pattern'])
      let ajax = new AppState.ApiStream({
                      apiCall: 'codeSearchToCids',
                      params,
                      wantRxAjax: true,
                    })
                    .rxAjax
      return (
        ajax
          //.flatMap( // not using flatMap because I understand why...not sure why it's here)
          .mergeMap(response => { // or mergeMap...grabbing from https://redux-observable.js.org/docs/basics/Epics.html
                    // i was using flatMap before in order to return 
                    //   Rx.Observable.concat(Rx.Observable.of(action),
                    //                        Rx.Observable.of(anotherAction))
            return (
              Rx.Observable.of(
                  { type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                    payload: response}
              )
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

export const fetchConceptInfo = (action$, store) =>
  action$
    .do(action=>console.log('LOAD_CONCEPTS epic sees',{action,store}))
    .ofType(LOAD_CONCEPTS, LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED)
    .switchMap(
      action => {
        let codes = action.payload
        if (!codes || codes.length === 0) return []
        return (
          new AppState.ApiStream({
            apiCall: 'conceptInfo',
            params: {concept_ids:`[${codes.map(d=>d.concept_id)}]`},
              //Object.assign({},params,{concept_ids:[codes.map(d=>d.concept_id)]}),
            wantRxAjax: true,
          })
          .rxAjax
          .map(info=>
                info.map(inf=>
                Object.assign({}, inf, {
                  match_strs: codes.find(
                    c=>c.concept_id===inf.concept_id).match_strs
                }))
          )
          .catch(error => {
            return Rx.Observable.of({
                      type: `${type}_REJECTED`,
                      payload: error.xhr.response,
                      error: true
                    })
          })
          .switchMap(
            info => {
              //debugger
              return (
                  Rx.Observable.of(
                      { type: LOAD_CONCEPTS_FULFILLED, 
                        payload: info})
                        /* this is the second level stuff:
                new AppState.ApiStream({
                  apiCall: 'conceptInfo',
                  params: {concept_ids:`[${_.flatten(info.map(i=>i.rels)).map(r=>r.concept_id)}]`},
                  wantRxAjax: true,
                })
                .rxAjax
                .map(relInfo=> {
                  // MUTATING!
                  //debugger
                  return info.map(inf=> {
                    inf.rels = inf.rels.map(
                      rel=>{
                        let ri = relInfo.find(ri=>ri.concept_id===rel.concept_id)
                        ri = ri || {}
                        ri.relationship = (rel||{}).relationship
                        return ri // replace rel with ri, has all the same stuff and more i think
                      })
                    return inf
                  })
                })
                */
              )
            }
          )
      )
      /*
      return (
        ajax.flatMap( // not using flatMap because I understand why...not sure why it's here
          response => {
            return (
              Rx.Observable.concat(
                  Rx.Observable.of(
                      { type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
                        payload: response})
/*
                        ,
                  Rx.Observable.of(
                      { type: myrouter.QUERY_PARAMS, 
                        payload: params})
* /
              )
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
      */
    })

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
