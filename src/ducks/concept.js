/* eslint-disable */

// probably not a duck...just selectors?

import _ from 'src/supergroup'; // in global space anyway...
import * as api from 'src/api'
import * as cids from 'src/ducks/cids'
import * as util from 'src/utils';

import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { createSelector } from 'reselect'
import { combineEpics } from 'redux-observable'

const apiPathname = 'conceptInfo'

export const conceptActions = {
  NEW_CONCEPTS: 'vocab-pop/concept/NEW_CONCEPTS',
  WANT_CONCEPTS: 'vocab-pop/concept/WANT_CONCEPTS',
  FETCH_CONCEPTS: 'vocab-pop/concept/FETCH_CONCEPTS',
  FETCH_FOCAL_CONCEPTS: 'vocab-pop/concept/FETCH_FOCAL_CONCEPTS',
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
      //if (!Array.isArray(payload)) { return state } // just assume, don't check
      return { ...state, ...util.arr2map(payload, c=>c.concept_id)}
  }
  return state
}
const requestStore = () => (
  { // lists of cids
    status: conceptActions.IDLE,
    want: [],
    fetching: [],
    got: [],
    focal: [],
    stale: [],
  })
const MAX_CONCEPTS_TO_LOAD = 500
const requestsReducer = (state=_.cloneDeep(requestStore()), action) => {
  let {status, want, fetching, got, focal, stale} = state
  let {type, payload, meta, error} = action
  /*
  if (_.isEmpty(payload) && type !== conceptActions.FETCH_CONCEPTS)
    return state
  */
  let newState
  let new_cids = payload
  switch (type) {
    case conceptActions.IDLE:
    case conceptActions.BUSY:
    case conceptActions.FULL:
    case conceptActions.PAUSE:
      newState = {...state, status:type}
      break
    case conceptActions.NEW_CONCEPTS:
      /*
      if (_.includes([conceptActions.FULL,conceptActions.PAUSE], status)) {
        // not working right
        console.log(`concept store ${status}, not accepting ${payload.length} concepts`)
        return state
      }
      */

      new_cids = payload.map(c=>c.concept_id)
      newState = {
        ...state,
        got: _.union(got, new_cids),
        want: _.chain(want)
                      .difference(new_cids)
                      .difference(got)
                      .difference(fetching)
                      .value(),
        fetching: _.chain(fetching)
                      .difference(new_cids)
                      .difference(got)
                      .value(),
      }
      break
    case conceptActions.WANT_CONCEPTS:
      newState = {
        ...state,
        want: _.chain(want)
                      .union(new_cids)
                      .difference(got)
                      .difference(fetching)
                      .value(),
      }
      break
    case conceptActions.FETCH_CONCEPTS:
      if (_.includes([conceptActions.FULL,conceptActions.PAUSE], status)) {
        // not working right
        console.log(`concept store ${status}, not fetching concepts`)
        return state
      }
    case conceptActions.RESUME:
      let toFetch = _.chain(fetching)
                      .union(want)
                      .difference(got)
                      .value()
      let delayedRequest = []
      status = toFetch.length ? conceptActions.BUSY : conceptActions.IDLE
      if (got.length + toFetch.length > MAX_CONCEPTS_TO_LOAD) {
        let moveBack = got.length + toFetch.length - MAX_CONCEPTS_TO_LOAD
        let split = toFetch.length - moveBack
        delayedRequest = toFetch.slice(split)
        toFetch = toFetch.slice(0, split)
        console.log(`concept store now ${status}, not fetching ${toFetch.length} concepts`)
        status = conceptActions.FULL
        // not working right
      }
      newState = {
        ...state,
        want: delayedRequest,
        fetching: toFetch,
        status,
      }
      break
    case "@@redux-form/CHANGE":
      if (action.meta.form === "concept_codes_form") {
        newState = {
          ...state,
          focal: [],
          stale: got,
          want: [],
          fetching: [],
        }
      } else {
        return state
      }
      break
    case conceptActions.FETCH_FOCAL_CONCEPTS:
      newState = {
        ...state,
        focal: new_cids,
        stale: got,
        want: [],
        fetching: _.difference(new_cids, got),
        status: conceptActions.BUSY,
      }
      break
    default:
      return state
  }
  if (  _.intersection(got,want).length ||
        _.intersection(got,fetching).length ||
        _.intersection(want,fetching).length ||
        _.intersection(newState.got,newState.want).length ||
        _.intersection(newState.got,newState.fetching).length ||
        _.intersection(newState.want,newState.fetching).length
  ){
    throw new Error("corrupted request state")
  }
  if (!fetching.length && !want.length) {
    newState.status = newState.status || conceptActions.IDLE
  } else {
    newState.status = newState.status || conceptActions.BUSY
  }
  return _.isEqual(state, newState) ? state : newState
}

export default combineReducers({
  loaded: loadedReducer,
  requests: requestsReducer,
})

/**** end reducers *********************************************************/

/**** start action creators *********************************************************/
const newConcepts = payload => ({type: conceptActions.NEW_CONCEPTS, payload})
export const wantConcepts = (concept_ids) => ({
                                type: conceptActions.WANT_CONCEPTS,
                                payload:concept_ids,
                                meta: {apiPathname},
                              })
export const fetchConcepts = () => ({ type: conceptActions.FETCH_CONCEPTS, })
export const fetchFocalConcepts = (concept_ids) => ({
                                  type: conceptActions.FETCH_FOCAL_CONCEPTS,
                                  payload:concept_ids,
                                })

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

const fetchFocalConceptsEpic = (action$, store) => (
  action$.ofType(cids.cidsActions.NEW_CIDS)
    .switchMap(action=>{
      let {type, payload=[], meta, error} = action
      payload = payload.map(d=>d.concept_id)
      return (payload.length 
                ? Rx.Observable.of(fetchFocalConcepts(payload)) 
                : Rx.Observable.empty())
    })
    .catch(err => {
      console.log('error in fetchFocalConceptsEpic', err)
      return Rx.Observable.of({
        type: conceptActions.FETCH_CONCEPTS_REJECTED,
        meta: {apiPathname},
        error: true
      })
    })
)
epics.push(fetchFocalConceptsEpic)


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
            conceptActions.FETCH_CONCEPTS, 
            conceptActions.FETCH_FOCAL_CONCEPTS,
            conceptActions.RESUME,
  )
    //.debounce(200)
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
      return newConcepts(payload)
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

const conceptStub = (id,status) => ({
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

export const concepts = state =>
        conceptListFromMapOrList(state) ||
        conceptListFromMapOrList(_.get(state,'concepts.loaded')) || []

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

export const requests = state => state.concepts.requests || requestStore()
export const want = createSelector(requests, r => r.want)
export const fetching = createSelector(requests, r => r.fetching)
export const focal = createSelector(requests, r => r.focal)
export const got = createSelector(requests, r => r.got)
export const stale = createSelector(requests, r => r.stale)

export const focalConcepts = createSelector( conceptsFromCids, focal, (cfc,f) => cfc(f))

export const conceptsFromCidsWStubs = createSelector(
  conceptMap, want, fetching,
  (cmap, want, fetching) =>
    (cids=[]) =>
      cids.map(cid => cmap[cid] ||
                      (_.includes(want, cid) && conceptStub(cid, 'want')) ||
                      (_.includes(fetching, cid) && conceptStub(cid, 'fetching')) ||
                      conceptStub(cid, 'mystery')
              )
)

export const rels2map = rels => {
  return rels.reduce((acc,{relationship,relcids}) => (
                        { ...acc,
                          [relationship]: _.uniq((acc[relationship]||[]).concat(relcids))
                        }),
                        {})
}
export const timeFunc = f => {
  let start = performance.now()
  let ret = f()
  let end = performance.now()
  console.log(end - start)
  return ret
}
export const concepts2relsMap = clist => {
  //let flat = timeFunc(()=>_.flatten(clist.map(c=>c.rels)))
  //let map = timeFunc(()=>rels2map(flat))
  //let map2 = flat.reduce(util.gulp(rels2map),[])
  let flat = _.flatten(clist.map(c=>c.rels))
  let map = rels2map(flat)
  return map
}

export const sc = concept => concept.standard_concept
const scClass = createSelector(sc, sc=>`sc-${sc}`)
//export const scClass = concept => `sc-${sc(concept)}`
//
export const scName = (concept) => (
  ({S:'Standard',C:'Classification',X:'Non-standard'}
   )[sc(concept)]
)
export const scLongName = (concept,cnt) => plural(`${scName(concept)} Concept`, cnt)
export const plural = (str, cnt) => {
  return cnt === 1 ? str : `${str}s`
}

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


export const rcsFromConcepts = concepts => {
  return (
  _.flatten(
    concepts.map(c=>c.rcs)
  )
  .filter(d=>d)
  .map(rcs=>{let {rc,src,crc} = rcs
      if (!!rc + !!src + !!crc > 1) {
        throw new Error("this should not happen")
      }
      if (rc) {
        rcs.cntType = 'rc'
        rcs.cnt = rc
      } else if (src) {
        rcs.cntType = 'src'
        rcs.cnt = src
      } else if (crc) {
        rcs.cntType = 'crc'
        rcs.cnt = crc
      }
      return rcs
  })
  .filter(rcs=>rcs.cnt)
)}
export const repairRcs = concepts => {
  return concepts.map(
    concept => {
      if (_.isEmpty(concept.rcs)) {
        return concept
      }
      concept = _.cloneDeep(concept)
      let rcss = rcsFromConcepts([concept])
      let tbct = _.supergroup(rcss, ['tbl','coltype'])
      let newRcs = []
      tbct.forEach(
        tbl => {
          let cts = tbl.getChildren()
          if (cts.length > 2) {
            debugger
            throw new Error("pretty weird")
          }
          if (cts.length === 2) {
            if (cts.lookup('target') &&
                cts.lookup('source'))
            {
              if (cts.records.length !== 2 ||
                  cts.records[0].cntType !== 'rc' ||
                  cts.records[1].cntType !== 'rc' ||
                  cts.records[0].cnt !== cts.records[1].cnt
                 ) {
                debugger
                throw new Error("pretty weird")
              }
              newRcs.push(cts.records.find(d=>d.coltype==='target'))
            }
            concept._origRcs = concept.rcs
            concept.rcs = newRcs
          } else {
            concept._origRcs = concept.rcs
            concept.rcs = rcss
          }
        }
      )
      return concept
    })
}

// can use plain selectors with supergroup, but not
// createSelector because supergroup not immutable


export const conceptsBySc = (concepts=[]) => _.supergroup(concepts, 'standard_concept')
export const conceptsByScTbl = concepts =>
  conceptsBySc(concepts).addLevel(c=>c.rcs.map(r=>r.tbl),
                          {multiValuedGroup:true,dimName:'tbl'})
export const conceptsByScTblCol = concepts => {
  let bycol = conceptsByScTbl(concepts).addLevel(c=>c.rcs.map(r=>r.col),
                          {multiValuedGroup:true,dimName:'col'})
  bycol.leafNodes()
    .filter(l=>l.depth===3)
    .forEach(
      leaf => {
        leaf.col = leaf.toString()
        leaf.tbl = leaf.parent.toString()
        leaf.sc = leaf.parent.parent.toString()
        leaf.allRcs =  rcsFromConcepts(leaf.records)

        let cntTypes = _.uniq(leaf.allRcs.map(d=>d.cntType))
        // cntType is rc/src/crc, should always correspond to standard_concept:
        // S=rc, X=src, C=crc
        if (cntTypes.length > 1) {
          debugger
          throw new Error("shouldn't happen")
        }
        if (cntTypes.length === 0) {
          debugger
          throw new Error("not sure")
          return
        }
        leaf.cntType = cntTypes[0]
        leaf.cnt = _.sum(leaf.allRcs.map(d=>d.cnt))
            //leaf.cnt = `${cnt} records in ${leaf.tbl}.${leaf.col}`
      }
    )
  return bycol
}
export const colCnts = rcs => {
  let byTblCol = _.supergroup(rcs,['tbl','col'])
  return (byTblCol.leafNodes()
            .map(
              col => {
                let cnt = {
                  col: col.toString(),
                  tbl: col.parent.toString(),
                  cnt: col.aggregate(_.sum,'cnt'),
                }
                return cnt
              }
            )
         )
}
export const colCntsFromConcepts = createSelector(
  concepts,
  concepts => colCnts(rcsFromConcepts(concepts))
)




/**** end selectors *****************************************************************/






/**** Api thing -- get rid of eventually ******************************************/

/*
let conceptInfoApi = new api.Api({
  apiName: 'conceptInfoApi',
  apiPathname: 'conceptInfo',
  defaultResults: [],
  resultsReducer: true,
  //myACs: { newConcepts, },

  paramsValidation: ({concept_ids}) => {
    //console.log('validating', concept_ids)
    if (!Array.isArray(concept_ids)) {
      console.error('expected {concept_ids:[]}', params)
      return false
    }
    if (!_.every(concept_ids, _.isNumber)) {
      console.error('expected {concept_ids:[Number,...]}', params)
      return false
    }
    if (! concept_ids.length) {
      return false
    }
    return true
  },
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
    * /
  }
})

export const apis = {
  //conceptInfoApi,
}
*/
/**** Api thing -- get rid of eventually ******************************************/


// FROM ConceptInfo.js -- might want to keep a little bit of it
/*
import Rx from 'rxjs/Rx';
class ConceptAbstract {
  constructor({ inRelTo, depth, cb, title, infoBitCollection,
                relatedToFetch=[
                                  //'mapsto','mappedfrom', 'conceptAncestorGroups', 'conceptDescendantGroups'
                                ],
              } = {}) {
    this._inRelTo = inRelTo;
    this._depth = typeof depth === 'undefined'
                    ? (inRelTo ? inRelTo.depth() + 1 : 0)
                    : 0;
    this._relatedToFetch = relatedToFetch;
    this._cb = cb;
    this._title = title;
    this.bsubj = new Rx.BehaviorSubject(this); // caller will subscribe
    this.sendUpdate = this.sendUpdate.bind(this);
    this._bits = infoBitCollection || new InfoBitCollection({parent:this});
  }
  bits(context, name, filt) {
    return this._bits.select(context, name, filt);
  }
  get(field, dflt) { // this is getting too complicated
    if (typeof this[field] === 'function') return this[field]();
    if (_.has(this, field)) return this[field];
    if (_.has(this, ['_'+field])) return this['_'+field];
    if (dflt === 'fail') throw new Error(`can't find ${field}`);
    return dflt;
  }
  inRelTo() {
    return this._inRelTo;
  }
  subscribe(cb) {
    this.bsubj.subscribe(cb); // get rid of old ones!
  }
  done() {
    console.log("not saving streams for unsubscribing! is that a problem?");
    //this.stream.unsubscribe();
    //this.bsubj.unsubscribe();
  }
  sendUpdate(source) {
    //if (this.parentCi) this.parentCi.sendUpdate();
    if (this.cb)
      this.cb('fromChild');
    //else
    this.bsubj.next(this);
    //if (this._inRelTo) this._inRelTo.sendUpdate();
  }
  loading() {
    return this._status.match(/loading/);
  }
  loaded() {
    return !this._status.match(/loading/) && this._status !== 'failed';
  }
  failed() {
    return this._status === 'failed';
  }
  depth() {
    return this._depth;
  }
  inRelTo() {
    return this._inRelTo;
  }
  role() {
    return this._role;
  }
  isRole(role) {
    return this._role === role;
  }
}
export class RelatedConceptsAbstract {
  constructor(props) {
    let { inRelTo,
      } = props;
    this._inRelTo = inRelTo;
  }
}
export class ConceptSet extends ConceptAbstract {
  constructor(props) {
    super(props);
    let { role='main',       // main, ?
      } = props;
    this._items = [];
  }
  items() {
    return this._items;
  }
}
export class ConceptSetFromCode extends ConceptSet {
  constructor(props) {
    super(props);
    let concept_code = this.concept_code = props.concept_code;
    if (!concept_code.length) throw new Error("missing concept_code");
    this._status = 'loading';
    throw new Error("FIX")
    /*
    this.codeLookupStream = new AxxppState.ApiStream({
      apiCall:'concept_info_from_code', params:{concept_code,}});
    this.codeLookupStream.subscribe((results,stream)=>{
      if (!results.length) {
        this._status = 'failed';
      } else {
        this._items = results.map(
          rec => new ConceptInfo({  rec,
                                    depth: this.depth() + 1,
                                    //cb:this.sendUpdate,
                                    inRelTo: this,
                                    role: 'inConceptSet',
                                    relatedToFetch: this._relatedToFetch,
                                }));
        this.title = `Concept code ${concept_code} matches ${this._items.length} concepts`;
        this._status = 'complete'; // partially complete
        this.sendUpdate();
        //return conceptSet;  //   ??? maybe not a good idea, or doesn't do anything...confused
      }
    });
    * /
  }
}
export class ConceptSetFromText extends ConceptSet {
}
export class ConceptInfo extends ConceptAbstract {
  //based on data from http://localhost:3000/api/cdms/conceptInfo?cdmSchema=cdm2&concept_id=201820&resultsSchema=results2
  constructor(props) {
    super(props);
    let { concept_id,
          rec, // if creating from already (partially) fetched data
          role='main',  // main, mapsto, etc
      } = props;
    this._validConceptId = false;
    this._role = role;
    this._amMain = this.inRelTo ? false : true;
    this._fetchedRelated = false;
    this._relatedRecs = {};
    if (rec) {
      this._crec = rec;
      this._validConceptId = true; // assume rec/_crec is always a valid concept
      this.concept_id = rec.concept_id;
      this._status = 'loading';
    } else {
      this.concept_id = concept_id;
      this._status = 'preloading';
    }
    this.fetchData();
  }
  fetchData() {
    // at some point allow specifying what specifically needs fetching
    //  (beyond conceptRecord and related)

    //if (this._status !== 'preloading') return;
    this._status = 'loading';
    throw new Error("FIX")
    /*
    this.conceptStream = new AxxppState.ApiStream({ apiCall:'concept_info',
                                                  params:{concept_id:this.concept_id}});
    this.conceptStream.subscribe((results,stream)=>{ // stream usually === this.stream, but this.stream could change
      this._status = 'loading';
      if (_.isEmpty(results)) {
        this._status = 'failed';
      } else {
        this._crec = results;
        this._validConceptId = true;
      }
      this._status = 'loading related';
      this.fetchRelated();
      this.sendUpdate();
    });
    this.sendUpdate();
    * /
  }
  fetchRelated() {
    if (!this._relatedToFetch.length) {
      this._status = 'complete';
      this.sendUpdate();
      return;
    }
    if (this.depth > 8) console.error("too deep");
    if (!this._crec) debugger;
    throw new Error("FIX")
    /*
    this.relatedStream = new AxxppState.ApiStream({ apiCall: 'related_concept_plus', params:{concept_id:this.concept_id}});
    this.relatedStream.subscribe((results,stream)=>{ // stream usually === this.stream, but this.stream could change
      if (_.isEmpty(results)) {
        this._status = 'failed';
        //throw new Error("impossible!");
      } else {
        this._relatedConcepts = results;
        this._status = 'complete';
        this._fetchedRelated = true;
      }
      this.sendUpdate();
    });
    return this._status;
    * /
  }
  //processRelated() { }
  getRelatedRecs(rel, dflt) { // as ConceptInfo -- right?
    if (!this._fetchedRelated) return dflt;
    if (this._relatedRecs[rel]) return this._relatedRecs[rel];
    let recs;
    if (_.includes(['mapsto','mappedfrom'], rel)) {
      recs = this.get('relatedConcepts',[])
                 .filter(rec=>rec.relationship_id === this.fieldTitle(rel))
                 .filter(rec=>!this.inRelTo() || rec.concept_id !== this.inRelTo().get('concept_id'))
    } else if (rel === 'relatedConcepts') { // except maps
      recs = this.get('relatedConcepts',[])
                 .filter(
                   rec=>!_.some(['mapsto','mappedfrom'],
                                rel => rec.relationship_id === this.fieldTitle(rel)));
    } else {
      recs = this.get(rel); // conceptAncestors, conceptDescendants, relatedConcepts,
    }
    this._relatedRecs[rel] =
      recs.map(rec=>new ConceptInfo({rec, role: rel, inRelTo: this,
                                      depth: this.depth() + 1, }));
    return this._relatedRecs[rel];
  }
  get(field, dflt) { // this is getting too complicated
    if (_.has(this._crec, field)) return this._crec[field];
    if (typeof this[field] === 'function') return this[field]();
    if (this._ci && this._ci[field]) return this._ci[field];
    if (_.has(this, ['_'+field])) return this['_'+field];

    if (this.isRole('conceptAncestors') && !field.match(/^a_/))
      return this.get('a_'+field,dflt)
    if (this.isRole('conceptDescendants') && !field.match(/^d_/))
      return this.get('d_'+field,dflt);
    if (dflt === 'fail') throw new Error(`can't find ${field}`);
    return dflt;
  }
  sendUpdate(source) {
    this.assembleInfo();
    super.sendUpdate(this);
  }
  assembleInfo() {
    /*
    if (this.loading()) {
      return [
        {title:'Status', className:'ci-status', value: 'Loading'},
        {title:'Concept Id', value: ci.concept_id},
      ];
    }
    * /
    this._bitIdx = 0;
    if (this.failed()) {
      this._bits.add({ci:this, title:'Status', className:'ci-status',
                  value: `No concept id ${this.concept_id}`});
      return;
    }
    this._bits.add({
        context: 'main-desc',
        name: 'header',
        title: this.scTitle(),
        value: this.get('concept_name'),
        className: 'name',
        //handlers: { 'onClick': },
        //wholeRow: `${this.scTitle()} ${this.get('concept_name')}`,
        linkParams: this.isRole('main') ? {} : {concept_id: this.get('concept_id')},
        data: {concept_id: this.concept_id},
    });
    this._bits.add({context:'main-desc', name: 'vocabulary_id', title: this.get('vocabulary_id') + ' code', className: 'code', value: this.get('concept_code') });
    this._bits.add({context:'main-desc', name: 'domain_id', title: this.fieldTitle('domain_id'), className: this.fieldClass('domain_id'), value: this.get('domain_id')});
    this._bits.add({context:'main-desc', name: 'concept_class_id', title: this.fieldTitle('concept_class_id'), className: this.fieldClass('concept_class_id'), value: this.get('concept_class_id')});

    ['C','S','X'].forEach(
      sc => {
        let cfld = ({S: 'rc', X: 'src', C: 'crc'})[sc];
        let j = _.compact(this.get('rcs',[]))
        // _.comapact is to fix temporary bug where rcs can equal [null] instead of []
            .filter(d=>d[cfld])
            .map(countRec => ({
              context:`cdm-${cfld}`,
              name: `${cfld}-${this.tblcol(countRec)}`,
              className:this.scClassName('S'),
              title: `${countRec.rc} CDM ${({S:'', X:'source ',C:'C (which is weird)'})[sc]} records in`,
              value: this.tblcol(countRec),
              data: {drill:{ci:this, countRec}, drillType:cfld},}));
        console.log(j);
        j.forEach(d => this._bits.add(d));
      })

    let relgrps = this.get('relgrps');
    let rg = _.supergroup(relgrps, ['relationship','domain_id','vocabulary_id','concept_class_id']);

    rg.sortBy(d=>d.toLowerCase()).map(rel => ({
            context:`rel-${rel}`,
            name: `${rel}-${rel.related_cgid}`,
            title: <span>
                      Related to {' '}
                      <span style={{fontWeight:'bold'}}>
                        {rel.aggregate(_.sum, 'relcidcnt')} {rel}
                      </span> concepts</span>,
            value: rel.leafNodes()
                      .map((grp,i) => <p key={i}>{grp.aggregate(_.sum, 'relcidcnt')} {grp.namePath()} concepts</p>),
            data: {drill:{ci:this, rel}, drillType:'relatedConcepts'},
          }))
      .forEach(d => this._bits.add(d));

    /*
    rg.leafNodes().map(grp => ({
            wholeRow: `${grp.aggregate(_.sum, 'relcidcnt')} ${grp.namePath()} concepts`,
            /*
            title: `${grp.aggregate(_.sum, 'relcidcnt')} ${grp.namePath()} concepts`,
            value: `${grp.domain_id} ${grp.vocabulary_id}
                      ${grp.concept_class_id}
                      ${grp.defines_ancestry ? ' defines ancestry ' : ''}
                      ${grp.is_hierarchical ? ' is hierarchical' : ''}
                      `,
            * /
            data: {drill:{ci:this, grp}, drillType:'relatedConcepts'},
          }))
      .forEach(d => this._bits.add(d));
    * /
    /*
    let cgs = this.get('relgrps',[])
                  .filter(
                    rec=>!_.some(['mapsto','mappedfrom'],
                                rel => rec.relationship_id === this.fieldTitle(rel)))

    let cgcnt = _.sum(cgs.map(d=>d.cc));

    let MAX_TO_SHOW = 4;
    if (cgcnt <= MAX_TO_SHOW) {
      let relatedRecs = this.getRelatedRecs('relatedConcepts',[]);
      bits = bits.concat(relatedRecs.map(rec => ({
        title: <span>
                  <strong>{rec.get('relationship_id')}</strong>:{' '}
                  {rec.get('domain_id')} {rec.get('vocabulary_id')} {' '}
                  {rec.get('concept_class_id')}{' '}
                  {rec.get('defines_ancestry') ? '(ancestry)' : ''}{' '}
                  {rec.get('is_hierarchical') ? '(hierarchical)' : ''}
               </span>,
        value: rec.get('concept_name'), className: rec.scClassName(),
        linkParams:{concept_id: rec.get('concept_id')},
      })));
    } else {
      bits = bits.concat(cgs.map(grp => ({
                        title: `${grp.cc} ${grp.relationship_id} concepts`,
                        value: `${grp.domain_id} ${grp.vocabulary_id}
                                  ${grp.concept_class_id}
                                  ${grp.defines_ancestry ? ' defines ancestry ' : ''}
                                  ${grp.is_hierarchical ? ' is hierarchical' : ''}
                                  `,
                        data: {drill:{ci:this, grp}, drillType:'relatedConcepts'},})));
    }
    * /
    /*
    let rcc = this.get('relatedConceptCount');
    if (rcc) bits = bits.concat({
                      //className:this.scClassName('X'),
                      wholeRow: `${rcc} related concepts`,
                      data: {drill:{ci:this, }, drillType:'relatedConcepts'},});
    * /
    /*
    switch (this.role()) {
      case 'mapsto':
      case 'mappedfrom':
      case 'relatedConcept':
        return [      // same as this.valid() at the moment...should combine stuff
          {title: this.scTitle(), className: 'name',
              wholeRow: `${this.scTitle()} ${this.get('concept_name')}`,
              linkParams:{concept_id: this.get('concept_id')}},
          {title: this.get('vocabulary_id') + ' code', className: 'code', value: this.get('concept_code') },
        ];
    }
    * /
  }
  scClassName(sc) {
    let scVal = this.scMap('className', sc);
    return scVal ? `sc-${scVal}` : 'invalid-concept';
  }
  scTitle() {
    let scVal = this.scMap('title');
    return scVal || `Can't find standard_concept`;
  }
  validConceptId() {
    return this._validConceptId;
  }
  scMap(out, sc) { // out = title or className
    sc = sc || this.get('standard_concept', false);
    let strings;
    switch (sc) {
      case 'S':
        strings = {title:'Standard Concept', className: 'standard-concept'};
        break;
      case 'C':
        strings = {title:'Classification Concept', className: 'classification-concept'};
        break;
      default:
        strings = {title:'Non-Standard Concept', className: 'non-standard-concept'};
    }
    return strings[out];
  }
  fieldTitle(field, val) { // maybe just a general lookup for nice names
    //if (val) { }
    let title = ({
                    concept_id: 'Concept ID',
                    concept_code: 'Concept Code',
                    concept_name: 'Name',
                    domain_id: 'Domain',
                    concept_class_id: 'Class',
                    vocabulary_id: 'Vocabulary',
                    mapsto: 'Maps to',
                    mappedfrom: 'Mapped from',
                    conceptAncestors: 'Ancestor concepts',
                    conceptDescendants: 'Descendant concepts',
                    //relatedConcepts: 'Related concepts (non-mapping)',
                    relatedConcepts: val,
                    //otherRelationship: val,
                  })[field];
    if (!title) debugger;
    return title || `no title for ${field}`;
  }
  fieldClass(field) {
    return ({
              concept_id: 'concept-id',
              concept_name: 'concept-name',
              concept_code: 'concept-code',
              domain_id: 'domain-id',
              concept_class_id: 'concept-class-id',
              vocabulary_id: 'vocabulary-id',
        })[field] || `no-class-for-${field}`;
  }
  tbl(crec) { if (crec) return crec.tbl; }
  col(crec) { if (crec) return crec.col; }
  tblcol(crec) { if (crec) return `${this.tbl(crec)}-->${this.col(crec)}`; }
}
export class InfoBit {
  constructor(o) {
    Object.assign(this, o);
    this._id = InfoBit.id(o);
  }
  id() {
    return this._id;
  }
  drillContent(c) {
    if (typeof(c) !== 'undefined') {
      this._drillContent = c;
    }
    return this._drillContent;
  }
  static id(o) {
    if (!o.context) throw new Error("expected context");
    if (!o.name) throw new Error("expected name");
    return `${o.context}/${o.name}`;
  }
}
export class InfoBitCollection {
  constructor(o) {
    Object.assign(this, o);
    this._collection = {};
  }
  currentEvent(p) { // no idea what I'm doing yet
  let {e, target, targetEl} = p;
    this._currentEvent = p;
  }
  collection() {
    return this._collection;
  }
  add(o) {
    if (!o.ci) {
      if (this.parent && this.parent instanceof ConceptAbstract) {
        o.ci = this.parent;
      } else {
        throw new Error("expecting a ci");
      }
    }
    let ib = this.findById(InfoBit.id(o)) || new InfoBit(o);
    this._collection[ib.id()] = ib;
    return ib;
    /*
    let {context='general', name} = o;
    name = name || `${context}-${this._bitIdx++}`;
    let cobj = this._bits[context] = this._bits[context] || {};
    cobj[name] = o
    * /
  }
  findById(id) {
    return this._collection[id];
  }
  select(context, name, filt) {
    let ret = _.values(this.collection());
    if (context instanceof RegExp) {
      ret = ret.filter(d => d.context && d.context.match(context));
    } else if (context) {
      ret = ret.filter(d => d.context === context);
    }

    if (name instanceof RegExp) {
      ret = ret.filter(d => d.name && d.name.match(name));
    } else if (name) {
      ret = ret.filter(d => d.name === name);
    }

    if (filt) {
      ret = ret.filter(filt);
    }

    return ret;
  }
}
*/
