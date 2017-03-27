import { combineReducers } from 'redux';
//import { routerReducer } from 'react-router-redux';
import { services } from '../services/api';
import { reducer as formReducer } from 'redux-form';
import stsReducer from './sourceTargetSource';

console.log(services);
export default combineReducers({
  //routing: routerReducer,
  form: formReducer,
  stsReducer,
});
