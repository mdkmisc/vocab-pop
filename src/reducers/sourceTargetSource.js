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
    case 'LOAD_FROM_SOURCECODES_PENDING':
      return { isPending: true };
    case 'LOAD_FROM_SOURCE_CODES_FULFILLED':
      console.error("got recs!?", {state,action})
      return { recs: action.payload.recs }
      //return Object.assign({}, state, {recs:action.recs})
    default:
      return state
  }
}

/**
 * Simulates data loaded into this reducer from somewhere
 */
export const load = data => ({ type: LOAD_1, data })

export default reducer
