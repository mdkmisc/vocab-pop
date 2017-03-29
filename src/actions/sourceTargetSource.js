/* eslint-disable */
//import { services } from '../services/api'
import { browserHistory, } from 'react-router'
import * as AppState from '../AppState'

function loadFromSourceCodes(values) {
  let {vocabulary_id, concept_codes} = values
  console.log("IN LOADFROMSOURCECODES", values)
  let stream = new AppState.ApiStream({
    apiCall: 'codesToSource',
    params: values,
  })
  return {
    type: 'LOAD_FROM_SOURCECODES',
    payload: stream.jsonPromise,
  }
  //browserHistory.push({vocabulary_id, concept_codes})
  //return services.sourceTargetSource.load(values)
}

export default {
  loadFromSourceCodes,
}
