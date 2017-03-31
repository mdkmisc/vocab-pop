import { browserHistory, } from 'react-router'
import * as AppState from '../../../AppState'

/* eslint-disable */
const LOAD_1 = 'STS/LOAD_1' // junk

// actions

export function loadFromSourceCodes(values) {
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


// reducer

let someDefaultVals = {
      vocabulary_id:'ICD9CM', 
      concept_codes:'401.1%,401.2,401.3%',
    }
export default (state=someDefaultVals, action) => {
  //console.log('sourceTargetSource REDUCER', {state, action})
  switch (action.type) {
    case LOAD_1: // junk
      //debugger
      console.error("doesn't get called...i think")
      return {
        data: action.data
      }
    case 'LOAD_FROM_SOURCECODES':
      console.error("not sure", {state,action});
    case 'LOAD_FROM_SOURCECODES_PENDING':
      return Object.assign({}, state, {isPending:true})
    case 'LOAD_FROM_SOURCECODES_FULFILLED':
      let recs = action.payload
      return Object.assign({}, state, {isPending:false, recs:action.payload})
    case 'LOAD_FROM_SOURCECODES_REJECTED':
      return Object.assign({}, state, {isPending:false, error:action.payload, recs:[]})
    default:
      return state
  }
}

