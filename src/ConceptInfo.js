/* eslint-disable */
import _ from './supergroup'; // in global space anyway...
import Rx from 'rxjs/Rx';
import React, { Component } from 'react';

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
    */
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
    */
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
    */
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
    */
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
    */
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
    */
    /*
    let rcc = this.get('relatedConceptCount');
    if (rcc) bits = bits.concat({
                      //className:this.scClassName('X'),
                      wholeRow: `${rcc} related concepts`,
                      data: {drill:{ci:this, }, drillType:'relatedConcepts'},});
    */
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
    */
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
    */
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
