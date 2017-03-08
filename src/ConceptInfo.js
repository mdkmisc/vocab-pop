
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
}

