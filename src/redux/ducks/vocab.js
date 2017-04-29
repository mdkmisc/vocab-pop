/* eslint-disable */
import { combineEpics } from 'redux-observable'
import { createSelector } from 'reselect'
import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import _ from '../../supergroup'; // in global space anyway...
var d3 = require('d3')
import * as api from '../api'
import myrouter from '../myrouter'

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
export const plainSelectors = {
  getCounts, 
}

let vocabulariesApi = new api.Api({
  apiName: 'vocabulariesApi',
  apiPathname: 'vocabularies',
})
let codesToCidsApi = new api.Api({
  apiName: 'codesToCidsApi',
  apiPathname: 'codesToCids',
  /*
  selectors: {
    concept_ids: createSelector(
      api.selectors.results,
      (results=[]) => {
                    return state=>results(state)
                  }
    )
  },
    */
  defaultResults: [],
})
let conceptInfoApi = new api.Api({
  apiName: 'conceptInfoApi',
  apiPathname: 'conceptInfo',
  defaultResults: [],
  paramValidation: ({concept_ids}) => {
    console.log('validating', concept_ids)
    return (
      Array.isArray(concept_ids) && 
        concept_ids.length  &&
        _.every(concept_ids, _.isNumber)
    )
  },
  /*
  paramTransform: (concept_ids) => {
    return ({concept_ids: concept_ids.map(d=>d.concept_id)})
  },
  */
// selector stuff
  /*
  selectors: {
    conceptInfo: (state,action,props) => {
      let calls = _.get(state,['apis',props.apiName,'calls'])
      return calls && calls(state,props)
    },
    conceptInfoWithMatchStrs: (state,action,props) => {
      let calls = _.get(state,['apis',props.apiName,'calls'])
      return calls && calls(state,props)
      //return conceptInfo(state,action,props)
    }
  },
  */
  plainSelectors: {},
  apiSelectorMakers: {
    conceptInfo: (api) => {
      return (state,action) => {
        let calls = _.get(state,['apis',api.apiName,'calls'])
        return calls && calls(state,action)
      }
    },
    /*
    conceptInfoWithMatchStrs: (state,props={}) => {
      let calls = _.get(state,['apis',props.apiName,'calls'])
      return calls && calls(state,props)
      //return conceptInfo(state,action,props)
    }
    */
  }
  /*  from old loader: (need again?)
                .map(relInfo=> {
                  // MUTATING!
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
  vocabulariesApi,
  codesToCidsApi,
  conceptInfoApi,
}

export const callReducers = combineReducers(
  _.mapValues(apis, api=>api.callsReducer.bind(api)))

export default (state={}, action) => {
  //console.warn("vocabReducer does nothing",{state,action})
  return state
}

const newLookupParams = params => {
}
export const mapDispatchToProps = 
  dispatch => {
    let actionsByApi = _.mapValues(
      apis, 
      api=>{
        return bindActionCreators(api.actionCreators, dispatch)
      })
    return {actions: actionsByApi}
  }

const conceptsFromCodeLookupEpic = (action$, store) => (
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
      if (go && query.vocabulary_id && query.concept_code_search_pattern) {
        //return Rx.Observable.of(codesToCidsApi.actionCreators.setup())
      }
      return Rx.Observable.empty()
    })
)
const loadVocabularies = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init
    .filter(() => _.isEmpty(store.getState().vocabularies))
    .take(1)
    .mergeMap(()=>{
      //console.log('launching setup',action)
      debugger
      let setupAction = vocabulariesApi.actionCreators.setup()
      let fakeState = vocabulariesApi.callsReducer({},setupAction)
      let fakeCall = fakeState.primary
      //let loadAction = vocabulariesApi.actionCreators.load({action:fakeCall})
      return Rx.Observable.of(fakeCall)
    })
)
/*
    .mergeMap(action=>{
      let call = store.getState().calls.vocabulariesApi.primary
      console.log('got action, return call', action, call)
      return call
    })
*/
export const epic = combineEpics(
  //testEpic,
  //testEpic2,
  loadVocabularies,
  conceptsFromCodeLookupEpic,
  combineEpics(...api.epics)
)
/*
const testEpic = (action$,store) => {
  return action$.mapTo(()=>Rx.Observable.of({type:'BLAH',payload:{foo:'bleep'}}))
}
let filt = action=>{
                let ret = action.type === '@@router/LOCATION_CHANGE'
                console.log('in filt',{action,ret})
                return ret
              }
let sub = action=>{
                console.log('in sub LOC',action)
                return action
              }
let sub2 = action=>{
                console.log('in sub everything',action)
                return action
              }
const testEpic2 = (action$,store) => {
  //action$.filter(filt).subscribe(sub2)
  let ret = action$.filter(filt)
                    .map(()=>{
                      return Rx.Observable.of({type:LOAD_VOCABS, payload:{hatethis:true}})
                    })
  ret.subscribe(sub)
  return ret
}
*/
/*
export const epics = [
  testEpic,
  testEpic2,
  //conceptsFromCodeLookupEpic,
  loadVocabularies,
  ...api.epics,
]
*/
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
