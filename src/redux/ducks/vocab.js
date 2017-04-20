import { createSelector } from 'reselect'
import { browserHistory, } from 'react-router'
import Rx from 'rxjs/Rx'
import myrouter from '../myrouter'

import _ from '../../supergroup'; // in global space anyway...
var d3 = require('d3')
import {apiActions, apiStore, Api} from '../apiGlobal'

let vocabularies = new Api({
  apiName: 'vocabularies',
})
let codeSearchToCids = new Api({
  apiName: 'codeSearchToCids',
  defaultResults: [],
})
// selector stuff
const conceptInfo = createSelector(
  apiStore,
  apiStore => {
    return apiStore('conceptInfo')
  }
)
const conceptInfoWithMatchStrs = createSelector(
  apiStore,
  apiStore => {
    let concepts = apiStore('conceptInfo')
    if (!concepts)
      return []
    let matchedIds = apiStore('codeSearchToCids')
    //console.log({concepts,matchedIds})
    return concepts.map(
      concept => {
        let match = matchedIds.find(m=>m.concept_id===concept.concept_id) || {}
        let {match_strs=[]} = match
        return { ...concept,
                match_strs:match_strs.join(', ')}
      }
    )
  }
)
const selectors = {
  conceptInfo,
  conceptInfoWithMatchStrs,
}
let conceptInfoApi = new Api({
  apiName: 'conceptInfo',
  defaultResults: [],
  paramValidation: ({concept_ids}) => ( 
      Array.isArray(concept_ids) && concept_ids.length),
  paramTransform: (concept_ids) => {
    return ({concept_ids: concept_ids.map(d=>d.concept_id)})
  },
  selectors,
})
export const apis = {
  vocabularies,
  codeSearchToCids,
  conceptInfo: conceptInfoApi,
}

export const VOCABULARY_ID = 'VOCABULARY_ID'
export const CONCEPT_CODE_SEARCH_PATTERN = 'CONCEPT_CODE_SEARCH_PATTERN'

export const epics = [
  //formValToRoute,
]
export const sourceConceptCodesSG = createSelector(
  conceptInfoWithMatchStrs,
  conceptInfo => {
    //console.log('computing selector for', conceptInfo)
    let recs = Array.isArray(conceptInfo) ? conceptInfo : []
    let scc = 
      _.supergroup( recs,
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
  conceptInfo,
  conceptInfo => {
    let tblcols = _.supergroup( 
                      _.flatten((conceptInfo||[]).map(d=>d.rcs)),
                      ['tbl','col'])
    return tblcols
  }
)
*/
export const sourceRelationshipsSG = createSelector(
  conceptInfo,
  conceptInfo => {
    let recs = Array.isArray(conceptInfo) ? conceptInfo : []
    let sr = _.supergroup( 
                      _.flatten(recs.map(d=>d.rels)),
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
  conceptInfo,
  // conceptInfo.filter(d=>(d.rcs||[]).length).map(d=>(d.rcs||[]))
  conceptInfo => (
      _.flattenDeep(
        (conceptInfo||[]).map(
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
/*
const initialVocabState = {
  conceptInfo: [],
  vocabulary_id: undefined, // should be elsewhere?
  concept_code_search_pattern: '',
}
*/
/*
const formValToRoute = (action$,store) =>
  action$
    .ofType('@@redux-form/CHANGE')
    .filter(action => action.meta.form === 'concept_codes_form')
    //.do(action=>console.error({action,state:store.getState()}))
    //.do(action=>api.examineAction({from:'formValToRoute epic',action$, action, store}))
    /*
    .do(action=>store.dispatch({
        type: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN, 
        payload: { [action.meta.field]: action.payload },
    }))
    * /
    .map(
      action => ({  type: myrouter.QUERY_ADD, 
                    payload: { [action.meta.field]: action.payload }}))
const fetchConceptIdsForCodes = (action$, store) =>
  action$.ofType(CONCEPT_CODE_SEARCH_PATTERN)
    //.do(action=>api.examineAction({from:'fetchConceptIdsForCodes epic',action$, action, store}))
    .switchMap(action => {
      let {type, payload} = action
      let state = store.getState().vocab
      let params = _.pick(Object.assign({}, state, payload), 
                          ['vocabulary_id','concept_code_search_pattern'])
      let ajax = new AxxppState.ApiStream({
                      apiName: 'codeSearchToCids',
                      params,
                      wantRxAjax: true,
                    })
                    .rxAjax
      return (
        ajax
          //.flatMap( // not using flatMap because I understand why...not sure why it's here)
          //.do(action=>api.examineAction({from:'fetchConceptIdsForCodes ajax return',action$, action, store}))
          .mergeMap(response => { // or mergeMap...grabbing from https://redux-observable.js.org/docs/basics/Epics.html
                    // i was using flatMap before in order to return 
                    //   Rx.Observable.concat(Rx.Observable.of(action),
                    //                        Rx.Observable.of(anotherAction))
            return (
              Rx.Observable.of(
                  { type: CONCEPT_CODE_SEARCH_PATTERN_FULFILLED, 
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
*/
    /*
const fetchConceptInfo = (action$, store) =>
  action$
    .ofType("FIX LATER")
    //.do(action=>api.examineAction({from:'fetchConceptInfo',action$, action, store}))
    .map(action=>({type:"LOAD_CONCEPTS?", payload:{action}}))
    .ofType(LOAD_CONCEPTS, LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN_FULFILLED)
    .switchMap(
      actionk=> {
        let codes = action.payload
        if (!codes || codes.length === 0) return []
        return (
          new AxxppState.ApiStream({
            apiName: 'conceptInfo',
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
                new AxxppState.ApiStream({
                  apiName: 'conceptInfo',
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
                * /
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
                      { type: myrouter.QUERY_ADD, 
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
    })
      */
