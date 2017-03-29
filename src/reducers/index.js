import { combineReducers } from 'redux';
import sourceTargetSource from './sourceTargetSource';
var reducer = combineReducers({
  sourceTargetSource,
});
//console.error('reducers/index.js', reducer({}));
export default reducer;
