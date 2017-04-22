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
export const conceptInfo = createSelector(
  apiStore,
  apiStore => {
    return apiStore('conceptInfo')
  }
)
export const conceptInfoWithMatchStrs = createSelector(
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
export const getCounts = ({concepts, ...opts}) => {
  if (!_.isEmpty(opts))
    debugger //throw new Error("opt to handle?")
  
  let tblcols = _.supergroup( 
                    _.flatten(concepts.map(d=>d.rcs)),
                    ['tbl','col'])
  let cnts = 
    tblcols
      .leafNodes()
      .map((col,k) => ({
        colName: col.toString(),
        tblName: col.parent.toString(),
        col,
        cnts: _.chain(['rc','src','crc'])
                .map(cntType=>[cntType, col.aggregate(_.sum,cntType)])
                .filter(c => c[1]>0)
                .fromPairs()
                .value(),
      }))
  return cnts
}
/*
export const groupByRelationshipType = ({concepts=[], ...opts}) => {
  let sr = _.supergroup( 
                    _.flatten(concepts.map(d=>d.rels)),
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
*/

export const plainSelectors = {
  getCounts, 
}
let conceptInfoApi = new Api({
  apiName: 'conceptInfo',
  defaultResults: [],
  paramValidation: ({concept_ids}) => ( 
      Array.isArray(concept_ids) && concept_ids.length),
  paramTransform: (concept_ids) => {
    return ({concept_ids: concept_ids.map(d=>d.concept_id)})
  },
  selectors: {
    conceptInfo,
    conceptInfoWithMatchStrs,
  }
  /*  from old loader: (need again?)
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
})
export const apis = {
  vocabularies,
  codeSearchToCids,
  conceptInfo: conceptInfoApi,
}

export const VOCABULARY_ID = 'VOCABULARY_ID'
export const CONCEPT_CODE_SEARCH_PATTERN = 'CONCEPT_CODE_SEARCH_PATTERN'

export const epics = [
]
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
