/* eslint-disable */
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
  LOAD: 'vocab-pop/conceptSet/LOAD', // whole set
  NEW: 'vocab-pop/conceptSet/NEW',   // save 1 cset
  TRASH: 'vocab-pop/conceptSet/TRASH',   // remove UNSAVED cset
  SAVE: 'vocab-pop/conceptSet/SAVE',   // overwrite 1 cset (in reducer)
            // and (in epic) save all to storage where isSaved===true
  API_CALL: 'vocab-pop/conceptSet/API_CALL',
}

/**** start reducers *********************************************************/
const storedCsets = util.storageGet('csets',localStorage)||[]
_.range(_.max(storedCsets.map(d=>d.id))).forEach(()=>_.uniqueId()) // start ids after highest

const csetReducer = (state=storedCsets, action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case csetActions.LOAD:
      return payload
    case csetActions.NEW:
      let _cset = payload
      if (_.some(state,cs=>cs.id===_cset.id)) {
        throw new Error("duplicate cset id")
      }
      return [...state, payload]
    case csetActions.SAVE:
      return [...state.filter(cset=>cset.id !== payload.id), payload]
    case csetActions.TRASH:
      debugger
      if (payload.isSaved) {
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
export const _csets = state => state.csets /* including not saved */
export const _getCset = createSelector( _csets, _csets => id => _.find(_csets, cs=>cs.id==id)) // two = for loose type checking, "5"==5
export const csets = createSelector(_csets, _csets=>_csets.map(_cset=>Cset.Cset({_cset})))
export const getCset = createSelector( _getCset, _getCset => (id,conceptState) => {
  const _cset = _getCset(id)
  if (!_cset) {
    return
  }
  let stamp
  switch (_cset.selectMethodName) {
    case 'fromAtlas':
      stamp = Cset.CsetFromAtlas.compose(Cset.selectMethodsShared.fromAtlas)
      break
    case 'matchText':
    default:
      stamp = Cset.Cset.compose(Cset.selectMethodsShared.matchText)
      break
  }
  if (conceptState) {
    stamp = stamp.compose(ConnectedCset)
  }
  return stamp({_cset,conceptState})
})
/**** end selectors *****************************************************************/

/**** start action creators *********************************************************/
/*
export const loadCsets = () => ({ 
  type: csetActions.LOAD, 
  payload: util.storageGet('csets',localStorage)||[]
})
*/
export const newCset = () => ({ 
  type: csetActions.NEW, 
  payload: Cset.csetTemplate(_.uniqueId()),
})
export const trashCset = (cset) => ({ 
  type: csetActions.TRASH, 
  payload: cset
})
export const saveCset = (cset) => ({ type: csetActions.SAVE, payload:cset, })
export const apiCall = (cset) => ({ type: csetActions.API_CALL, payload:cset.obj()})
/**** end action creators *********************************************************/

/**** start epics ******************************************/
let epics = []
const saveCsetsEpic = (action$, store) => (
  action$.ofType(csetActions.SAVE)
    .switchMap(action=>{
      const {type, payload, meta} = action
      const cset = new Cset.Cset(payload)
      if (cset.isSaved()) {
        const csets = store.getState().csets.filter(cset=>cset.isSaved)
        //csets = csets.concat(window.publicCsets)
        //debugger
        util.storagePut('csets', csets, localStorage, true)
      }
      if (cset.valid()) {
        const actn = api.actionGenerators.apiCall({
          apiPathname:'cset', params:{cset:cset.obj()}})
        return Rx.Observable.of(actn)
      }
      return Rx.Observable.empty()
    })
)
epics.push(saveCsetsEpic)

const loadCset = (action$, store) => (
  action$.ofType(api.apiActions.NEW_RESULTS,api.apiActions.CACHED_RESULTS)
    .filter((action) => (action.meta||{}).apiPathname === 'cset')
    .delay(200)
    .map(action=>{
      let {type, payload, meta} = action
      console.log("loadCset", action)
      return saveCset(payload)
    })
)
epics.push(loadCset)



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


export const ConnectedCset = stampit()
  .init(function({conceptState, csetSelectors, }) {
    this.conceptState = conceptState
    this.csetSelectors = csetSelectors
  })
  .methods({
    concepts: function(cids=this.cids()) { return concepts(this.conceptState.loaded).filter(c=>_.includes(cids,c.concept_id)) },
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
    sgListWithRels: function(depth=0) {
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
    this.wantConcepts(this.cids())
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

