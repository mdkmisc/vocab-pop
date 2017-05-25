/* eslint-disable */

// probably not a duck...just selectors?

import _ from 'src/supergroup'; // in global space anyway...
import * as api from 'src/api'
import * as cids from 'src/ducks/cids'
import * as util from 'src/utils';
import React, { Component } from 'react'

/*
const Immutable = require("seamless-immutable")
window.Immutable = Immutable
*/
console.error("Immutable turned off!")
const Immutable=d=>d // i don't think this works for everything
import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { createSelector } from 'reselect'
import { combineEpics } from 'redux-observable'

const apiPathname = 'conceptInfo'
const MAX_CONCEPTS_TO_LOAD = 500

export const conceptActions = {
  // "@@redux-form/CHANGE"      // empty want,fetching,focal,loaded; NEW_CIDS coming
  // cids.cidsActions.NEW_CIDS  // from cids lookup form, these become focal concepts
  WANT_CONCEPTS: 'vocab-pop/concept/WANT_CONCEPTS',   // from Concept view
                                                      // these are cids related to focal
  FETCH_CONCEPTS: 'vocab-pop/concept/FETCH_CONCEPTS', // prepare fetching queue
                                                      // and call conceptInfo api
  NEW_CONCEPTS: 'vocab-pop/concept/NEW_CONCEPTS',     // received concept records
  FETCH_CONCEPTS_REJECTED: 'vocab-pop/concept/FETCH_CONCEPTS_REJECTED',
  //GOT_BASIC_INFO: 'vocab-pop/concept/GOT_BASIC_INFO',
  //REL_CONCEPTS_WANTED: 'vocab-pop/concept/REL_CONCEPTS_WANTED',
  //REL_CONCEPTS_FETCHED: 'vocab-pop/concept/REL_CONCEPTS_FETCHED',

  IDLE: 'vocab-pop/concept/IDLE',
  BUSY: 'vocab-pop/concept/BUSY',
  FULL: 'vocab-pop/concept/FULL',
  PAUSE: 'vocab-pop/concept/PAUSE',
  RESUME: 'vocab-pop/concept/RESUME',
}

/**** start reducers *********************************************************/

const loadedReducer = (state={}, action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case conceptActions.NEW_CONCEPTS:
      return ({ ...state, ...util.arr2map(payload, c=>c.concept_id)})
      //return Immutable({ ...state, ...util.arr2map(payload, c=>c.concept_id)})
    case cids.cidsActions.NEW_CIDS:
      return (_.pick(state, payload)) // only keep the focal concepts, if there are any
      //return Immutable(_.pick(state, payload)) // only keep the focal concepts, if there are any
  }
  return (state)
  //return Immutable(state)
}
const emptyRequestStore = () => (
  { // lists of cids
    status: conceptActions.IDLE,
    want: [],
    fetching: [],
    got: [],
    focal: [],
    //stale: [],
    requests: [],
    staleRequests: [],
  })
const requestsReducer = (state=_.cloneDeep(emptyRequestStore()), action) => {
  let {status, want, fetching, got, focal, requests, staleRequests} = state
  let {type, payload, meta, error} = action
  let new_cids
  checkCorrupted({status, want, fetching, got, focal, requests, staleRequests, action, state})
  switch (type) {
    case conceptActions.IDLE:
    case conceptActions.BUSY:
    case conceptActions.FULL:
    case conceptActions.PAUSE:
      status = type
      break
    case "@@redux-form/CHANGE":
      if (action.meta.form !== "concept_codes_form") {
        return state
      }
      // stop wanting, fetching (this doesn't stop it, but stops new fetches)
      // because we're about to get NEW_CIDS
      focal = []
      want = []
      fetching = []
      staleRequests = requests  // maybe should put with NEW_CIDS... not sure
      requests = []
      break
    case cids.cidsActions.NEW_CIDS: // new focal concepts
      new_cids = payload.map(c=>c.concept_id)
      got = _.intersection(got, new_cids)  // only keep focal, if there are any in store
      focal = new_cids
      fetching = [] // clear previous fetch/want (add focal to fetching below)
      want = []
      requests = [...requests, {...action, cids:new_cids, focal: true}]
      break
    case conceptActions.WANT_CONCEPTS: // only occurs for non-focal
      want = _.union(want, payload)    // this only adds cids to want list, nothing else
      requests = [...requests, {...action, cids:payload, }]
      break
    case conceptActions.RESUME:
      status = type
    case conceptActions.FETCH_CONCEPTS:   // just prepares fetching list, api call
      fetching = _.union(fetching, want)  // is launched in conceptsCall epic
      if (status === conceptActions.IDLE) // but not PAUSE or FULL
        status = conceptActions.BUSY
      break
    case conceptActions.NEW_CONCEPTS:
      new_cids = payload.map(c=>c.concept_id)
      got = _.union(got, new_cids)
      break
    default:
      return state
  }

  let focalMissing = _.difference(focal, got)
  if (fetching.length && focalMissing.length) {
    throw new Error("shouldn't happen")
  }
  fetching = _.union(fetching, focal)
  fetching = _.difference(fetching, got)
  if (got.length + fetching.length > MAX_CONCEPTS_TO_LOAD) {
    status = conceptActions.FULL
    let dontFetch = got.length + fetching.length - MAX_CONCEPTS_TO_LOAD
    let splitIdx = fetching.length - dontFetch
    want = _.union(want, fetching.slice(splitIdx))
    fetching = fetching.slice(0, splitIdx)
  } else if (status === conceptActions.PAUSE && !focalMissing.length) {
    // don't fetch if paused, except always fetch focal
    want = _.union(want, fetching)
    fetching = []
  }
  want = _.chain(want).difference(got)
                      .difference(fetching)
                      .value()
  checkCorrupted({status, want, fetching, got, focal, requests, staleRequests, action, state})
  if (status === conceptActions.PAUSE) {
    //status = status
  } else if (status === conceptActions.FULL) {
    //status = status
  } else if (!fetching.length && !want.length) {
    status = conceptActions.IDLE
  } else {
    status = conceptActions.BUSY
  }
  let newState = {status, want, fetching, got, focal, staleRequests, requests}
  return _.isEqual(state, newState) ? state : newState
}
const checkCorrupted = props => {
  let {status, want, fetching, got, focal, requests, staleRequests, action, state} = props
  if (  _.intersection(got,want).length         || // shouldn't want gotten concepts
        _.intersection(got,fetching).length     || // shouldn't fetch gotten concepts
        _.intersection(want,fetching).length    || // shouldn't leave fetching in want list
        (want.length && !focal.length &&           // shouldn't want (only related are in want list)
          status !== conceptActions.FULL)       || //    before focal are gotten
        (state.status === conceptActions.FULL &&   // shouldn't stop being full
         status !== conceptActions.FULL)        || //    (at least for now)

        _.chain(requests)                          // all requested cids should
          .map(d=>d.cids)                          //     appear somewhere (got,fetch,want)
          .flatten()
          .uniq()
          .difference(_.union(got,fetching,want))
          .value().length
  ){
    //debugger
    throw new Error("corrupted request state")
  }
}

export default combineReducers({
  loaded: loadedReducer,
  requests: requestsReducer,
})

/**** end reducers *********************************************************/

/**** start action creators *********************************************************/
export const colCnts = rcs => {
  // converts a list of rcs's as processed by rcsFromConcepts
  // into a list of { col, tbl, cnt }
  let byTblCol = _.supergroup(rcs,['tbl','col'])
  return (byTblCol.leafNodes()
            .map(
              col => {
                let cnt = {
                  tbl: col.parent.toString(),
                  col: col.toString(),
                  cnt: col.aggregate(_.sum,'cnt'),
                }
                return cnt
              }
            )
         )
}
export const rcsFromConcepts = concepts => {
  /* rcs look like this:  { col : "condition_source_concept_id",
                            coltype : "source",
                            crc : 0,
                            rc : 0,
                            src : 1,
                            tbl : "condition_occurrence"
                          }
      i.e., a tbl/col/coltyp and three counts
      but only only of the counts will have numbers
      so rcsFromConcepts adds, e.g., { cnt : 1, cntType : "src"}
      the cntType and count from whichever field has it

      rcsFromConcepts also flattens all the rcs's from all the concepts
      into a single list


      THIS NOW HAPPENS ON CONCEPT LOADING, SO rcs FROM HERE OUT
      REFERS TO THE OUTPUT
  */
  return (
    _.flatten(
      concepts.map(c=>c.rcs)
    )
    .filter(d=>d)
    .map(rcs=>{
      let {rc,src,crc,tbl,col,coltype} = rcs
      if (!!rc + !!src + !!crc > 1) {
        throw new Error("this should not happen")
      }
      if (rc) {
        return {tbl, col, coltype, cntType:'rc', cnt:rc}
      } else if (src) {
        return {tbl, col, coltype, cntType:'src', cnt:src}
      } else if (crc) {
        return {tbl, col, coltype, cntType:'crc', cnt:crc}
      }
    })
    .filter(r => r && r.cnt)
)}
const newConcepts = (payload=[],loadedAlready={}) => {  
  // does this need to be pure function(no side effects)? probably not
  // it's the only entry point for concept records
  let concepts = payload.map(c => {
    if (loadedAlready[c.concept_id]) {
      return
    }
    //c = _.cloneDeep(c)      // uncomment to make immutable-ish

    c.cnts = c.rcs.map(rcs=>{
      let {rc,src,crc,tbl,col,coltype} = rcs
      if (!!rc + !!src + !!crc > 1) {
        throw new Error("this should not happen")
      }
      if (rc) {
        return {tbl, col, coltype, cntType:'rc', cnt:rc}
      } else if (src) {
        return {tbl, col, coltype, cntType:'src', cnt:src}
      } else if (crc) {
        return {tbl, col, coltype, cntType:'crc', cnt:crc}
      }
    })
    .filter(r => r && r.cnt)

    let tbct = _.supergroup(c.cnts, ['tbl','col'])
    if (tbct.filter(tbl=>tbl.getChildren().length !== 1)) {
      c.PROBLEM = 'same concept appearing in more than one col of same table, check for double counting'
      console.error('possible double counting, last copy of code for handling source/target prob:',
                    'https://github.com/Sigfried/vocab-pop/blob/f264c39df76425bf88e8b4ce789c20ce1508b56f/src/ducks/concept.js#L259')
    }
    return c
  })
  return {type: conceptActions.NEW_CONCEPTS, payload: (concepts)}
  //return {type: conceptActions.NEW_CONCEPTS, payload: Immutable(concepts)}
}
export const wantConcepts = (concept_ids,meta) => ({
                                type: conceptActions.WANT_CONCEPTS,
                                payload:concept_ids,
                                meta: {apiPathname, ...meta},
                              })
export const fetchConcepts = () => ({ type: conceptActions.FETCH_CONCEPTS, })
export const pause = () => ({type: conceptActions.PAUSE})
export const idle = () => ({type: conceptActions.IDLE})
export const busy = () => ({type: conceptActions.BUSY})
export const full = () => ({type: conceptActions.FULL})
export const resume = () => ({type: conceptActions.RESUME})
/*
let junk = {}
payload.map(c => {
  if (_.has(junk, c.concept_id))
  junk[c.concept_id] = c
})
*/
/**** end action creators *********************************************************/



/**** start epics ******************************************/

let epics = []

/*
console.error("testing w/ some random hardcoded cids")
concept_ids = [
  38000177,38000180,44820518,44828623,44825091,44833646,44837172,44837170,
  2211763, 2211767, 2211757, 45889987, 2211759, 2211764, 2211761, 40756968, 2211749,
  2722250, 2211755, 2211762, 2211750, 2211768, 40757038, 2211752, 2211758, 2211746,
  2211748, 2211754, 2211751, 2211771, 2211770, 2211773, 2211753,
              ]
params = {concept_ids}
*/
const conceptsCall = (action$, store) => (
  action$.ofType(
            cids.cidsActions.NEW_CIDS,
            conceptActions.FETCH_CONCEPTS, 
            conceptActions.RESUME,
  )
    .debounceTime(200)
    .mergeMap(action=>{
      let {type, payload=[], meta, error} = action
      //let concept_ids = payload
      let concept_ids = _.get(store.getState(), 'concepts.requests.fetching') || []
      if (concept_ids.length) {
        let params = {concept_ids}
        return Rx.Observable.of(api.actionGenerators.apiCall({apiPathname,params}))
      }
      return Rx.Observable.empty()
    })
    .catch(err => {
      console.error('error in conceptsCall', err)
      return Rx.Observable.of({
        type: 'vocab-pop/concept/FAILURE',
        meta: {apiPathname},
        error: true
      })
    })
)
epics.push(conceptsCall)

const loadConcepts = (action$, store) => (
  action$.ofType(api.apiActions.API_CALL)
    .filter((action) => (action.payload||{}).apiPathname === apiPathname)
    .delay(200)
    .mergeMap((action)=>{
      let {type, payload, meta, error} = action
      let {apiPathname, params, url} = payload
      return api.apiCall({apiPathname, params, url, }, store)
    })
    .catch(err => {
      console.error('error in loadConcepts', err)
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
      return newConcepts(payload, store.getState().concepts.loaded)
    })
)
epics.push(loadConcepts)



const wantConceptsEpic = (action$, store) => (
  action$
    .ofType(conceptActions.WANT_CONCEPTS)
    .mergeMap(action=>{
      return Rx.Observable.of(fetchConcepts())
    })
    .catch(err => {
      console.log('error in wantConceptsEpic', err)
      return Rx.Observable.of({
        ...action,
        type: 'SOME PROBLEM!!!',
        payload: err.xhr.response,
        error: true
      })
    })
    .debounceTime(200)
)
epics.push(wantConceptsEpic)
export {epics}
//const foo = 'bar'
//export {foo}

/**** end epics ******************************************/


/**** start selectors *****************************************************************/

export const conceptStub = (id,status) => ({
  // comes in handy for debugging once in a while, otherwise not used
  concept_id: id,
  status,
  concept_code: status,
  concept_name: status,
  domain_id: status,
  standard_concept: status,
  vocabulary_id: status,
  concept_class_id: status,
  rcs: [],
  rels: []
})
const expectedConceptFields = [
  'concept_id',
  'concept_code',
  'concept_name',
  'domain_id',
  'standard_concept',
  'vocabulary_id',
  'concept_class_id',
  'rcs',
  'rels',
]
export const isConcept = c => _.intersection(_.keys(c), expectedConceptFields).length
                          === expectedConceptFields.length
export const isConceptList = clist => Array.isArray(clist) && _.every(clist, isConcept)
export const isConceptMap = cmap => cmap && _.every(_.values(cmap), isConcept)

export const verifyConceptList = clist => clist && isConceptList(clist) && clist
export const verifyConceptMap = cmap => cmap && isConceptMap(cmap) && cmap

export const conceptListFromMap = cmap => cmap && verifyConceptList(_.values(cmap))
export const conceptMapFromList = clist => clist && util.arr2map(verifyConceptList(clist), c=>c.concept_id)

export const conceptListFromMapOrList = mol => verifyConceptList(mol) || conceptListFromMap(mol)
export const conceptMapFromMapOrList = mol => verifyConceptMap(mol) || conceptMapFromList(mol)

export const concepts = state => (
//export const concepts = state => Immutable()
  conceptListFromMapOrList(state) ||
  conceptListFromMapOrList(_.get(state,'concepts.loaded')) || [])

export const conceptMap = state =>
        conceptMapFromMapOrList(state) ||
        conceptMapFromMapOrList(_.get(state,'concepts.loaded')) || {}

export const conceptsFromCids = createSelector(
  conceptMap,
  cmap => (cids, errorOnMissing=true) => {
    let concepts = _.values(_.pick(cmap, cids))
    /*
    if (errorOnMissing && concepts.length && concepts.length !== cids.length) {
      throw new Error("decide what to do in this case")
    }
    */
    return concepts
  })

export const requests = state => state.concepts.requests || emptyRequestStore()
export const want = createSelector(requests, r => r.want)
export const fetching = createSelector(requests, r => r.fetching)
export const focal = createSelector(requests, r => r.focal)
export const got = createSelector(requests, r => r.got)
export const focalConcepts = createSelector( conceptsFromCids, focal, (cfc,f) => cfc(f))

export const conceptStatusReport = createSelector(
  concepts,
  requests,
  focalConcepts,
  (concepts, requests, focalConcepts) => {
    return csReport(concepts, requests, focalConcepts)
  }
)
export const csReport = (concepts, requests, focalConcepts) => {
    let lines = [
      `loaded: ${concepts.length}`,
      ..._.map(requests, (r,k)=>`${k}: ${Array.isArray(r) ? r.length : r}`),
      `missing focal: ${_.difference(requests.focal, concepts.map(c=>c.concept_id)).length}`,
      `requested cids: ${_.chain(requests.requests).map(d=>d.cids).flatten().value().length}`,
      `uniq requested cids: ${_.chain(requests.requests).map(d=>d.cids).flatten().uniq().value().length}`,
    ]
    return lines
}

export const timeFunc = f => {
  let start = performance.now()
  let ret = f()
  let end = performance.now()
  console.log(end - start)
  return ret
}

//export const sc = concept => concept.standard_concept

export const conceptTableAbbr = tbl => (
  ({
    //attribute_definition,
    //care_site,
    //cohort_attribute,
    //cohort_definition,
    condition_era: 'Dx',
    condition_occurrence: 'Dx',
    //death,
    //device_cost,
    //device_exposure,
    //domain,
    //dose_era,
    //drug_cost,
    drug_era: 'Rx',
    drug_exposure: 'Rx',
    //drug_strength,
    measurement: 'Sx',
    //note,
    observation: 'Sx',
    //observation_period,
    //person,
    //procedure_cost,
    procedure_occurrence: 'Tx',
    //provider,
    //relationship,
    //specimen,
    //visit_cost,
    visit_occurrence: 'V',
    //vocabulary
  })[tbl] || '?'
)


export const scName = 
  sc => ({S:'Standard',C:'Classification',X:'Non-standard'})[sc]

export const scLongName = 
  (sc,cnt) => plural(`${scName(sc)} Concept`, cnt)

export const plural = (str, cnt) => {
  return cnt === 1 ? str : `${str}s`
}
const groupings = {
  sc: 'standard_concept',
  dom: 'domain_id',
  voc: 'vocabulary_id',
  cls: 'concept_class_id',
}

export const flatUniq = (arr, accessor=d=>d) => {
  return _.uniq(_.flatten(arr.map(accessor)))
}
export const map2cids = concepts => flatUniq(concepts, c=>c.concept_id)
export const sgCidCnt = sgVal => map2cids(sgVal.records).length

export class ConceptSet {
  /*  for use in Concept component for passing around concepts and
   *  meta data. not for use in store or selectors!
   */
  constructor(props, csetSelectors, wantConcepts) {  // still, try to make this never mutate
    if (props.role === 'rel') {
      //debugger
      //console.log(new.target.name)
    }
    this._props = (props)
    //this._props = Immutable(props)
    this.csetSelectors = csetSelectors
    this.conceptState = csetSelectors.conceptState
    //this.relmetaState = csetSelectors.relmetaState
    this.wantConcepts = wantConcepts

    /* expecting: props: {cids, desc
     *
     * csetSelectors with conceptState
     *  for subsets: parent, cids, nature of subset (probably a group?), the group prop
     *  for rels (which are not subsets -- but the only kind of descendants that aren't):
     *    parent (relFrom), relName, cids, any known props of parent
    * title, fancyTitle, ttText, ttFancy, } = props */
    if (props.concepts || !props.cids || !this.conceptState 
          || !this.csetSelectors.relmetaState || !wantConcepts) {
      throw new Error("just give me cids and current conceptState and live wantConcepts")
    }
    if (!props.role) {
      throw new Error("need a role")
    }
  }
  props = () => this._props
  prop = prop => this.props()[prop]
  hasProp = prop => _.has(this.props(), prop)
  // maybe fancier?: // prop = prop => _.get(this.props(), prop)
  parent = () => this.prop('parent')


  setProps = newProps => {
    console.warn("this returns a new ConceptSet, doesn't change existing one, which is immutable")
    return new ConceptSet({
                ...this.props(), 
                ...newProps,
              }, this.csetSelectors, this.wantConcepts)
  }
  serialize= () => {
    return JSON.stringify(this.props())
  }

  cids = () => this.prop('cids')
  concepts = (cids=this.cids()) => concepts(this.conceptState.loaded).filter(c=>_.includes(cids,c.concept_id))
  concept_ids = (cids) => this.concepts(cids).map(d=>d.concept_id)
  cidCnt = () => this.cids().length
  conCnt = () => this.concepts().length
  loaded = () => this.cidCnt() === this.conCnt()
  loading = () => {throw new Error("not implemented")}
  status = () => {
    let {status:reqStatus, want, fetching, got, focal, requests, staleRequests} = this.conceptState.requests
    let notLoaded = _.difference(this.cids(), this.concept_ids())
    let status = {
      loaded: this.conCnt(),
      notLoaded: notLoaded.length,
      loading: _.intersection(notLoaded, fetching).length,
      requested: _.intersection(_.flatten(requests.map(r=>r.cids)),this.cids()).length,
      cantLoad: 0,
      status: 'not determined',
      msg: '',
    }
    if (want.length && status === conceptActions.FULL) {
      status.cantLoad = want.length // not sure about this
    }
    if (this.loaded()) {
      // totally loaded
      status.status = 'loaded'
      status.msg = `${status.loaded} loaded`
    } else {
      if (status.loading) {
        status.status = 'loading'
        if (status.loading === status.notLoaded) {
          status.msg = `loading ${status.loading}`
        } else {
          status.msg = `loaded ${status.loaded} of ${this.cidCnt()}`
        }
      } else {
        // not fully loaded, not loading, why?
        if (status.requested) {
          if (status.requested > status.loaded) {
            // requested some that aren't loaded or loading...presumably store is full
            if (status.cantLoad) {
              if (status.requested - status.loaded === status.cantLoad) {
                status.status = "can't load"
                status.msg = `can't load ${status.cantLoad} of ${this.cidCnt()}`
              } else {
                status.status = "weird"
                debugger
              }
            }
          } else {
            // requested cids are loaded
            // presumably some cids in this cset loaded by another cset's request
            status.status = 'not requested'
            status.msg = `loaded ${status.loaded} of ${this.cidCnt()}`
          }
        } else {
          // none requested
          status.status = 'not requested'
          if (status.loaded) {
            status.msg = `loaded ${status.loaded} of ${this.cidCnt()}`
          } else {
            status.msg = `${this.cidCnt()} concepts`
          }
        }
      }
    }
    if (status.msg === 'not sure') {
      debugger
    }
    return status
  }

  groups = fld => _.supergroup(this.concepts(), groupings[fld])
  /*
  scs = () => this.groups('sc')
  doms = createSelector(this.groups, groups => groups('dom'))
  vocs = createSelector(this.groups, groups => groups('voc'))
  clss = createSelector(this.groups, groups => groups('cls'))
  wcdms = createSelector(
    this.concepts, 
    concepts => _.supergroup(c=>!!(c.cnts && c.cnts.length),{dimName:'wcdm'})
  )
  */

  // these return simple value (not obj) for csets having only one
  // member in a group... meaning that all their subsets will also have only that member
  singleMemberGroupLabel = dimName => { // dimName = sc, dom, voc, cls, wcdm
    let grps = this.groups(dimName)
    if (grps.length === 1) {
      return grps[0].valueOf()
    }
  }
  sc = () => this.singleMemberGroupLabel('sc')
  dom = () => this.singleMemberGroupLabel('dom')
  voc = () => this.singleMemberGroupLabel('voc')
  cls = () => this.singleMemberGroupLabel('cls')
  wcdm = () => this.singleMemberGroupLabel('wcdm')

  scName = () => scName(this.sc())
  scLongName = () => scLongName(this.sc())

  cdmCnts = () => colCnts(_.flatten(this.concepts().map(c=>c.cnts)))

  scCsets = () => {
    return this.groups('sc').map(
            sc=>this.subset({
              cids:sc.records.map(d=>d.concept_id),
              sc:sc.toString(),
              subtype: 'sc',
            }))
  }

  subset = (props, forceNew=false) => {
    // expects props with cids, subtype (sc,dom,voc,cls,wcdm)
    if (!props.cids || !props.cids.length) {
      throw new Error("not sure what to do")
    }
    if (!props.subtype) {
      throw new Error("need a subtype")
    }
    if (!forceNew && 
        (props.cids.length === 1 || props.cids.length === this.cids().length)) {
      console.error('warning: not making subset! will this work?')
      //debugger
      return this
    }
    if (_.difference(props.cids, this.cids()).length) {
      throw new Error("can only include subset of cids in concept set")
    }
    if (props.cids.length !== this.concepts(props.cids).length) {
      throw new Error("can only subset loaded concepts")
    }
    return new ConceptSet({
                ...props, 
                parent: this, 
                subtype, 
                role: 'sub',
              }, this.csetSelectors, this.wantConcepts)
  }
  depth = () => this.parent ? this.parent.depth() + 1 : 0
  maxDepth = () => this.prop('maxDepth')

  shortDesc = () => {
    //let {status, msg} = this.status()
    return (
      (this.hasProp('shortDesc') && this.prop('shortDesc')) ||
      (this.hasProp('desc') && this.prop('desc')) ||
      (this.role('sub') && `shortDesc for ${this.prop('subtype')}`) ||
      `I'm a ${this.role()}, what kind of shortDesc do you want?`
    )
  }
  longDesc = () => {
    //let {status, msg} = this.status()
    return (
      (this.hasProp('longDesc') && this.prop('longDesc')) ||
      (this.hasProp('desc') && this.prop('desc')) ||
      (this.role('sub') && `longDesc for ${this.prop('subtype')}`) ||
      `I'm a ${this.role()}, what kind of longDesc do you want?`
    )
  }
  fancyDesc = () => {
    return (
      (this.hasProp('fancyDesc') && this.prop('fancyDesc')) ||
      (this.hasProp('longDesc') && this.prop('longDesc')) ||
      (this.hasProp('desc') && this.prop('desc')) ||
      (this.role('sub') && `fancyDesc for ${this.prop('subtype')}`) ||
      `I'm a ${this.role()}, what kind of fancyDesc do you want?`
    )
  }

  byRelName = () => {

    let byRelName = _.supergroup(
                        this.concepts(),
                        c=>c.relgrps.map(r=>r.relationship),
                        {multiValuedGroup:true,dimName:'relationship'}
                      )
    byRelName.forEach(relSg => {

      relSg.relgrps = _.flatten(
        relSg.records
             .map(c=>c.relgrps
                      .filter(grp=>grp.relationship===relSg.toString())
                      .map(grp=>({...grp,concept_id:c.concept_id}))
      ))

      relSg.relationship = relSg.toString()
      relSg.reverse_relationship = relSg.relgrps[0].reverse_relationship

      relSg.relcids = flatUniq(relSg.relgrps, d=>d.relcids)

      relSg.parentCset = this

      relSg[relSg.relationship] = sgCidCnt(relSg)
      relSg[relSg.reverse_relationship] = relSg.relcids.length

    })
    return byRelName
    //let map = byRelName.getLookupMap()
    //return _.mapKeys(map, (v,k) => v.relationship)
  }

  csetFromRelSg = (relSg) => {
    return new RelConceptSet({
                //...this.props(),
                cids: relSg.relcids,
                relSg,
                parent: this, 
                relationship: relSg.reverse_relationship,
                reverse_relationship: relSg.relationship,
                shortDesc: relSg.relationship,
                longDesc: `${this.shortDesc()} ${relSg.relationship}`,
                fancyDesc: 
                  <span>
                    <span style={{fontSize: '.8em',opacity:.7, fontStyle:'italic',
                                    marginRight: 8,}}>
                      {this.fancyDesc()} 
                    </span>
                    <span style={{marginLeft: 8,}}
                        aria-hidden="true" 
                        data-icon="&#xe90a;" 
                        className="icon-link"></span>
                    {relSg.relationship}
                  </span>,
                role: 'rel',
              }, this.csetSelectors, this.wantConcepts)
  }
  role = r => r ? (this.prop('role') === r) : this.prop('role')
  relationship = () => this.prop('relationship')
  reverse_relationship = () => this.prop('reverse_relationship')

  loadConcepts = () => {
    if (this.loaded()) {
      return
    }
    this.wantConcepts(this.cids())
  }
}



class RelConceptSet extends ConceptSet {
  constructor(...rest) {
    //debugger
    //console.log(new.target.name)
    super(...rest)
    this.relSg = this.prop('relSg')
  }
  reverseRelConceptSet = (relationship, relcids) => {
    return new RevRelConceptSet({
                //...this.props(),
                cids: relcids,
                parent: this, 
                relationship, 
                desc: `revrel of ${this.shortDesc()} ${relationship}`,
                longDesc: `${this.shortDesc()} ${relationship}`,
                fancyDesc: 
                  <span>
                    <span style={{fontSize: '.8em',opacity:.7, fontStyle:'italic',
                                    marginRight: 8,}}>
                      {this.fancyDesc()} 
                    </span>
                    <span style={{marginLeft: 8,}}
                        aria-hidden="true" 
                        data-icon="&#xe90a;" 
                        className="icon-link"></span>
                    {relationship}
                  </span>,
                role: 'rel',
              }, this.csetSelectors, this.wantConcepts)
  }
  /*
  fromDesc = () => {
    return `${this.relSg[this.relSg.relationship]} ${this.relSg.relationship}`
  }
  toDesc = () => {
    return `${this.relSg[this.relSg.reverse_relationship]} ${this.relSg.reverse_relationship}`
  }
  */
  shortDesc = () => {
    //let {status, msg} = this.status()
    return (
      (this.hasProp('shortDesc') && this.prop('shortDesc')) ||
      (this.hasProp('desc') && this.prop('desc')) ||
      `I'm a ${this.role()}, what kind of shortDesc do you want?`
    )
  }
  longDesc = () => {
    let relSg = this.relSg
    return [
      _.supergroup(relSg.relgrps, 'standard_concept').map(o=>`${sgCidCnt(o)} ${o}`),
      _.supergroup(relSg.relgrps, 'vocabulary_id').map(o=>`${sgCidCnt(o)} ${o}`),
      _.supergroup(relSg.relgrps, 'domain_id').map(o=>`${sgCidCnt(o)} ${o}`),
      _.supergroup(relSg.relgrps, 'concept_class_id').map(o=>`${sgCidCnt(o)} ${o}`),
    ].join('\n')
  }
  fancyDesc = () => {
    return (
      (this.hasProp('fancyDesc') && this.prop('fancyDesc')) ||
      (this.hasProp('longDesc') && this.prop('longDesc')) ||
      (this.hasProp('desc') && this.prop('desc')) ||
      `I'm a ${this.role()}, what kind of fancyDesc do you want?`
    )
  }
  reverseRelId = relId => this.csetSelectors.reverseRel(relId)
  relName = () => this.prop('relationship')
  revrel = false
}
class RevRelConceptSet extends RelConceptSet {
  constructor(...rest) {
  let {props, csetSelectors, wantConcepts} = rest
    super(...rest)
    this.loadConcepts(props)
    this.parent
  }
  revrel = true
  byRelName = () => []
}

import {GridList, GridTile} from 'material-ui/GridList'
export const ConceptStatusReport = ({lines=[], M}) => {
  M = M || muit()
  if (!lines.length)
    return <div>GOT NO STATUS!!</div>
  lines = lines.concat(_.map(viewCounts, (v,k)=>`${k}: ${v}`))
  let cols = 3
  let linesPerCol = Math.ceil(lines.length / cols)
  return (<div style={{
                  ...M('grid.parent'),
                  backgroundColor:'white',
                  justifyContent: 'auto',
                  padding: 10,
                }}>
            Concept fetch status
            <GridList 
              {...M('grid.styleProps')}
              style={{...M('grid.gridList.horizontal'),
                        padding:0, margin: 0,
                      }} cols={3}
            >
              {_.range(cols).map(col => {
                col = parseInt(col)
                return (<GridTile style={{
                                ...M('grid.tile.plain'),
                                padding:0, margin: 0,
                              }} key={col} >
                          <pre style={{border: 'none',}} >
                            {lines.slice(col * linesPerCol, (col+1) * linesPerCol).join('\n')}
                          </pre>
                        </GridTile>)})}
            </GridList>
          </div>
  )
}

