import _ from 'supergroup'; // in global space anyway...

export default class ConceptInfo {
  //based on data from http://localhost:3000/api/cdms/conceptInfo?cdmSchema=cdm2&concept_id=201820&resultsSchema=results2
  constructor(props) {
    this.ci = props;
    if (props.conceptRecord) {
      Object.assign(this, props.conceptRecord);
      this._valid = true;
    }
  }
  valid() {
    return this._valid;
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

