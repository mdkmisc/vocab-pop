/* eslint-disable */
import config from '../config'
import _ from '../supergroup';
import { combineReducers } from 'redux';
import sourceTargetSource from './sourceTargetSource';
//console.error('reducers/index.js', reducer({}));

const api = (state={}, action) => {
  return state;
}

const configReducer = () => {
  return config;
}

const routeState  = (state={}, action) => {
  //console.log('routeState REDUCER', {state, action})
  switch (action.type) {
    case 'get':
      return _.get(state, action.path) // probably wrong
    default:
      return state
  }
}
var reducer = combineReducers({
  sourceTargetSource,
  api,
  config: configReducer,
  routeState
});

export default reducer
