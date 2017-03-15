import * as AppState from './AppState';
import _ from 'supergroup'; // in global space anyway...
import Rx from 'rxjs/Rx';

export class ConceptSet {
  constructor({cis, params, title}) {
    this._cis = cis; // ConceptInfo array
    this._params = params;
    this._title = title;
  }
  title() {
    return this._title;
  }
  items() {
    return this._cis;
  }
}
var junkCtr = 0;
export default class ConceptInfo {
  //based on data from http://localhost:3000/api/cdms/conceptInfo?cdmSchema=cdm2&concept_id=201820&resultsSchema=results2
  constructor({ // expect lookupField and params, or rec
                lookupField, 
                params={}, // used in api call
                rec, // if creating from already (partially) fetched data
                fetchRelated=true, // set to false to not fetch related concepts
                                   // if false and rec not set, just fetch concept record
                cb,           // callback for when child updates (still use?)
                role='main',  // main, mapsto, etc
                inRelTo,      // parent ConceptInfo instance
                depth=0,      // 0 for main, +1 below
              } = {}) {
    this._status = 'preloading';
    this._validLookup = false;
    this._role = role;
    this._depth = depth;
    this._amMain = inRelTo ? false : true;
    this._inRelTo = inRelTo;
    this._fetchRelated = fetchRelated;
    this._fetchedRelated = false;
    this._relatedRecs = {};
    this.bsubj = new Rx.BehaviorSubject(this); // caller will subscribe
    this.sendUpdate = this.sendUpdate.bind(this);
    if (cb) this.cb = cb;
    if (rec) {
      this._crec = rec;
      this.lookupField = 'concept_id';
      this.lookupVal = this.get('concept_id');
      this.params = {concept_id: this.lookupVal}; // apiParams
      this._validLookup = true; // assume rec/_crec is always a valid concept
    } else {
      this.lookupField = lookupField;
      this.params = params;
      if (!_.has(params, lookupField)) throw new Error(`expected params[${lookupField}]`);
      this.lookupVal = params[lookupField];
    }
    this[this.lookupField] = this.lookupVal;
    this.fetchData();
  }
  fetchData() {
    // at some point allow specifying what specifically needs fetching 
    //  (beyond conceptRecord and related)

    if (this._status !== 'preloading') return;
    this._status = 'loading';
    if (this.lookupField === 'concept_code') {
      if (this._crec) {
        throw new Error("that's weird");
      }
      let apiCall = 'conceptRecordsFromCode';
      let codeLookupStream = new AppState.ApiStream({ apiCall, params:this.params});
      codeLookupStream.subscribe((results,stream)=>{
        if (!results.length) {
          this._status = 'failed';
        } else if (results.length === 1) {
          this._crec = results[0];
          this._validLookup = true;  // not sure....
          this._status = 'gotCrec'; // partially complete
          this.lookupField = 'concept_id';
          this.lookupVal = this.get('concept_id');
          this.params = {concept_id:this._crec.concept_id}; // apiParams
          this.fetchRelated('codeLookup got crec'); //this._crec.concept_id;
        } else {
          let cis = results.map(
            rec => new ConceptInfo({  rec, 
                                      depth: this.depth() + 1,
                                      //cb:this.sendUpdate,
                                      //inRelTo: this,
                                      role: 'inConceptSet',
                                      fetchRelated: false,
                                  }));
          this._conceptSet = new ConceptSet(
            { cis, params: this.params,
              title: `Concept code ${this.lookupVal} matches ${cis.length} concepts`,
            });
          //this._validLookup = true;
          this._status = 'complete'; // partially complete
          this.sendUpdate();
          //return conceptSet;  //   ??? maybe not a good idea, or doesn't do anything...confused
        }
      });
      return;
    } else { // lookup === concept_id
      if (!this._fetchRelated) {
        if (this._crec) {
          this._status = 'complete';
        } else {
          let apiCall = 'conceptRecord';
          let cidLookupStream = new AppState.ApiStream({ apiCall, params:this.params});
          cidLookupStream.subscribe((results,stream)=>{ // stream usually === this.stream, but this.stream could change
            if (_.isEmpty(results)) {
              this._status = 'failed';
            } else {
              this._crec = results;
              this._validLookup = true;
              this._status = 'complete';
            }
          });
        }
      } else {
        this.fetchRelated("concept lookup, don't know if got crec"); //this.lookupVal;
      }
      this.sendUpdate();
      return;
    }
    throw new Error("not sure what's up");
    //this._status = 'complete'; // getting here means not needing related and already having _crec
  }
  fetchRelated(source) {
    //console.log("in fetchRelated from", source, this._status, this._fetchRelated, this._fetchedRelated);
    if (this._fetchedRelated) debugger;
    if (!this._fetchRelated) {
      if (this._crec) {
        this._status = 'complete';
        this._validLookup = true; // should already be set?
      } else {
        throw new Error("should this happen?");
      }
      this.sendUpdate();
    } else { // supposed to fetch related
      if (!this._crec) {
        if (this.lookupField === 'concept_id') {
          this.stream = new AppState.ApiStream({ apiCall: 'conceptInfo', params:this.params});
          this.stream.subscribe((results,stream)=>{ // stream usually === this.stream, but this.stream could change
            if (_.isEmpty(results)) {
              this._status = 'failed';
            } else {
              this._crec = results.conceptRecord;
              this._ci = results;
              this._validLookup = true;
              this._status = 'complete';
              this._fetchedRelated = true;
              //console.log('fetchedRelated for ', this.get('concept_name'));
            }
            this.sendUpdate();
          });
        } else {
          throw new Error("no crec yet");
        }
      } else { // have crec
        // calling conceptInfo which will grab crec again... will ignore it i guess
        this.stream = new AppState.ApiStream({ apiCall: 'conceptInfo', params:this.params});
        this.stream.subscribe((results,stream)=>{ // stream usually === this.stream, but this.stream could change
          if (_.isEmpty(results)) {
            throw new Error("impossible!");
          } else {
            this._ci = results;
            this._validLookup = true;
            this._status = 'complete';
            this._fetchedRelated = true;
            //console.log('fetchedRelated for ', this.get('concept_name'));
          }
          this.sendUpdate();
        });
      }
    }
    return this._status;
  }
  //processRelated() { }
  getRelatedRecs(rel, dflt) { // as ConceptInfo -- right?
    //console.log(`trying to get ${rel} for ${this.get('concept_name')}: fetched: ${this._fetchedRelated}`);
    //if (junkCtr++ > 40) debugger;
    //console.log("getRelated count", junkCtr);
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
    if (field === this.lookupField && typeof this.lookupVal !== 'undefined') 
      return this.lookupVal;

    if (this.isRole('conceptAncestors') && !field.match(/^a_/))
      return this.get('a_'+field,dflt)
    if (this.isRole('conceptDescendants') && !field.match(/^d_/)) 
      return this.get('d_'+field,dflt);
    if (dflt === 'fail') throw new Error(`can't find ${field}`);
    return dflt;
  }
  want({lookupField, params, } = {}) {
    if (this.lookupField === lookupField && this.lookupVal === params[lookupField]) {
      return this;
    }
    this.done();
    return new ConceptInfo({lookupField, params, depth: this.depth() + 1, });
  }
  // status methods -- combine?
  depth() {
    return this._depth;
  }
  inRelTo() {
    return this._inRelTo;
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
  validLookup() {
    return this._validLookup;
  }
  role() {
    return this._role;
  }
  isRole(role) {
    return this._role === role;
  }
  conceptSet() {
    return this._conceptSet;
  }
  isConceptSet() {
    return !!this.conceptSet();
  }
  selfInfo(context) { // not using context
    if (this.loading()) {
      return [
        {title:'Status', className:'ci-status', value: 'Loading'},
        this.selfInfoBit(this.lookupField),
      ];
    }
    if (this.failed()) {
      let lookupInfo = this.selfInfoBit(this.lookupField);
      return [
        {title:'Status', className:'ci-status', 
          value: `No concepts matching 
                    ${lookupInfo.title} ${lookupInfo.value}`},
      ];
    }
    if (this.isConceptSet()) { // this is the main ConceptInfo, 
      let codeInfo = this.selfInfoBit('concept_code');
      return [
        {title:'Status', className:'name', 
          wholeRow: `${this.conceptSet().length} concepts matching 
                    ${codeInfo.title} ${codeInfo.value}`},
      ];
    }
    // everything else...is a regular concept? no, but for now...
    let bits = [
      {title: this.scTitle(), value: this.get('concept_name'), className: 'name', 
          //wholeRow: `${this.scTitle()} ${this.get('concept_name')}`,
          linkParams:{concept_id: this.get('concept_id')}},
      {title: this.get('vocabulary_id') + ' code', className: 'code', value: this.get('concept_code') },
      this.selfInfoBit('domain_id'),
      this.selfInfoBit('concept_class_id'),
    ];
    bits = bits.concat(
      this.get('cdmCounts').map(
        countRec => ({className:this.scClassName('S'),
                    title: `${countRec.rc} CDM records in`,
                    value: this.tblcol(countRec),
                    data: {drill:{ci:this, countRec}, drillType:'rc'},})));
    bits = bits.concat(
      this.get('cdmSrcCounts').map(
        countRec => ({className:this.scClassName('X'),
                    title: `${countRec.src} CDM source records in`,
                    value: this.tblcol(countRec),
                    data: {drill:{ci:this, countRec}, drillType:'src'},})));
    return bits;
    /*
    if (this.validLookup()) {
      return [
        {title: this.scTitle(), className: 'name', 
            wholeRow: `${this.scTitle()} ${this.get('concept_name')}`,
            linkParams:{concept_id: this.get('concept_id')}},
        {title: this.get('vocabulary_id') + ' code', className: 'code', value: this.get('concept_code') },
        this.selfInfoBit('domain_id'),
        this.selfInfoBit('concept_class_id'),
      ];
    }
    switch (this.role()) {
      case 'mapsto':
      case 'mappedfrom':
      case 'relatedConcept':
        return [      // same as this.valid() at the moment...should combine stuff
          {title: this.scTitle(), className: 'name', 
              wholeRow: `${this.scTitle()} ${this.get('concept_name')}`,
              linkParams:{concept_id: this.get('concept_id')}},
          {title: this.get('vocabulary_id') + ' code', className: 'code', value: this.get('concept_code') },
          this.selfInfoBit('domain_id'),
          this.selfInfoBit('concept_class_id'),
        ];
    }
    */
    throw new Error("what am I?");
  }
  selfInfoBit(bit, context) {
    return {title: this.fieldTitle(bit), className: this.fieldClass(bit), value: this.get(bit)};
  }
  infoBit(bit, context) {
  }
  scClassName(sc) {
    let scVal = this.scMap('className', sc);
    return scVal ? `sc-${scVal}` : 'invalid-concept';
  }
  scTitle() {
    let scVal = this.scMap('title');
    return scVal || `Can't find standard_concept`;
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
    return ({
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
              relatedConcepts: 'Related concepts (non-mapping)',
              //otherRelationship: val,
        })[field] || `no title for ${field}`;
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
  cdmCounts() {
    return this.get('rcs',[]).filter(d=>d.rc);
  }
  cdmSrcCounts() {
    return this.get('rcs',[]).filter(d=>d.src);
  }
  rc() {
    return _.sum(this.cdmCount().map(d=>d.rc));
  }
  tblcol(crec) { // old...not sure if working
    if (crec)
      return crec.tbl+':'+crec.col;
  }
}

