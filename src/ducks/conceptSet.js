/* eslint-disable */

import {getStore, bindActionCreators} from 'src/index'
const kludgyDispatch = (action) => {
  if (typeof getStore === 'function') {
    return getStore().dispatch(action)
  }
  console.log('getStore not ready yet, while trying to dispatch', action)
  return action
}

const conceptState = () => getStore().getState().concepts

import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';
import * as config from 'src/config'
import * as Cset from 'sharedSrc/Cset'
export * from 'sharedSrc/Cset'
import muit from 'src/muitheme'
import {isConceptList, concepts, cdmCnts, flattenRelgrps,
        addRels, subgrpCnts, subtype,
        conceptActions, viewCounts, }
          from 'src/ducks/concept'
import * as api from 'src/api'
import * as cncpt from 'src/ducks/concept'
import React, { Component } from 'react'
import { combineReducers, } from 'redux'
import { createSelector } from 'reselect'
import stampit from 'stampit'
import * as stampitStuff from 'stampit'
window.stampitStuff = stampitStuff

export const CSET_APIPATH = 'cset'
export const UNPICKLE = 'vocab-pop/conceptSet/UNPICKLE'
export const FRESH_UNPICKLE = 'vocab-pop/conceptSet/FRESH_UNPICKLE'
export const UNPICKLE_DONE= 'vocab-pop/conceptSet/UNPICKLE_DONE'
export const PICKLED = 'vocab-pop/conceptSet/PICKLED'
export const NEW = 'vocab-pop/conceptSet/NEW'   // save 1 cset
export const TRASH = 'vocab-pop/conceptSet/TRASH'   // remove UNSAVED cset
export const UPDATE = 'vocab-pop/conceptSet/UPDATE'
export const API_DATA = 'vocab-pop/conceptSet/API_DATA'
export const API_CALL = 'vocab-pop/conceptSet/API_CALL'

/**** start reducers *********************************************************/
//let initStatus = {turnedOff: true, actions:[]}
//let initStatus = {uninitialized:true, actions:[]}
let initStatus = {uninitialized:true}
const statusReducer = (state=initStatus, action) => {
  let {type, payload, meta, error} = action
  let newProps
  switch (type) {
    case UNPICKLE:
      if (state.uninitialized) {
        state = {...state, unpickling: 'started', }
        delete state.uninitialized
      }
      if (meta.force) {
        throw new Error("not for now")
        newProps = { unpickling: 'started', }
      }
      break
    case FRESH_UNPICKLE:
      if (state.uninitialized) {
        newProps = { unpickling: 'fresh', }
      }
      break
    case UNPICKLE_DONE:
      if (state.unpickling !== 'done') {
        newProps = { unpickling: 'done', }
      }
      break
    case PICKLED:
      newProps = {pickled: [...(state.pickled||[]), action], unpickling:'hopeNot'}
      break
    case NEW:
    case UPDATE:
    case API_DATA:
    case TRASH:
    default: 
      return state
  }
  if (newProps) {
    return {...state, ...newProps}
  }
  return state
}
const pickledReducer = (state=0, action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case UNPICKLE:  // loading from storage
    case PICKLED:   // syncing with whatever is being saved to storage
      if (_.isEqual(payload, state)) {
        return state
      }
      return payload
  }
  return state
}
const csetsReducer = (state=0, action) => {
  //state = state || initialCsetLoad(action)
  //console.log('csetState', state)
  //debugger
  let {type, payload, meta, error} = action
  switch (type) {
    case FRESH_UNPICKLE:
      return payload
    case NEW:
      let _cset = payload
      if (_.some(state,cs=>cs.id===_cset.id)) {
        throw new Error("duplicate cset id")
      }
      return [...state, payload]
    case UPDATE:
      let cs = state.find(cset=>cset.id === payload.id)
      if (_.isEqual(cs,payload)) {
        throw new Error("should have checked already")
        return state
      }
      return [...state.filter(cset=>cset.id !== payload.id), payload]
    case API_DATA:
      payload = incarnateToLocal(payload)
      return [...state.filter(cset=>cset.id !== payload.id), payload]
    case TRASH:
      debugger
      if (payload.persistent) {
        throw new Error("not allowed")
      }
      return _.without(state, payload) // might not work!!
      //return [...state.filter(cset=>cset.name !== payload.name), payload]
  }
  return state
  //return Immutable(state)
}
export default combineReducers({
  pickled: pickledReducer,
  csets: csetsReducer,
  status: statusReducer,
})
/**** end reducers *********************************************************/

/**** start action creators *********************************************************/
export const newCset = (csetId) => ({ 
  type: NEW, 
  payload: Cset.csetTemplate(csetId || _.uniqueId()),
})
export const trashCset = (cset) => ({ 
  type: TRASH, 
  payload: cset
})
export const apiCall = (cset) => ({ type: API_CALL, payload:cset.obj()})

const unpickle = (meta={}) => {
  let _csets = util.storageGet('csets',localStorage)||[]
  _csets = _csets.map(prepareForPickling) // just in case extra junk got saved before pickling
  return { type: UNPICKLE, payload:_csets, meta}
}
const persistCsets = (meta={}) => {
  let _csets = (getStore().getState().csets.csets || []).map(prepareForPickling)
  util.storagePut('csets', _csets, localStorage, true)
  return { type: PICKLED, payload:_csets, meta}
}
/**** end action creators *********************************************************/

/**** start epics ******************************************/
let epics = []
epics.push((action$, store) => (
  action$.ofType(UNPICKLE)
    .mergeMap(action=>{
      const {type, payload, meta} = action
      const _csets = payload.map(incarnateToLocal)
      return Rx.Observable.of({type: FRESH_UNPICKLE, payload:_csets})
    })
))
epics.push((action$, store) => (
  action$.ofType(FRESH_UNPICKLE)
    .mergeMap(action=>{
      const {type, payload, meta} = action
      return Rx.Observable.of({type: UNPICKLE_DONE, payload})
    })
))
epics.push((action$, store) => (
  action$.ofType(UNPICKLE_DONE)
    .mergeMap(action=>{
      const {type, payload, meta} = action
      const _csets = payload
      return _csets.map(_cset => {
        const cset = getCset(_cset.id)
        if (cset.needsCidsFetching()) {
          return api.actionGenerators.apiCall({
            apiPathname:CSET_APIPATH, 
            params:{cset:prepareForPickling(cset.obj())}, 
            meta:{requestId:cset.requestId(CSET_APIPATH)}
          })
        }
      }).filter(d=>d)
    })
))
epics.push((action$, store) => (
  action$.ofType(UPDATE)
    .mergeMap(action=>{
      const {type, payload, meta} = action
      const cset = getCset(payload.id)
      if (cset.needsCidsFetching()) {
        return Rx.Observable.of(api.actionGenerators.apiCall({
          apiPathname:CSET_APIPATH, 
          params:{cset:prepareForPickling(cset.obj())}, 
          meta:{requestId:cset.requestId(CSET_APIPATH)}
        }))
      }
      return Rx.Observable.empty()
    })
))

epics.push((action$, store) => (
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter((action) => (action.meta||{}).apiPathname === CSET_APIPATH)
    .delay(200) // what's this for?
    .map(action=>{
      let {type, payload, meta} = action
      return { type: API_DATA, payload }
    })
))
export {epics}
/**** end epics ******************************************/

/**** start selectors *****************************************************************/
const csetQueryProps = ['selectMethodName', 'selectMethodParams',
  'includeDescendants', 'includeMapped', 'includeDescendants', 'isExcluded']
const csetResultProps = ['cids']
const csetMetaProps = ['id', 'name',]
const csetPersistProps = csetMetaProps.concat(csetQueryProps, csetResultProps)
const csetPersistPropsNR = csetMetaProps.concat(csetQueryProps)

const localId = (_cset, forceNew=false) => {
  let uniqueByQuery = _cset.id + '-' + 
    util.serialize(_.values(_.pick(_cset, csetQueryProps)),{}).replace(/\"/g,'')
  return uniqueByQuery
  /*
  if (!forceNew && _cset.localId) {
    return _cset.localId
  }
  return _.uniqueId(`${_cset.id}-local-`)
  */
}
const prepareForPickling = (_cset,includeResults=true) => 
  _.cloneDeep(_.pick(_cset, includeResults ? csetPersistProps : csetPersistPropsNR))
const incarnateToLocal = _cset => { // from persistent
  return {..._cset, 
            persistent: true, 
            localId: localId(_cset),
  }
}
export const _storedCsets = (state=getStore().getState()) => {
  if (state.csets.csets) {
    return state.csets.csets
  }
  if (state.csets.pickled) {
    return state.csets.pickled
  }
  kludgyDispatch(unpickle())
  return []
}
export const _getCset = createSelector( _storedCsets, _csets => id => _.find(_csets, cs=>cs.id==id)) // two = for loose type checking, "5"==5
export const storedCsets = createSelector(_storedCsets, _csets=>_csets.map(blessCset))
export const selectMethods = _.mapValues(Cset.selectMethodsShared,m=>m())
export const blessCset = (_cset) => {
  let stamp
  switch (_cset.selectMethodName) {
    /*
    case 'fromAtlas':
      stamp = Cset.CsetFromAtlas
      break
    */
    case 'matchText':
    case null:
      stamp = Cset.Cset
      break
    default:
      debugger
      throw new Error("don't know that method")
  }
  stamp = stamp.compose(CsetPickler)
               .compose(ConceptRequester)
               //.compose(CsetAnalyzer)
  let cset = stamp(_cset)
  return cset
}
export const getCset = id => {
  const _cset = _getCset(getStore().getState())(id)
  if (_cset) {
    return blessCset(_cset)
  }
}
const _persistedCsets = () => getStore().getState().csets.pickled
export const _getPersistedCset = id => _persistedCsets().find(cs=>cs.id==id)


/**** end selectors *****************************************************************/

export const CsetPickler = stampit()
  .init(function() {
    this.localId = () => this._cset.localId || localId(this._cset)
    this.persistent = () => this._cset.persistent
  })
  .methods({
    sameAsStore: function() {
      let storedCset = getCset(this.id())
      return this.sameAsObj(storedCset.obj())
    },
    sameAsPersisted: function() {
      let _persistedCset = prepareForPickling(_getPersistedCset(this.id()),false)
      let _thisCset = prepareForPickling(this._cset,false)
      return _.isEqual(_persistedCset, _thisCset)
    },
    needsPersisting: function() { return this.persistent() && !this.sameAsPersisted() },
    update: function(newProps) { // user updates only...i'm pretty sure
      if (!this.sameAsStore()) {
        //throw new Error("havent even updated yet -- why out of sync with store?")
      }
      let newCset
      if (this.arePropsDifferent(newProps)) {
        const _cset = this.mergeProps(newProps)
        let queryProps = _.pick(newProps, csetQueryProps)
        if (this.arePropsDifferent(queryProps)) {
          _cset.cids = []
          _cset.localId = localId(_cset,true)
          newCset = blessCset(_cset)
        } else {
          newCset = blessCset(_cset)
        }
        kludgyDispatch({ type: UPDATE, payload:newCset.obj(), })
      }
    },
    persist: function() {
      this.update({persistent: true, })
      kludgyDispatch(persistCsets())
    },
    serialize: function(opts) { 
      let obj = Object.assign({},this.obj(), {
        persistent: this.persistent() ? 'true' : 'false',
        needsCidsFetching: this.needsCidsFetching() ? 'true' : 'false',
        needsPersisting: this.needsPersisting() ? 'true' : 'false',
        isValid: this.valid() ? 'true' : 'false',
        cantFetch: this.cantFetch().length,
        // FIX!! split this stuff into different class
        waiting: this.waiting() ? 'true' : 'false',
        conceptsLoading: this.conceptsLoading() ? 'true' : 'false',
        someConceptsLoaded: this.conceptsLoaded().length ? 'true' : 'false',
        doneFetchingCids: this.doneFetchingCids() ? 'true' : 'false',
        doneFetchingConcepts: this.doneFetchingConcepts() ? 'true' : 'false',
        wereCidsRequested: this.wereCidsRequested() ? 'true' : 'false',
        wereConceptsRequested: this.wereConceptsRequested() ? 'true' : 'false',
        cidsRequestId: this.requestId(CSET_APIPATH),
        conceptsRequestId: this.requestId(cncpt.apiPathname),
        basketCounts: this.basketCounts(),
        //myRequest: this.myRequest() || 'no request found',
        //allRequests: this.allRequests(),
      })
      return util.serialize(obj, opts)
    },
    //persistent: function() { if (!this._cset){debugger}return this._cset.persistent || !!_getPersistedCset(this.id()) },
    needsCidsFetching: function() { 
      return this.valid() && !this.doneFetchingCids()
    },
    updateSelectParams: function(newProps) {
      this.update({selectMethodParams: newProps})
    },
    myCidsRequest: function() {
      let apiState = getStore().getState().api
      let allRequests = apiState.queue
      let myRequest = _.values(allRequests).find(
        req=>(req.meta||{}).requestId === this.requestId(CSET_APIPATH))
      return myRequest
    },
    wereCidsRequested: function() {
      return !!this.myCidsRequest()
    },
    doneFetchingCids: function() {
      return this.cidCnt() || // if any at all, should have all
              (this.myCidsRequest()||{meta:{}}).meta.status === 'complete'
    },
  })
export const ConceptRequester = stampit()
  .methods({ // assumes CsetPickler
    concepts: function(cids=this.cids()) { return concepts(conceptState().loaded).filter(c=>_.includes(cids,c.concept_id)) },
    concept_ids: function(cids) { return this.concepts(cids).map(d=>d.concept_id) },
    conCnt: function() { return this.concepts().length },
    requestId: function(apiPathname) {
      if (!apiPathname) {
        throw new Error("need an api name")
      }
      return this.localId() + '-' + apiPathname
      /*
      return localId(this.obj())
      let queryProps = JSON.stringify(_.values(_.pick(this.obj(), csetQueryProps)))
      return [this.id(), queryProps].join(',')
      */
    },
    fetchConcepts: function() {
      if (this.needsCidsFetching()) { // can't fetch concepts if don't know cids yet
        return
      }
      let requestAction = bindActionCreators(cncpt.wantConcepts)(this.cids(),{requestId:this.requestId(cncpt.apiPathname)})
      return requestAction
    },
    requestState: function() {
      return conceptState().requests
    },
    allRequests: function() {
      return this.requestState().requests
    },
    myConceptRequest: function() {
      return _.find(this.allRequests(),req=>req.meta.requestId == this.requestId(cncpt.apiPathname))
    },
    wereConceptsRequested: function() {
      return !!this.myConceptRequest()
    },
    conceptBaskets: function(opts={}) {
      const baskets = opts.basketList || ['want','fetching','cantFetch','got']
      let ret = {}
      let reqState = this.requestState()
      baskets.forEach(basket => {
        let inBasket = _.intersection(reqState[basket], this.cids())
        if (inBasket.length) {
          ret[basket] = inBasket
        }
      })
      if (!this.wereConceptsRequested()) {
        ret.unrequested = _.difference(this.cids(), ..._.values(ret))
      }
      if (!opts.basketList &&
          _.sum(_.values(ret).map(d=>d.length)) !== this.cidCnt()) {
        if (!this.needsCidsFetching()) {
          throw new Error("that's not right")
        }
      }
      return ret
    },
    basketCounts: function(opts={}) {
      let counts = _.mapValues(this.conceptBaskets(opts), d=>d.length)
      if (opts.action) { // assume action want array of vals, not obj
        return opts.action(_.values(counts))
      }
      return counts
    },
    conceptsNotLoaded: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return _.union(want,fetching,cantFetch)
    },
    conceptsLoaded: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return got || []
    },
    conceptsLoading: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return fetching || []
    },
    cantFetch: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return cantFetch || []
    },
    waiting: function() {
      return this.wereConceptsRequested() && this.cidCnt() > this.basketCounts({
          basketList:['got','cantFetch'], action:_.sum,
      })
    },
    doneFetchingConcepts: function() {
      return this.wereConceptsRequested() && !this.waiting()
      //return this.allConceptsLoaded() || (this.myConceptRequest()||{meta:{}}).meta.status === 'done'
    },


    // these were in analyzer but need to be fixed or put somewhere else:
    subThemeName: function() {
      return cncpt.singleMemberGroupLabel(this.sgVal(), 'sc')
    },
    cdmCnts: function() { return cdmCnts(this.sgVal()) },
    subgrpCnts: function(...rest) {return subgrpCnts(this.sgVal(), ...rest)},
    shortDesc: function() {
      return (
        this.name()
      )
    },
    longDesc: function() {
      return (
        this.shortDesc()
      )
    },
    fancyDesc: function() {
      return (
        <div style={{border:'4px solid pink'}}>{`${this.longDesc()}`}</div>
      )
    },

  })
  .init(function(_cset) {
    // these too:
    this.sgList = () => _.supergroup(this.concepts(), 
                                  d=>this.shortDesc(),
                                  {dimName:'whole concept set'})
    this.sgVal = () => _.supergroup(this.concepts(), 
                              d=>null, 
                              {dimName:'whole concept set'})
                        .asRootVal(this.shortDesc())


    this.analyzer = ClistAnalyzer(()=>this.concepts())

  })
const okVocs = config.getSetting('filters.include.vocabularies')
export const relgrpFilter = grp => {
  //return relgrps.filter(grp => _.includes(okVocs, grp.vocabulary_id))
  return _.includes(okVocs, grp.vocabulary_id)
}
export const ClistAnalyzer = stampit()
  .init(function(clistGetter=()=>[], opts={}) { // also accepts a clist

    if (typeof clistGetter !== 'function') {
      if (cncpt.isConceptList(clistGetter)) {
        this.concepts = () => clistGetter
      } else {
        throw new Error("what'choo tryin to do?")
      }
    } else {
      //this.concepts = () => clistGetter(...rest)
      this.concepts = clistGetter
    }
    if (!cncpt.isConceptList(this.concepts())) {
      throw new Error("what'choo tryin to do?")
    }

    this.rgfilt = opts.rgfilt || relgrpFilter  // FOR NOW -- FIX LATER!!!!
    this.expandedRgfilt = filt => 
      (el, idx, arr) => this.rgfilt(el,idx,arr) && filt(el,idx,arr)

    this.clist = (opts={}) => { // accepts opts.cfilt
      return opts.cfilt ? this.concepts().filter(opts.cfilt) : this.concepts()
    }
    this.flattenRelgrps = (opts={}) => { // accepts opts.rgfilt
      let rgfilt = opts.rgfilt || this.rgfilt
      return _.flatten(
        this.clist(opts)
            .map(c => {
              return c.relgrps
                      .filter(rgfilt)
                      .map(grp => Object.assign({},grp,{
                                    concept_id: c.concept_id,
                                  })
                          )
            })
      )
    }
    this.rels = (opts={}) => {
      let rgfilt = opts.rgfilt || this.rgfilt
      let relgrps = this.flattenRelgrps(opts)
      let relsSg = _.supergroup(relgrps,cncpt.reldim, {multiValuedGroup:true,dimName:'reldim'})

      relsSg.leafNodes().forEach(relSg => {
        let [r,rr] = relSg.split(/ --> /)

        if (relSg.records.filter(rg=>!rgfilt(rg)).length) {
          throw new Error("i thought it might already be filtered. maybe not")
        }
        if (relSg.records.filter(r=>cncpt.reldim(r)!=relSg).length) {
          throw new Error("i thought it might already be filtered. maybe not")
        }
        relSg.relcids = _.uniq(_.flatten(relSg.records.map(r=>r.relcids)))

        relSg.reldim = relSg.toString()
        relSg.rreldim = `${rr} --> ${r}`
      })
      return relsSg
    }
    this.mapsTo = () => {
      let mto = this.rels({rgfilt: this.expandedRgfilt(rg=>rg.relationship==='Maps to')})
      console.log(mto.summary())
      return mto
    }
    this.sgListWithRels = (depth=0) => {
      if (this.conCnt()) debugger
      let sgList = this.sgList() // only one value, but want list to addRels
      if (!this.conCnt()) {
        return sgList
      }
      let wkids = addRels(sgList)
      if (!depth) {
        let wgkids = wkids.map(p => {
          //debugger
          let gp = addRels(p.getChildren())
          // should only care about opposite
          //p.sameRel = gp.leafNodes().filter(gk=>gk.reldim===gk.parent.reldim)
          /*
          p.oppositeRels = gp.leafNodes().filter(gk=>gk.reldim===gk.parent.rreldim)
          p.oppositeRels.forEach(d=>d.isOpposite=true)

          let test = explodeArrayFlds(gp.records,'relgrps','cncpt')
          let t2=explodeArrayFlds(test, 'relcids', 'relgrp')
          let tr=_.flatten(t2.map(d=>Object.assign({},d,{reverse:t2.filter(e=>e.relgrp_cncpt_concept_id === d.relcids)})))
          let t3 = explodeArrayFlds(tr,'reverse','from')

          let allkeys = _.keys(t3[3])
          let idkeys = _.keys(t3[3]).filter(d=>d.match('id')).filter(d=>!d.match(/(cgid|domain|class|vocab|relgrp_relcids)/))

          let goodidkeys = [ "from_relgrp_cncpt_concept_id", "relgrp_cncpt_concept_id", "relcids", ]


          let classkeys = _.keys(t3[3]).filter(d=>d.match('class'))
          let relkeys = _.keys(t3[3]).filter(d=>d.match('relation'))

          let round=t3.filter(d=>d.from_relgrp_cncpt_concept_id === d.relcids)
          let roundsg = _.supergroup(round, [
            "from_relgrp_cncpt_vocabulary_id",
            "from_relgrp_relationship",
            "from_relgrp_cncpt_concept_class_id",
          ])
          roundsg.summary({funcs:_.fromPairs(goodidkeys.map(k=>[k, d=>_.uniq(_.flatten(d.records.map(rec=>rec[k]))).length]))})
          t3.filter(d=>d.from_relcids !== d.relgrp_cncpt_concept_id)
          t3.filter(d=>d.from_relgrp_cncpt_concept_id === d.relcids)
          _.supergroup(t3, ["from_relgrp_cncpt_concept_id","relgrp_cncpt_concept_id", "relcids", ]).summary()

          // took long time:
          _.supergroup(t3, ["from_relgrp_cncpt_concept_id","relgrp_cncpt_concept_id", "relcids","from_relgrp_cncpt_concept_class_id", "from_relgrp_concept_class_id", "relgrp_cncpt_concept_class_id", "relgrp_concept_class_id" ]).summary()
          debugger
          */

          return p



        })
        //debugger
        //wgkids[0].leafNodes().filter(d=>d.reldim === d.parent.rreldim).map(d=>cncpt.subgrpCnts(d))
        //return wgkids
      }
      return sgList
      //return wkids
    }
  })
  .methods({ // assumes ConceptRequester

  })































/*
export const selectMethods = {
  matchText: stampit(Cset.selectMethodsShared.matchText)
              .methods({
                name: function() {
                  return this.param('matchStr')
                },
                name2: function() {
                  return this._cset.name || this.param('vocabulary_id')
                }
              }),
  fromAtlas: stampit(Cset.selectMethodsShared.fromAtlas)
              .methods({
                name: function() {
                  return this._cset.name
                },
                name2: function() {
                  return `(from www.ohdsi.org/web/atlas/#/conceptsets)`
                }
              }),
    /*
    {
      name: 'matchCodes',
      dispName: 'Match concept codes',
      matchBy: 'codes',
      //params: {vocabulary_id:'ICD9CM', matchStr: '702%, 700%'},
      params: {vocabulary_id:'string', matchStr: 'string'},
    },
    {
      name: 'codeList',
      dispName: 'Concept code list',
      //params: {vocabulary_id:'ICD9CM', codes: ['702', '702.0', '702.01']}
      params: {vocabulary_id:'string', codes: 'string[]' }
    },
    {
      name: 'cidList',
      dispName: 'Concept ID list',
      //params: {cids: [8504,8505,44833364,44820047]},
      params: {cids: 'number[]'},
    },
    * /
}
*/








export const toClist = cholder => { 
  // fix, but for now have ConceptSets and relSgs and other supergroup vals
  // that i want to use the same functions with
  let clist = (isConceptList(cholder) && cholder) ||  // already a clist
              (isConceptList(cholder.records) && cholder.records) || // sgval or sglist with concepts
              (_.isFunction(cholder.concepts) &&
                isConceptList(cholder.concepts()) && cholder.concepts()) // sgval or sglist with concepts
  if (!clist) {
    throw new Error("can't find clist")
  }
  return clist
}

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
    this.wantConcepts = wantConcepts

    /* expecting: props: {cids, desc
     *
     * csetSelectors with conceptState
     *  for subsets: parent, cids, nature of subset (probably a group?), the group prop
     *  for rels (which are not subsets -- but the only kind of descendants that aren't):
     *    parent (relFrom), reldim, cids, any known props of parent
    * title, fancyTitle, ttText, ttFancy, } = props */
    if (props.concepts || !props.cids || !this.conceptState || !wantConcepts) {
      throw new Error("just give me cids and current conceptState and live wantConcepts")
    }
    if (!props.role) {
      throw new Error("need a role")
    }
  }
  props = (junk) => {
    if (typeof junk !== 'undefined') {
      // had a hard to find bug... hence:
      throw new Error(`typo? maybe you wanted prop(${junk})`)
    }
    return this._props
  }
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

  status = () => new CsStatus(this)
  cdmCnts = () => cdmCnts(this.sgVal())
  relgrps = (reldim) => relgrps(this.concepts(),reldim) // reldim optional

  sgList = () => _.supergroup(this.concepts(), 
                                d=>this.shortDesc(),
                                {dimName:'whole concept set'})

  sgVal = () => _.supergroup(this.concepts(), 
                             d=>null, 
                            {dimName:'whole concept set'})
                      .asRootVal(this.shortDesc())

  sgListWithRels = (depth=0) => {
    debugger
    let sgList = this.sgList() // only one value, but want list to addRels
    if (!this.conCnt()) {
      return sgList
    }
    let wkids = addRels(sgList)
    if (!depth) {
      let wgkids = wkids.map(p => {
        //debugger
        let gp = addRels(p.getChildren())
        // should only care about opposite
        //p.sameRel = gp.leafNodes().filter(gk=>gk.reldim===gk.parent.reldim)
        /*
        p.oppositeRels = gp.leafNodes().filter(gk=>gk.reldim===gk.parent.rreldim)
        p.oppositeRels.forEach(d=>d.isOpposite=true)

        let test = explodeArrayFlds(gp.records,'relgrps','cncpt')
        let t2=explodeArrayFlds(test, 'relcids', 'relgrp')
        let tr=_.flatten(t2.map(d=>Object.assign({},d,{reverse:t2.filter(e=>e.relgrp_cncpt_concept_id === d.relcids)})))
        let t3 = explodeArrayFlds(tr,'reverse','from')

        let allkeys = _.keys(t3[3])
        let idkeys = _.keys(t3[3]).filter(d=>d.match('id')).filter(d=>!d.match(/(cgid|domain|class|vocab|relgrp_relcids)/))

        let goodidkeys = [ "from_relgrp_cncpt_concept_id", "relgrp_cncpt_concept_id", "relcids", ]


        let classkeys = _.keys(t3[3]).filter(d=>d.match('class'))
        let relkeys = _.keys(t3[3]).filter(d=>d.match('relation'))

        let round=t3.filter(d=>d.from_relgrp_cncpt_concept_id === d.relcids)
        let roundsg = _.supergroup(round, [
          "from_relgrp_cncpt_vocabulary_id",
          "from_relgrp_relationship",
          "from_relgrp_cncpt_concept_class_id",
        ])
        roundsg.summary({funcs:_.fromPairs(goodidkeys.map(k=>[k, d=>_.uniq(_.flatten(d.records.map(rec=>rec[k]))).length]))})
        t3.filter(d=>d.from_relcids !== d.relgrp_cncpt_concept_id)
        t3.filter(d=>d.from_relgrp_cncpt_concept_id === d.relcids)
        _.supergroup(t3, ["from_relgrp_cncpt_concept_id","relgrp_cncpt_concept_id", "relcids", ]).summary()

        // took long time:
        _.supergroup(t3, ["from_relgrp_cncpt_concept_id","relgrp_cncpt_concept_id", "relcids","from_relgrp_cncpt_concept_class_id", "from_relgrp_concept_class_id", "relgrp_cncpt_concept_class_id", "relgrp_concept_class_id" ]).summary()
        debugger
        */

        return p



      })
      //debugger
      //wgkids[0].leafNodes().filter(d=>d.reldim === d.parent.rreldim).map(d=>cncpt.subgrpCnts(d))
      //return wgkids
    }
    return sgList
    //return wkids
  }
  subgrpCnts = (...rest) => subgrpCnts(this.sgVal(), ...rest)

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
    return (
      (this.hasProp('shortDesc') && this.prop('shortDesc')) ||
      (this.hasProp('desc') && this.prop('desc')) ||
      (this.role('sub') && `shortDesc for ${this.prop('subtype')}`) ||
      `I'm a ${this.role()}, what kind of shortDesc do you want?`
    )
  }
  longDesc = () => {
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
      (this.hasProp('longDesc') && (this.prop('longDesc'))) ||
      (this.hasProp('desc') && (this.prop('desc'))) ||
      (this.role('sub') && `${this.prop('subtype')}`) ||
      //(this.hasProp('longDesc') && ('fancy->long: ' + this.prop('longDesc'))) ||
      //(this.hasProp('desc') && ('fancy->desc: ' + this.prop('desc'))) ||
      //(this.role('sub') && `fancyDesc for ${this.prop('subtype')}`) ||
      `I'm a ${this.role()}, what kind of fancyDesc do you want?`
    )
  }
                    //(fancy prop from csetFromRelSg)
  csetFromRelSg = (relSg) => {
    if (!relSg.reldim) debugger
    return new RelConceptSet({
                //...this.props(),
                cids: relSg.relcids,
                relSg,
                parent: this, 
                shortDesc: relSg.reldim,
                longDesc: `${this.shortDesc()} ${relSg.reldim}`,
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
                    {relSg.reldim}
                  </span>,
                role: 'rel',
              }, this.csetSelectors, this.wantConcepts)
  }
  role = r => r ? (this.prop('role') === r) : this.prop('role')
  reldim = () => reldim(this)
  rreldim = () => rreldim(this)

  loadConcepts = () => {
    if (this.status().loaded()) {
      return
    }
    debugger
    this.wantConcepts(this.cids(),{requestId:this.longDesc()})
  }
}
class CsStatus {
  constructor(cset) {
    this.cset = cset
  }
  loadedMsg = () => this.status().loaded + ' loaded'
  waiting = () => _.includes(['not determined','loading'], this.status().status)
  notRequested = () => this.status().status === 'not requested' 
  loaded = () => this.cset.cidCnt() === this.cset.conCnt()
  //loading = () => {throw new Error("not implemented")}
  status = () => {
    throw new Error('fix')
    let cset = this.cset
    let {status:reqStatus, want, fetching, got, focal, requests, staleRequests} = cset.conceptState.requests
    let notLoaded = _.difference(cset.cids(), cset.concept_ids())
    let status = {
      loaded: cset.conCnt(),
      notLoaded: notLoaded.length,
      loading: _.intersection(notLoaded, fetching).length,
      requested: _.intersection(_.flatten(requests.map(r=>r.cids)),cset.cids()).length,
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
          status.msg = `loaded ${status.loaded} of ${cset.cidCnt()}`
        }
      } else {
        // not fully loaded, not loading, why?
        if (status.requested) {
          if (status.requested > status.loaded) {
            // requested some that aren't loaded or loading...presumably store is full
            if (status.cantLoad) {
              if (status.requested - status.loaded === status.cantLoad) {
                status.status = "can't load"
                status.msg = `can't load ${status.cantLoad} of ${cset.cidCnt()}`
              } else {
                status.status = "weird"
                debugger
              }
            }
          } else {
            // requested cids are loaded
            // presumably some cids in this cset loaded by another cset's request
            status.status = 'not requested'
            status.msg = `loaded ${status.loaded} of ${cset.cidCnt()}`
          }
        } else {
          // none requested
          status.status = 'not requested'
          if (status.loaded) {
            status.msg = `loaded ${status.loaded} of ${cset.cidCnt()}`
          } else {
            status.msg = `${cset.cidCnt()} concepts`
          }
        }
      }
    }
    if (status.msg === 'not sure') {
      debugger
    }
    return status
  }
}
class RelConceptSet extends ConceptSet {
  constructor(...rest) {
    //debugger
    //console.log(new.target.name)
    super(...rest)
    //this.relSg = this.prop('relSg')
  }
  reverseRelConceptSet = (reldim, relcids) => {
    return new RevRelConceptSet({
                //...this.props(),
                cids: relcids,
                parent: this, 
                reldim, 
                desc: `revrel of ${this.shortDesc()} ${reldim}`,
                longDesc: `${this.shortDesc()} ${reldim}`,
                fancyDesc: 
                  <span>
                    <h4>reverseRelConceptSet!!!</h4>
                    <span style={{fontSize: '.8em',opacity:.7, fontStyle:'italic',
                                    marginRight: 8,}}>
                      {this.fancyDesc()} 
                    </span>
                    <span style={{marginLeft: 8,}}
                        aria-hidden="true" 
                        data-icon="&#xe90a;" 
                        className="icon-link"></span>
                    {reldim}
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
}
class RevRelConceptSet extends RelConceptSet {
  constructor(...rest) {
  let {props, csetSelectors, wantConcepts} = rest
    super(...rest)
    this.loadConcepts(props)
    this.parent
  }
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

