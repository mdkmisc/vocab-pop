import { createSelector } from 'reselect'
import _ from '../supergroup'; // lodash would be fine here

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
    return (apiName, storeName) => { // default storeId is apiName
      let apiCalls = apiState.apiCalls || {}
      let storeId = Apis.storeId(apiName,storeName)
      let storeObj = storeId && apiCalls[storeId]
      if (!storeObj)
        return
      let {type, payload, url, 
          apiObj, params, results, error, err} 
            = parseAction(storeObj)
      if (typeof results !== 'undefined')
        return results
      return apiObj.defaultResults()
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
  static storeId(apiName, storeName) {
    if (!storeName || apiName === storeName)
      return apiName
    return `${apiName}:${storeName}`
  }
}
Apis.apis = {}
export class Api {
  constructor(props) {
    let { 
          apiName,
          apiPathname,
          reducers={},
          loader,
          defaultResults,
          paramValidation,
          selectors,
        } = props
    let existing = Apis.get(apiName)
    if (existing)
      return existing

    this.props = {  
                    apiName,
                    apiPathname,
                    reducers, 
                    loader, 
                    defaultResults,
                    paramValidation,
                    selectors,
    }
    Apis.add(this)
  }
  get apiName() { return this.props.apiName }
  get apiPathname() { return this.props.apiPathname }
  get paramValidation() { return this.props.paramValidation }
  get selectors() { return this.props.selectors }
  get loader() {
    let {loader, apiName} = this.props
    if (loader) // not using yet
      return (opts)=>loader(opts)
    return  (opts={}) => {
      let {params, storeName=apiName} = opts
      //debugger
      return ({
                type: apiActions.API_CALL,
                payload: params,
                meta: {apiObj: this, storeName}
              })
    }
  }
  storeId(action) {
    let {storeId, type, payload, apiName, storeName, url, 
         apiObj, params, results, error, err} 
          = parseAction(action)
    if (storeId)
      return storeId
    return Apis.storeId(apiName, storeName)
  }
  defaultResults() {
    return this.props.defaultResults
  }
}
export const parseAction = action => {
  let {type, payload, meta={}} = action
  let {apiObj={}, storeName, url, params, results, 
        error, err, storeId} = meta
  let {apiName, apiPathname } = apiObj
  return {storeId, type, payload, apiName, apiPathname, storeName, url, 
          apiObj, params, results, error, err}
}
export const makeAction = ({action={},type,payload,meta={}}) => {
  action = {...action}
  action.type = type || action.type
  action.payload = payload || action.payload
  action.meta = _.merge({}, action.meta||{}, meta)
  if (!action.meta.storeName)
    action.meta.storeName = action.meta.apiObj.apiName
  if (!action.meta.storeId)
    action.meta.storeId = action.meta.apiObj.storeId(action)
  //console.error(action)
  return action
}
