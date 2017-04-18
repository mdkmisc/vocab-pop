
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
