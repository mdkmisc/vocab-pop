import * as AppState from './AppState';
import _ from 'supergroup'; // in global space anyway...
import Rx from 'rxjs/Rx';

export default class ConceptInfo {
  //based on data from http://localhost:3000/api/cdms/conceptInfo?cdmSchema=cdm2&concept_id=201820&resultsSchema=results2
  constructor(props) {
    const {lookupField, val} = props; // expect lookupField and val(id,code)
    this.lookupField = lookupField;
    this.apiParams = {[lookupField]:val, };
    this.val = val;
    // caller will subscribe?
    this._valid = false;
    this.bsubj = new Rx.BehaviorSubject(this);
    this.stream = this.lookup();
    this.gotResults = this.gotResults.bind(this);
    this.stream.subscribe(results=>this.gotResults(results));
    /*
    */
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
      this.status = 'failed';
    } else if (Array.isArray(results)) {
      if (!results.length) {
        this.status = 'failed';
      } else {
        if (this.lookupField !== 'concept_code')
          throw new Error("shouldn't be");
        if (results[0].concept_code !== this.val)
          throw new Error("shouldn't be");
        this.status = 'multiple';
        this.multipleRecs = results;
      }
    } else {
      if (results.conceptRecord) {
        Object.assign(this, results.conceptRecord);
        this.ci = results;
        this._valid = true;
        this.status = 'success';
      }
    }
    this.bsubj.next(this);
  }
  want(props) {
    if (this.lookupField === props.lookupField && this.val === props.val) {
      return this;
    }
    this.done();
    return new ConceptInfo(props);
    //this.lookup({lookupField, val}, false);
  }
  lookup() {
    //const {lookupField, val} = params;
    return new AppState.ApiStream({ apiCall: 'conceptInfo', params:this.apiParams});
  }
  valid() {
    return this._valid;
  }
  getMultiple(cb) {
    if (this.status === 'multiple') return this.multipleRecs;
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

