/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as api from 'src/api'
import * as cids from 'src/ducks/cids'
import * as util from 'src/utils';
import * as config from 'src/config'

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
      return (_.pick(state, payload.map(c=>c.concept_id))) // only keep the focal concepts, if there are any
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
    cantFetch: [],
    got: [],
    focal: [],
    //stale: [],
    requests: [],
    staleRequests: [],
  })
const requestsReducer = (state=_.cloneDeep(emptyRequestStore()), action) => {
  let {status, want, fetching, got, focal, requests, staleRequests, cantFetch} = state
  let {type, payload, meta, error} = action
  let new_cids
  checkCorrupted({status, want, fetching, cantFetch, got, focal, requests, staleRequests, action, state})
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
      // or ConceptSetViewer, now
      if (_.some(_.get(state,'requests'),
                 r=>_.get(r,'meta.requestId') === _.get(action,'meta.requestId'))) {
        return state
      }
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
      requests = requests.map(r => {
        if (_.includes(meta.requestIds, r.meta.requestId)) {
          fetching = _.difference(fetching, got)
          let couldntFetch = _.intersection(fetching, r.payload)
          if (couldntFetch.length) {
            fetching = _.difference(fetching, couldntFetch)
            cantFetch = _.union(cantFetch, couldntFetch)
          }
          return {...r, type:conceptActions.IDLE, meta: {...r.meta,status:'done'}}
        }
      })
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
  if (want.length === 0) {
    requests = requests.map(r => {
      if (r.type === conceptActions.WANT_CONCEPTS) {
        return {...r, type:conceptActions.FETCH_CONCEPTS}
      }
      if (r.type === conceptActions.FETCH_CONCEPTS) {
        return r
      }
      if (r.type === conceptActions.IDLE) {
        return r
      }
      debugger
    })
  }
  if (fetching.length === 0) {
    requests = requests.map(r => {
      if (r.type === conceptActions.FETCH_CONCEPTS) {
        return {...r, type:conceptActions.IDLE}
      }
      if (r.type === conceptActions.WANT_CONCEPTS) {
        return r
      }
      if (r.type === conceptActions.IDLE) {
        return r
      }
      debugger
    })
  }
  checkCorrupted({status, want, fetching, cantFetch, got, focal, requests, staleRequests, action, state})
  if (status === conceptActions.PAUSE) {
    //status = status
  } else if (status === conceptActions.FULL) {
    //status = status
  } else if (!fetching.length && !want.length) {
    status = conceptActions.IDLE
  } else {
    status = conceptActions.BUSY
  }
  let newState = {status, want, fetching, cantFetch, got, focal, staleRequests, requests}
  return _.isEqual(state, newState) ? state : newState
}
const checkCorrupted = props => {
  let {status, want, fetching, cantFetch, got, focal, requests, staleRequests, action, state} = props
  if (  _.intersection(got,want).length         || // shouldn't want gotten concepts
        _.intersection(got,fetching).length     || // shouldn't fetch gotten concepts
        _.intersection(want,fetching).length    || // shouldn't leave fetching in want list
        /*
        (want.length && !focal.length &&           // shouldn't want (only related are in want list)
          status !== conceptActions.FULL)       || //    before focal are gotten
        */
        (state.status === conceptActions.FULL &&   // shouldn't stop being full
         status !== conceptActions.FULL)        || //    (at least for now)

        _.chain(requests)                          // all requested cids should
          .map(d=>d.cids)                          //     appear somewhere (got,fetch,want)
          .flatten()
          .uniq()
          .difference(_.union(got,fetching,cantFetch,want))
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
const newConcepts = (payload=[],meta, loadedAlready={}) => {
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
  return {type: conceptActions.NEW_CONCEPTS, payload: (concepts), meta}
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
      let not_fetching = _.get(store.getState(), 'concepts.requests.want') || []
      if (not_fetching.length) {
        debugger
      }

      if (concept_ids.length) {
        let requestIds = store.getState().concepts.requests.requests.map(d=>d.meta.requestId)
        meta = {...meta, requestIds}
        let params = {concept_ids}
        return Rx.Observable.of(api.actionGenerators.apiCall({apiPathname,params,meta}))
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
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter((action) => (action.meta||{}).apiPathname === apiPathname)
    .delay(200)
    .map(action=>{
      let {type, payload, meta} = action
      return newConcepts(payload, meta, store.getState().concepts.loaded)
    })
)
epics.push(loadConcepts)



const wantConceptsEpic = (action$, store) => (
  action$
    .ofType(conceptActions.WANT_CONCEPTS)
    .filter(action=>{
      let requestState = _.get(store.getState(),'concepts.requests')
      return (!_.some(requestState.requests,
                     r=>_.get(r,'meta.requestId') === _.get(action,'meta.requestId'))
              || _.get(requestState, 'want.length'))
    })
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
export const getRequest = createSelector( requests, reqs=> id=>_.find(reqs.requests,req=>req.meta.requestId == id))

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

export const flatUniq = (arr, accessor=d=>d) => {
  return _.uniq(_.flatten(arr.map(accessor)))
}
export const map2cids = concepts => flatUniq(concepts, c=>c.concept_id)
export const sgCidCnt = sgVal => map2cids(sgVal.records).length

//export const byCdm = (concepts, valFunc) _.supergroup(relSg.records, d=>d.cnts.length ? 'CDM Recs' : 'Not in CDM', {dimName: 'inCdm'})

export const map2cnts = concepts => _.flatten(concepts.map(c=>c.cnts))
export const sgCdmCnt = sgVal => map2cnts(sgVal.records)

export const colCnts = rcs => {
  // converts a list of rcs's as processed by rcsFromConcepts
  // into a list of { col, tbl, cnt }
  let byTblCol = _.supergroup(rcs,['tbl','col'])
  return (byTblCol.leafNodes()
            .map(
              col => {
                col.tbl = col.parent.toString()
                col.col = col.toString()
                col.cnt = col.aggregate(_.sum,'cnt')
                return col
              }
            )
         )
}
// belongs in supergroup when i have time:
export const explodeArrayFld = (rec,fname,pname='p') => 
  rec[fname].map(subrec=>({
        ..._.mapKeys(rec, (v,k) => `${pname}_${k}`),
        /*
        ...{ // include rec props mingled with subrecs, but if subrec has same prop names, rec's will get clobbered
          ...rec, [fname]:'exploded!' // don't include fname, the other subrecs don't belong with this one
        },
        */
        ...(_.isObject(subrec) ? subrec : {[fname]:subrec}),
        //explodedFrom:rec
  }))
// rename below, sounds like the fields is plural, not the recs
export const explodeArrayFlds = (recs,fname,pname) => _.flatten(recs.map(rec=>explodeArrayFld(rec,fname,pname)))
export const cdmCnts = cval => colCnts(explodeArrayFlds(cval.records,'cnts'))

export const byTbl = (concepts) => {
  let byTbl = () => _.supergroup(
                        concepts,
                        c=>c.cnts.map(r=>r.tbl),
                        {multiValuedGroup:true,dimName:'tbl'}
                      )
}

export const relgrpsFilter = relgrps => {
  let okVocs = config.getSetting('filters.include.vocabularies')
  return relgrps.filter(grp => _.includes(okVocs, grp.vocabulary_id))
}
export const addRels = sg => {


  // FIX!!!! should be pure, but can't get pure working right now
  let sgWithRels = sg.addLevel(sgParams.rels.dim, sgParams.rels.opts)
  //let sgWithRels = sg.addLevelPure(sgParams.rels.dim, sgParams.rels.opts)
  sgWithRels.leafNodes().forEach(relSg => {
    let [r,rr] = relSg.split(/ --> /)
    relSg.relgrps = relgrpsFilter(_.uniq(_.flatten(relSg.records.map(r=>r.relgrps))))
                      .filter(r=>reldim(r)==relSg)
    relSg.relcids = _.uniq(_.flatten(relSg.relgrps.map(r=>r.relcids)))

    relSg.reldim = relSg.toString()
    relSg.rreldim = `${rr} --> ${r}`
  })
  return sgWithRels
}
export const reldim = relgrp => `${relgrp.relationship} --> ${relgrp.reverse_relationship}`
export const rreldim = relgrp => `${relgrp.reverse_relationship} --> ${relgrp.relationship}`

export const byRelName = cval => {
  const dim = c=>c.relgrps.map(reldim)
  const opts = {multiValuedGroup:true,dimName:'reldim'}
  let sg = _.supergroup(cval.records, dim, opts)
  sg.forEach(relSg => {
    let [r,rr] = relSg.split(/ --> /)
    relSg.relgrps = _.uniq(_.flatten(relSg.records.map(r=>r.relgrps)))
                    .filter(r=>reldim(r)==relSg)
    relSg.relcids = _.uniq(_.flatten(relSg.relgrps.map(r=>r.relcids)))
    relSg.reldim = relSg.toString()
    relSg.rreldim = `${rr} --> ${r}`
    //debugger // figure out round trip stuff
    /*
    if (cset.role('rel') && relSg==reldim(cset)) {
      relSg.showAsRoundTrip = true
    }
    if (cset.role('rel') && relSg==rreldim(cset)) {
      relSg.showAsRoundTrip = true
    }
    */
  })
  //console.log(sg.summary(), cncpt)
  //debugger
  return sg
}




/*
export const reduceGroups = (cval, flds=_.keys(sgParams), grps={}) => {
  let fldSgs = flds.map(fld=>{
    let sg = _.supergroup(cval.records, sgParams[fld].dim, sgParams[fld].opts)
    return {fld,sg,title:sg.toString()}
  })
  fldSgs = _.sortBy(fldSgs, d=>d.sg.length)
  let sg = fldSgs.shift()
  let outSg = sg.sg
  while(fldSgs.length) {
    let {fld,sg,title} = fldSgs.shift()
    let x = outSg.addLevelPure(sgParams[fld].dim, sgParams[fld].opts)
    if (sg.length > 1 && fldSgs.length) {
      debugger
      let something = outSg.leafNodes().map(leaf => {
        reduceGroups(leaf, fldSgs.map(fsg=>fsg.fld))
      })
      debugger
    }
    debugger
  }



  for(let i=1; i<fldSgs.length; i++) {
  }
  
  fldSgs = fldSgs.slice(1)
  flds = flds.slice(1)
  fldSgs.forEach(({fld,sg,title}) => {
    flds = flds.slice(1)
    outSg = outSg.addLevelPure(sgParams[fld].dim, sgParams[fld].opts)
    //outSg = outSg.addLevel(sgParams[fld].dim, sgParams[fld].opts)
    if (sg.length > 1 && flds.length) {
      debugger
      let something = outSg.leafNodes().map(
        leaf => reduceGroups(leaf, flds)
      )
      debugger
    }
    debugger
    //let sg = _.supergroup(cval.records, sgParams[fld].dim, sgParams[fld].opts)
  })
  return outSg
/*



  let nextTitle = `${cval.length} ${cval} (${singleVals.map(d=>d.title).join(', ')})`
  let nextCval = _.supergroup(cval.records, d=>nextTitle, {dimName:cval.toString()})[0]
  if (multiVals.length) {
    debugger
    let next = _.sortBy(multiVals, d=>d.sg.length)[0]
    nextCval.addLevel(sgParams[next.fld].dim, sgParams[next.fld].opts)
    let nextFlds = _.difference(flds, singleVals.map(d=>d.fld), [next.fld])
    let rcalls = nextCval.leafNodes().map(cv=>reduceGroups(cv, nextFlds))
    return rcalls
    debugger
  }
  // not sure if i should do flds in specific order
  let singleVals = []
  let multiVals = []
  let something = flds.map(fld=>{
    let sg = _.supergroup(cval.records, sgParams[fld].dim, sgParams[fld].opts)
    if (sg.length === 1) {
      singleVals.push({fld,sg,title:sg.toString()})
    } else if (sg.length > 1) {
      multiVals.push({fld,sg,title:sg.toString()})
    } else {
      debugger
      throw new Error("impossible")
    }
    return sg
  })
  let nextTitle = `${cval.length} ${cval} (${singleVals.map(d=>d.title).join(', ')})`
  let nextCval = _.supergroup(cval.records, d=>nextTitle, {dimName:cval.toString()})[0]
  if (multiVals.length) {
    debugger
    let next = _.sortBy(multiVals, d=>d.sg.length)[0]
    nextCval.addLevel(sgParams[next.fld].dim, sgParams[next.fld].opts)
    let nextFlds = _.difference(flds, singleVals.map(d=>d.fld), [next.fld])
    let rcalls = nextCval.leafNodes().map(cv=>reduceGroups(cv, nextFlds))
    return rcalls
    debugger
  }
  return nextCval
  * /
}
*/


const sgParams = {
  sc:     {dim: 'standard_concept'},
  dom:    {dim: 'domain_id'},
  voc:    {dim: 'vocabulary_id'},
  cls:    {dim: 'concept_class_id'},
  withCdm:{dim: c=>c.cnts.length ? 'w/CDM Recs' : 'Not in CDM',opts:{dimName: 'inCdm'}},
  rels:   {dim: c=>c.relgrps.map(reldim), opts: {multiValuedGroup:true,dimName:'reldim'}},
}
export const groups = (cval,fld) => _.supergroup(cval.records,sgParams[fld].dim,sgParams[fld].opts)
// these return simple value (not obj) for csets having only one
// member in a group... meaning that all their subsets will also have only that member
export const singleMemberGroupLabel = (cval,dimName) => { // dimName = sc, dom, voc, cls, wcdm
  let grps = groups(cval,dimName)
  if (grps.length === 1) {
    return grps[0].valueOf()
  }
}
export const subgrpCnts = (cval, flds=_.keys(sgParams),noSingles=true) => {
  let fldSgs = flds.map(fld=>{
    let sg = _.supergroup(cval.records, sgParams[fld].dim, sgParams[fld].opts)
    return {
              fld,sg,
              title: sg.length > 1 ? `${sg.length} ${fld}` : sg.toString(),
    }
  })
  if (noSingles) {
    fldSgs = fldSgs.filter(d=>d.sg.length > 1)
  }
  fldSgs = _.sortBy(fldSgs, d=>d.sg.length)
  return fldSgs
}
export const relgrps = 
  // flat list of all concept.relgrps records for concept list
  // optionally filtered by reldim
  (concepts,reldim) => 
    _.flatten(concepts.map(
      c=>c.relgrps
          .filter(grp=>reldim ? grp.reldim===reldim : true)
          .map(grp=>({...grp,concept_id:c.concept_id}))
))


//var cncpt = module.exports

