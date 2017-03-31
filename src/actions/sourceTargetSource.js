/* eslint-disable */
//import { services } from '../services/api'
import { browserHistory, } from 'react-router'
import * as AppState from '../AppState'

function loadFromSourceCodes(values) {
  let {vocabulary_id, concept_codes} = values
  //console.log("IN LOADFROMSOURCECODES", values)
  let stream = new AppState.ApiStream({
    apiCall: 'codesToSource',
    params: values,
  })
  stream.fetchPromise.catch(err => {
    console.error('sts fetch prob');
    //throw {concept_codes: "problem getting them", err}
  })
  return {
    type: 'LOAD_FROM_SOURCECODES',
    payload: {
      stream,
      promise: stream.fetchPromise
    },
  }
  //browserHistory.push({vocabulary_id, concept_codes})
  //return services.sourceTargetSource.load(values)
}

export default {
  loadFromSourceCodes,
}
