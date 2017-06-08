/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';
import * as config from 'src/config'
import muit from 'src/muitheme'
import {isConceptList, concepts, cdmCnts, relgrps,
        addRels, subgrpCnts, subtype, reldim, rreldim,
        conceptActions, viewCounts,}
          from 'src/ducks/concept'
import * as cncpt from 'src/ducks/concept'
import React, { Component } from 'react'

const csetTemplate = () => ({
  name: 'needs a name',
  defType: 'textMatch', 
  // enum: textMatch, codeMatch, codeList, cidList ,
  //        csetList, composite
  def: 'acne',
  vocabulary_id: 'ICD9CM', // only allow one per cset!
  includeDescendants: false,
  includeMapped: false,
  isExcluded: false,
  isSaved: false,
})

export const csetActions = {
  LOAD: 'vocab-pop/conceptSet/LOAD', // whole set
  SAVE: 'vocab-pop/conceptSet/SAVE', // whole set where isSaved===true
  NEW: 'vocab-pop/conceptSet/NEW',   // save 1 cset
  TRASH: 'vocab-pop/conceptSet/TRASH',   // remove UNSAVED cset
  UPDATE: 'vocab-pop/conceptSet/UPDATE',   // overwrite 1 cset
}

/**** start reducers *********************************************************/
const csetReducer = (state=[], action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case csetActions.LOAD:
      return payload
    case csetActions.NEW:
      return [...state, payload]
    case csetActions.UPDATE:
      return [...state.filter(cset=>cset.name !== payload.name), payload]
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
export const csets = state => state.csets /* including not saved */
export const cset = createSelector( csets,
  csets => name => _.find(csets, cs=>cs.name===name))
/**** end selectors *****************************************************************/

/**** start action creators *********************************************************/
export const load = () => ({ 
  type: csetActions.LOAD, 
  payload: util.storageGet('csets',localStorage)||[]
})
export const newCset = () => ({ 
  type: csetActions.NEW, 
  payload: csetTemplate(),
})
export const trashCset = (cset) => ({ 
  type: csetActions.TRASH, 
  payload: cset
})
export const saveCsets = () => ({ type: csetActions.SAVE, })
/**** end action creators *********************************************************/

/**** start epics ******************************************/
let epics = []
const saveCsetsEpic = (action$, store) => (
  action$.ofType(csetActions.SAVE)
    .switchMap(action=>{
      let {type, payload, meta} = action
      const csets = store.getState().csets.filter(cset=>cset.isSaved)
      util.storagePut('csets', csets, localStorage, true)
      return Rx.Observable.empty()
    })
)
epics.push(saveCsetsEpic)
export {epics}
/**** end epics ******************************************/







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

