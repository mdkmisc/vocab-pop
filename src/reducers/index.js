import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { services } from '../services/api';

console.log(services);
export default combineReducers({
  routing: routerReducer,
	sourceTargetSource: services.sourceTargetSource.reducer,
});
