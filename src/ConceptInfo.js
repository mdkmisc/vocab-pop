import * as AppState from './AppState';
import _ from 'supergroup'; // in global space anyway...
import Rx from 'rxjs/Rx';

export default class ConceptInfo {
  //based on data from http://localhost:3000/api/cdms/conceptInfo?cdmSchema=cdm2&concept_id=201820&resultsSchema=results2
  constructor({lookupField, params, rec, cb} = {}) { // expect lookupField and params, or rec
    this._valid = false;
    this._status = 'loading';
    this.bsubj = new Rx.BehaviorSubject(this); // caller will subscribe
    this.gotResults = this.gotResults.bind(this);
    this.sendUpdate = this.sendUpdate.bind(this);
    if (cb) this.cb = cb;
    if (rec) {
      Object.assign(this, rec);
      this.lookupField = 'concept_id';
      this.lookupVal = rec.concept_id;
      this.params = {concept_id:rec.concept_id};
    } else {
      this.lookupField = lookupField;
      this.params = params;
      if (!_.has(params, lookupField)) throw new Error(`expected params[${lookupField}]`);
      this.lookupVal = params[lookupField];
    }
    this[this.lookupField] = this.lookupVal;
    this.stream = this.lookup();
    this.stream.subscribe(results=>{
      this.gotResults(results);
    });
  }
  mapsto() {
    let mt = [];
    return this.ci.relatedConcepts.filter(d=>d.relationship_id === 'Maps to');
  }
  mappedfrom() {
    let mt = [];
    return this.ci.relatedConcepts.filter(d=>d.relationship_id === 'Mapped from');
  }
  otherRels() {
    let mt = [];
    return this.ci.relatedConcepts.filter(d=>!d.relationship_id.match(/^Map/));
  }
  loaded() {
    return this._status !== 'loading' && this._status !== 'failed';
  }
  get(field) {
    if (_.has(this, field)) return this[field];
    throw new Error(`can't find ${field}`);
  }
  want({lookupField, params, } = {}) {
    if (this.lookupField === lookupField && this.lookupVal === params[lookupField]) {
      return this;
    }
    this.done();
    return new ConceptInfo({lookupField, params});
  }
  subscribe(cb) {
    this.bsubj.subscribe(cb); // get rid of old ones!
  }
  done() {
    this.stream.unsubscribe();
    this.bsubj.unsubscribe();
  }
  gotResults(results) {
    if (!results) {
      this._status = 'failed';
    } else if (Array.isArray(results)) {
      if (!results.length) {
        this._status = 'failed';
      } else {
        if (this.lookupField !== 'concept_code')
          throw new Error("shouldn't be having array results unless looking up by concept_code");
        if (results[0].concept_code !== this.lookupVal) throw new Error("impossible");
        this._status = 'multiple';
        this._multipleRecs = results;
      }
    } else {
      if (results.conceptRecord) {
        Object.assign(this, results.conceptRecord);
        this.ci = results;
        this._valid = true;
        this._status = 'success';
      }
    }
    this.sendUpdate();
  }
  sendUpdate(source) {
    //if (this.parentCi) this.parentCi.sendUpdate();
    if (this.cb) 
      this.cb('fromChild');
    //else
    this.bsubj.next(this);
  }
  lookup() {
    //const {lookupField, val} = params;
    return new AppState.ApiStream({ apiCall: 'conceptInfo', params:this.params});
  }
  valid() {
    return this._valid;
  }
  multiple() {
    return this._status === 'multiple';
  }
  multipleReady() {
    return !!(this._status === 'multiple' && this._multipleAsCis);
  }
  getMultiple() {
    if (this._status === 'multiple') return this._multipleRecs;
  }
  getMultipleAsCi() {
    if (this._status === 'multiple') return this._multipleAsCis;
  }
  resolveMultiple(max) {
    if (this._multipleAsCis && this._multipleAsCis.length === Math.min(max, this._multipleRecs.length))
      return;
    this._multipleAsCis = this._multipleRecs.slice(0,max)
          .map(rec=>new ConceptInfo({rec, cb:this.sendUpdate}))
  }
  cdmCounts() {
    return this.rcs.filter(d=>d.rc);
  }
  cdmSrcCounts() {
    return this.rcs.filter(d=>d.src);
  }
  rc() {
    return _.sum(this.rcs.map(d=>d.rc));
  }
  tblcol(crec) {
    if (crec)
      return crec.tbl+':'+crec.col;
  }
}

