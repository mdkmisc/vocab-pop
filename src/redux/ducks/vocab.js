/* eslint-disable */
import { combineEpics } from 'redux-observable'
import { createSelector } from 'reselect'
//DEBUG:
window.createSelector = createSelector

import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import _ from '../../supergroup'; // in global space anyway...
var d3 = require('d3')
import * as api from '../api'
import myrouter from '../myrouter'

let vocabulariesApi = new api.Api({
  apiName: 'vocabulariesApi',
  apiPathname: 'vocabularies',
})
let codesToCidsApi = new api.Api({
  apiName: 'codesToCidsApi',
  apiPathname: 'codeSearchToCids',
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
    concept_ids: (apiName) => {
      return (state) => {
        let calls = _.get(state,['apis',apiName,'calls'])
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

const loadVocabularies = (action$, store) => (
  action$.ofType('@@router/LOCATION_CHANGE') // happens on init
    .filter(() => _.isEmpty(store.getState().vocabularies))
    .take(1)
    .mergeMap(()=>{
      let loadAction = vocabulariesApi.actionCreators.load()
      let fakeState = vocabulariesApi.callsReducer({},loadAction)
      let fakeCall = fakeState.primary
      return Rx.Observable.of(fakeCall)
    })
)
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
        let loadAction = codesToCidsApi.actionCreators.load({params})
        let fakeState = codesToCidsApi.callsReducer({},loadAction)
        let fakeCall = fakeState.primary
        return Rx.Observable.of(fakeCall)
      }
      return Rx.Observable.empty()
    })
)
const loadConcepts = (action$, store) => (
  action$
    .filter(action=>api.newDataActionFilter(action,'codesToCidsApi','primary'))
    .switchMap(action=>{
      let concept_ids = api.apiSelectorMakers('codesToCidsApi')
                          .results(store.getState())()
        //codesToCidsApi.selectors.results(store.getState())('primary')||[]
      if (concept_ids.length) {
        let params = {concept_ids:concept_ids.map(d=>d.concept_id)}
/*
*/
console.error("testing w/ some random hardcoded cids")
concept_ids = [
  38000177,38000180,44820518,44828623,44825091,44833646,44837172,44837170,
  2211763, 2211767, 2211757, 45889987, 2211759, 2211764, 2211761, 40756968, 2211749,
  2722250, 2211755, 2211762, 2211750, 2211768, 40757038, 2211752, 2211758, 2211746,
  2211748, 2211754, 2211751, 2211771, 2211770, 2211773, 2211753,
              ]
params = {concept_ids}
        let loadAction = conceptInfoApi.actionCreators.load({params})
        let fakeState = conceptInfoApi.callsReducer({},loadAction)
        let fakeCall = fakeState.primary
        return Rx.Observable.of(fakeCall)
      }
      return Rx.Observable.empty()
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
  loadConceptIds,
  loadConcepts,
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
  //loadConceptIds,
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
