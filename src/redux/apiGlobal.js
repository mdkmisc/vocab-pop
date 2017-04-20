import { createSelector } from 'reselect'

// stuff that module-specific api stuff might need
// to import. since api.js will need to import those
// modules, need to put global stuff here to prevent
// cyclical dependency


export const apiActions = {
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
    //console.log({msg:'temporarily', apiState, containerProps})
    return (apiName, storeId) => {
      //console.log(apiState)
      let currentResults = apiState.currentResults
      let storeKey = Apis.storeKey(apiName, storeId)
      let resultKey = currentResults[storeKey]
      let call = resultKey && apiState.apiCalls[resultKey]
      if (call)
        return call.results
      let api = Apis.get(apiName)
      return api.defaultResults()
    }
  }
)
export class Apis {
  static add(api) {
    if (Apis.apis[api.apiName])
      throw new Error("should this happen?")
    Apis.apis[api.apiName] = api
  }
  static get(apiName) {
    return Apis.apis[apiName]
  }
  static storeKey(apiName, storeId) {
    return apiName + (storeId || '')
  }
}
Apis.apis = {}
export class Api {
  constructor(props) {
    let { 
          apiName,
          reducers={},
          loader,
          defaultResults,
          paramTransform,
          selectors,
        } = props
    let existing = Apis.get(apiName)
    if (existing)
      return existing

    this.props = {  
                    apiName,
                    reducers, 
                    loader, 
                    defaultResults,
                    paramTransform,
                    selectors,
    }
    Apis.add(this)
  }
  get apiName() { return this.props.apiName }
  get paramTransform() { return this.props.paramTransform }
  get selectors() { return this.props.selectors }
  get loader() {
    let {loader, apiName} = this.props
    if (loader)
      return loader
    return  (opts={}) => {
      let {params, storeName=apiName} = opts
      //debugger
      return ({
                type: apiActions.API_CALL,
                payload: { apiName, params, storeName, },
                meta: {apiObj: this}
              })
    }
  }
  defaultResults() {
    return this.props.defaultResults
  }
}
