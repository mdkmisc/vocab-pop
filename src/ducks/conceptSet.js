/* eslint-disable */

import {getStore, bindActionCreators} from 'src/index'

const conceptState = () => getStore().getState().concepts

import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';
import * as config from 'src/config'
import * as Cset from 'sharedSrc/Cset'
export * from 'sharedSrc/Cset'
import muit from 'src/muitheme'
import {isConceptList, concepts, cdmCnts, relgrps,
        addRels, subgrpCnts, subtype, reldim, rreldim,
        conceptActions, viewCounts,}
          from 'src/ducks/concept'
import * as api from 'src/api'
import * as cncpt from 'src/ducks/concept'
import React, { Component } from 'react'
import { createSelector } from 'reselect'
import stampit from 'stampit'
import * as stampitStuff from 'stampit'
window.stampitStuff = stampitStuff


export const csetActions = {
  NEW: 'vocab-pop/conceptSet/NEW',   // save 1 cset
  TRASH: 'vocab-pop/conceptSet/TRASH',   // remove UNSAVED cset
  UPDATE: 'vocab-pop/conceptSet/UPDATE',
  API_DATA: 'vocab-pop/conceptSet/API_DATA',
  API_CALL: 'vocab-pop/conceptSet/API_CALL',
}

/**** start reducers *********************************************************/
const _persistedCsets = () => (util.storageGet('csets',localStorage)||[]).map(d=>Object.assign(d,{justUnpickled:true}))
_.range(_.max(_persistedCsets().map(d=>d.id))).forEach(()=>_.uniqueId()) // start ids after highest

const csetReducer = (state=_persistedCsets(), action) => {
  console.log('csetState', state)
  //debugger
  let {type, payload, meta, error} = action
  switch (type) {
    case csetActions.NEW:
      let _cset = payload
      if (_.some(state,cs=>cs.id===_cset.id)) {
        throw new Error("duplicate cset id")
      }
      return [...state, payload]
    case csetActions.UPDATE:
      let cs = state.find(cset=>cset.id === payload.id)
      if (_.isEqual(cs,payload)) {
        throw new Error("should have checked already")
        return state
      }
    case csetActions.API_DATA:
      return [...state.filter(cset=>cset.id !== payload.id), payload]
    case csetActions.TRASH:
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
export default csetReducer
/**** end reducers *********************************************************/

/**** start selectors *****************************************************************/
export const _storedCsets = (state=getStore().getState()) => state.csets /* including not saved */
export const _getCset = createSelector( _storedCsets, _csets => id => _.find(_csets, cs=>cs.id==id)) // two = for loose type checking, "5"==5
export const storedCsets = createSelector(_storedCsets, _csets=>_csets.map(makeCset))
export const selectMethods = _.mapValues(Cset.selectMethodsShared,m=>m())
export const makeCset = (_cset, from) => {
  let stamp
  switch (_cset.selectMethodName) {
    case 'fromAtlas':
      stamp = Cset.CsetFromAtlas
      break
    case 'matchText':
    case null:
      stamp = Cset.Cset
      break
    default:
      debugger
      throw new Error("don't know that method")
  }
  stamp = stamp.compose(ConnectedCset)
  switch (from) {
    case 'fromPersistentStore':
      _cset.persistent = true
      _cset.needsCidsFetching = true
      _cset.needsPersisting = false
      debugger
      getStore().dispatch({ type: csetActions.UPDATE, payload:_cset})
  }
  let cset = stamp({_cset})
  return cset
}
export const unpickleCset = _cset => makeCset(_cset,'fromPersistentStore')
export const getCset = id => {
  const _cset = _getCset(getStore().getState())(id)
  if (_cset) {
    return makeCset(_cset)
  }
}
export const persistedCsets = () => _persistedCsets().map(unpickleCset)
export const persistCsets = () => {
  let _csets = _storedCsets().map(
    _cset => {
      //let upProps = _.pick(_cset, csetUnpersistedProps)
      let saveProps =  _.pickBy(_cset, (v,k)=>!_.includes(csetUnpersistedProps, k))
      return saveProps
    }
  )
  util.storagePut('csets', _csets, localStorage, true)
}
export const _getPersistedCset = createSelector( _persistedCsets, _csets => id => _.find(_csets, cs=>cs.id==id))
export const getPersistedCset = id => {
  const _cset = _getPersistedCset(_persistedCsets)(id)
  if (_cset) {
    return unpickleCset(_cset)
  }
}
/**** end selectors *****************************************************************/

/**** start action creators *********************************************************/
export const newCset = () => ({ 
  type: csetActions.NEW, 
  payload: Cset.csetTemplate(_.uniqueId()),
})
export const trashCset = (cset) => ({ 
  type: csetActions.TRASH, 
  payload: cset
})
export const apiCall = (cset) => ({ type: csetActions.API_CALL, payload:cset.obj()})
/**** end action creators *********************************************************/

/**** start epics ******************************************/
let epics = []
const fetchCidsEpic = (action$, store) => (
  action$.ofType(csetActions.UPDATE)
    .switchMap(action=>{
      debugger
      const {type, payload, meta} = action
      const cset = makeCset(payload)
      if (cset.valid() && cset.needsCidsFetching()) {
        const actn = api.actionGenerators.apiCall({
          apiPathname:'cset', params:{cset:cset.obj()}, meta:{requestId:cset.requestId()}})
        return Rx.Observable.of(actn)
      }
      return Rx.Observable.empty()
    })
)
epics.push(fetchCidsEpic)

const apiDataToStore = (action$, store) => (
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter((action) => (action.meta||{}).apiPathname === 'cset')
    .delay(200) // what's this for?
    .map(action=>{
      let {type, payload, meta} = action
      return { type: csetActions.API_DATA, payload }
    })
)
epics.push(apiDataToStore)


export {epics}
/**** end epics ******************************************/


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

const csetQueryProps = ['selectMethodName', 'selectMethodParams',
  'includeDescendants', 'includeMapped', 'isExcluded']
const csetResultProps = ['cids']
const csetMetaProps = ['name',]
const csetUnpersistedProps = ['persistent','needsCidsFetching','needsPersisting']

export const ConnectedCset = stampit()
  .methods({
    sameAsStore: function() {
      let storedCset = getCset(this.id())
      return this.sameAsObj(storedCset.obj())
    },
    persistObj: function() {
      return _.pickBy(this.obj(), (v,k)=>!_.includes(csetUnpersistedProps, k))
    },
    sameAsPersisted: function() {
      let _cset = _persistedCsets().find(_cset=>_cset.id === this.id())
      return _.isEqual(this.persistObj(), _cset)
    },
    serialize: function(indent) { 
      /*
      if (this.sameAsPersisted()) {
        let pcset = getPersistedCset(this.id()) // might have lost the fields that get added during unpickling
        let obj = Object.assign({},pcset.obj(), {
          justUnpickled: true
        })
        return JSON.stringify(obj, null, indent)
      }
      */
      let obj = Object.assign({},this.obj(), {
        persistent: this.persistent() ? 'true' : 'false',
        needsCidsFetching: this.needsCidsFetching() ? 'true' : 'false',
        needsPersisting: this.needsPersisting() ? 'true' : 'false',
      })
      return JSON.stringify(obj, null, indent)
    },
    persistent: function() { return this._cset.persistent },
    needsCidsFetching: function() { return this._cset.needsCidsFetching },
    needsPersisting: function() { return this._cset.needsPersisting },
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
          _cset.needsCidsFetching = true
          newCset = makeCset(_cset)
          //newCset.fetchCids()
        } else {
          newCset = makeCset(_cset)
        }
        getStore().dispatch({ type: csetActions.UPDATE, payload:newCset.obj(), })
      }
    },
    persist: function() {
      //debugger
      this.update({persistent: true, needsPersisting: true})
      persistCsets()
      this.update({needsPersisting: false})
    },
    updateSelectParams: function(newProps) {
      this.update({selectMethodParams: newProps})
    },
    concepts: function(cids=this.cids()) { return concepts(conceptState().loaded).filter(c=>_.includes(cids,c.concept_id)) },
    concept_ids: function(cids) { return this.concepts(cids).map(d=>d.concept_id) },
    conCnt: function() { return this.concepts().length },
    status: function() { return new CsStatus(this) },
    cdmCnts: function() { return cdmCnts(this.sgVal()) },
    relgrps: function(reldim) { return relgrps(this.concepts(),reldim) }, // reldim optional
    sgList: function() { return _.supergroup(this.concepts(), 
                                  d=>this.shortDesc(),
                                  {dimName:'whole concept set'}) },
    sgVal: function() { return _.supergroup(this.concepts(), 
                              d=>null, 
                              {dimName:'whole concept set'})
                        .asRootVal(this.shortDesc()) },
    XXsgListWithRels: function(depth=0) {
      let sgList = this.sgList() // only one value, but want list to addRels
      if (!this.conCnt()) {
        return this.sgList
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
    },
    subgrpCnts: function(...rest) {return subgrpCnts(this.sgVal(), ...rest)},
    shortDesc: function() {
      //let {status, msg} = this.status()
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

    requestId: function() {
      return [this.id(), ..._.values(this.selectMethodParams())].join(':')
    },
    fetchConcepts: function() {
      let requestAction = bindActionCreators(cncpt.wantConcepts)(this.cids(),{requestId:this.requestId()})
      return requestAction
    },
    requestState: function() {
      return conceptState().requests
    },
    allRequests: function() {
      return this.requestState().requests
    },
    myRequest: function() {
      return _.find(this.allRequests(),req=>req.meta.requestId == this.requestId())
    },
    requested: function() {
      return !!this.myRequest()
    },
    doneFetching: function() {
      return (this.myRequest()||{meta:{}}).meta.status === 'done'
    },
    conceptBaskets: function(countsOnly) {
      const baskets = ['want','fetching','cantFetch','got']
      let ret = {}
      let reqState = this.requestState()
      baskets.forEach(basket => {
        let inBasket = _.intersection(reqState[basket], this.cids())
        if (inBasket.length) {
          ret[basket] = inBasket
        }
      })
      if (!this.requested()) {
        ret.unrequested = _.difference(this.cids(), ..._.values(ret))
      }
      if (_.sum(_.values(ret).map(d=>d.length)) !== this.cidCnt()) {
        if (!this.needsCidsFetching()) {
          throw new Error("that's not right")
        }
      }
      return ret
    },
    basketCounts: function() {
      return _.mapValues(this.conceptBaskets(), d=>d.length)
    },
    conceptsNotLoaded: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return _.union(want,fetching,cantFetch)
    },
    conceptsLoaded: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return got
    },
    conceptsLoading: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return fetching
    },
    cantFetch: function() {
      let {want,fetching,cantFetch,got} = this.conceptBaskets()
      return cantFetch
    },
    waiting: function() {
      return this.cidCnt() > _.pick(this.basketCounts(), ['got','cantFetch'])
    },
  })





































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

