/* eslint-disable */
const LOAD_1 = 'STS/LOAD_1'

let someDefaultVals = {
      vocabulary_id:'ICD9CM', 
      concept_codes:'401.1%,401.2,401.3%',
    }
const reducer = (state=someDefaultVals, action) => {
  //console.log('sourceTargetSource REDUCER', {state, action})
  switch (action.type) {
    case LOAD_1:
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
      /*
      if (!recs || !recs.length) {
        debugger;
        throw {concept_codes: `no matching concepts found`}
      }
      */
      return Object.assign({}, state, {isPending:false, recs:action.payload})
    case 'LOAD_FROM_SOURCECODES_REJECTED':
      debugger;
      return Object.assign({}, state, {isPending:false, error:action.payload, recs:[]})
    default:
      return state
  }
}

/**
 * Simulates data loaded into this reducer from somewhere
 */
export const load = data => ({ type: LOAD_1, data })

export default reducer
