const LOAD_1 = 'STS/LOAD_1'

const reducer = (state = {}, action) => {
  console.log('sourceTargetSource REDUCER', action);
  switch (action.type) {
    case LOAD_1:
      debugger;
      console.error("doesn't get called...i think");
      return {
        data: action.data
      }
    case 'GET_FROM_SOURCE_CODES_RECEIVED':
      return Object.assign({}, state, {recs:action.recs});
    default:
      return state
  }
}

/**
 * Simulates data loaded into this reducer from somewhere
 */
export const load = data => ({ type: LOAD_1, data })

export default reducer
