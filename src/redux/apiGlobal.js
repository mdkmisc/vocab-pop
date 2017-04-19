import { createSelector } from 'reselect'

// stuff that module-specific api stuff might need
// to import. since api.js will need to import those
// modules, need to put global stuff here to prevent
// cyclical dependency


export const actionTypes = {
  API_CALL: 'API_CALL',
  API_CALL_NEW: 'API_CALL_NEW',
  API_CALL_STARTED: 'API_CALL_STARTED',
  API_CALL_FULFILLED: 'API_CALL_FULFILLED',
  API_CALL_REJECTED: 'API_CALL_REJECTED',
  CACHE_DIRTY: 'CACHE_DIRTY'
}
// selectors
const apiState = (state,props) => state.api
const containerProps = (state,props) => props
export const apiStore = createSelector(
  [apiState, containerProps],
  (apiState, containerProps) => {
    //debugger
    //console.log({msg:'temporarily', apiState, containerProps})
    return (storeName, path) => {
      //console.log('apiStore!', {apiState,containerProps,storeName,path})
      if (typeof path !== 'undefined') 
        throw new Error("not implemented yet")
      //let calls = _.filter( apiState.apiCalls, d=>d.storeName === storeName)
      //if (calls.length !== 1) throw new Error("not prepared for this")
      //if (calls.length) return calls[0].results
      let currentResults = apiState.currentResults
      let key = currentResults[storeName]
      let call = key && apiState.apiCalls[key]
      return call && call.results
    }
  }
)
