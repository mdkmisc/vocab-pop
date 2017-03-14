import * as AppState from './AppState';
import _ from 'supergroup'; // in global space anyway...
import Rx from 'rxjs/Rx';

export class ConceptSet {
  constructor({cis, params}) {
    this.cis = cis; // ConceptInfo array
    this.params = params;
  }
}
export default class ConceptInfo {
  //based on data from http://localhost:3000/api/cdms/conceptInfo?cdmSchema=cdm2&concept_id=201820&resultsSchema=results2
  constructor({ // expect lookupField and params, or rec
                lookupField, 
                params, // used in api call
                rec, // if creating from already (partially) fetched data
                fetchRelated=true, // set to false to not fetch related concepts
                                   // if false and rec not set, just fetch concept record
                cb,           // callback for when child updates (still use?)
                role='main',  // main, multiple, mapsto, etc
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
    this._relatedRecs = {};
    this.bsubj = new Rx.BehaviorSubject(this); // caller will subscribe
    this.sendUpdate = this.sendUpdate.bind(this);
    if (cb) this.cb = cb;
    if (rec) {
      this._crec = rec;
      this.lookupField = 'concept_id';
      this.lookupVal = rec.concept_id;
      this.params = {concept_id:rec.concept_id}; // apiParams
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
          this.fetchRelated('codeLookup got crec'); //this._crec.concept_id;
        } else {
          this._role = 'conceptSet';
          let conceptSet = new ConceptSet({
            cis: results.map(
                    rec => { return new ConceptInfo({
                                        rec, 
                                        depth: this._depth + 1,
                                        //cb:this.sendUpdate,
                                        inRelTo: this,
                                        role: 'multiple',
                                        fetchRelated: false,
                                    });
                    })
          });
          this._relatedRecs.multiple = conceptSet;
          //this._validLookup = true;
          this._status = 'complete'; // partially complete
        }
      });
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
    }
    this.sendUpdate();
    //throw new Error("not sure what's up");
    //this._status = 'complete'; // getting here means not needing related and already having _crec
  }
  fetchRelated(source) {
    console.log("in fetchRelated from", source, this._status, this._fetchRelated);
    if (!this._fetchRelated) {
      if (this._crec) {
        this._status = 'complete';
        this._validLookup = true; // should already be set?
      } else {
        throw new Error("should this happen?");
      }
      return;
    } else { // supposed to fetch related
      if (!this._crec) {
        throw new Error("no crec yet");
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
            }
          });
        }
      }
    }
    this.sendUpdate();
    return this._status;
  }
  want({lookupField, params, } = {}) {
    if (this.lookupField === lookupField && this.lookupVal === params[lookupField]) {
      return this;
    }
    this.done();
    return new ConceptInfo({lookupField, params});
  }
  // status methods -- combine?
  loading() {
    return this._status.match(/loading/);
  }
  loaded() {
    return this._status.match(/loading/) && this._status !== 'failed';
  }
  failed() {
    return this._status === 'failed';
  }
  validLookup() {
    return this._validLookup;
  }
  isMultiple() {
    let m = this.getRelatedRecs('multiple');
    return m && m.length;
  }
  getRelatedRecs(rel) {
    return this._relatedRecs[rel];
  }
  role() {
    return this._role;
  }
  isRole(role) {
    return this._role === role;
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
    if (this.isMultiple()) { // this is the main ConceptInfo, 
      let codeInfo = this.selfInfoBit('concept_code');
      return [
        {title:'Status', className:'name', 
          wholeRow: `${this.getMultiple().length} concepts matching 
                    ${codeInfo.title} ${codeInfo.value}`},
      ];
    }
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
    throw new Error("what am I?");
  }
  selfInfoBit(bit, context) {
    return {title: this.fieldTitle(bit), className: this.fieldClass(bit), value: this.get(bit)};
  }
  infoBit(bit, context) {
  }
  get(field, fail=false) {
    if (_.has(this._crec, field)) return this._crec[field];
    if (typeof this[field] === 'function') return this[field]();
    if (this._ci && this._ci[field]) return this._ci[field];
    if (field === this.lookupField) return this.lookupVal;
    if (fail) throw new Error(`can't find ${field}`);
  }
  scClassName() {
    let scVal = this.scMap('className');
    return scVal ? `sc-${scVal}` : 'invalid-concept';
  }
  scTitle() {
    let scVal = this.scMap('title');
    return scVal || `Can't find standard_concept`;
  }
  scMap(out, sc) { // out = title or className
    sc = sc || this.get('standard_concept', false);
    let r = ({
              S: {title:'Standard Concept', className: 'standard-concept'},
              C: {title:'Classification Concept', className: 'classification-concept'},
              X: {title:'Non-Standard Concept', className: 'non-standard-concept'},
        })[sc];
    return r && r[out];
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
              otherRelationship: val,
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
  relatedConcepts() {
    throw new Error("fix?");
    return this.validLookup() && this._ci.relatedConcepts || [];
  }
  mapsto() {
    return (this._mapsto = 
            this._mapsto ||
            this.relatedConcepts()
                .filter(rec=>rec.relationship_id === 'Maps to')
                .map(rec=>new ConceptInfo({rec, role:'mapsto',
                                          inRelTo: this,
                                    //cb:this.sendUpdate
                })));
  }
  mappedfrom() {
    return (this._mappedfrom = 
            this._mappedfrom ||
            this.relatedConcepts()
                .filter(rec=>rec.relationship_id === 'Mapped from')
                .map(rec=>new ConceptInfo({rec, role:'mappedfrom',
                                          inRelTo: this,
                                    //cb:this.sendUpdate
                })));
  }
  otherRelationship() {
    return (this._otherRelationship = 
            this._otherRelationship ||
            this.relatedConcepts()
                .filter(rec=>!_.includes(['Maps to','Mapped from'],
                                         rec.relationship_id))
                .map(rec=>new ConceptInfo({rec, role:'otherRelationship',
                                          inRelTo: this,
                                    //cb:this.sendUpdate
                })));
  }
  otherRels() {
    let mt = [];
    return this.relatedConcepts().filter(d=>!d.relationship_id.match(/^Map/));
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
    if (this._inRelTo)
      this._inRelTo.sendUpdate();
  }
  getMultiple() {
    return this.getRelatedRecs('multiple');
  }
  /*
  getMultipleAsCi() {
    if (this._status === 'multiple') return this._multipleAsCis;
  }
  */
  resolveMultiple(max) {
    throw new Error("fix");
    if (this._multipleAsCis && this._multipleAsCis.length === Math.min(max, this._multipleRecs.length))
      return;
    this._multipleAsCis = this._multipleRecs.slice(0,max)
          .map(rec=>new ConceptInfo({rec, cb:this.sendUpdate}))
  }
  cdmCounts() {
    throw new Error("fix?");
    return this.validLookup() && this._crec.rcs.filter(d=>d.rc) || [];
  }
  cdmSrcCounts() {
    throw new Error("fix?");
    return this.validLookup() && this._crec.rcs.filter(d=>d.src) || [];
  }
  rc() {
    throw new Error("fix?");
    return this.validLookup() && _.sum(this._crec.rcs.map(d=>d.rc));
  }
  tblcol(crec) { // old...not sure if working
    if (crec)
      return crec.tbl+':'+crec.col;
  }
}

