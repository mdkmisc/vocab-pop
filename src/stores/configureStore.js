import { createStore, compose, applyMiddleware } from 'redux';
//import { browserHistory } from 'react-router';
//import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import reduxPromiseMiddleware from 'redux-promise-middleware'; // for feathersjs
//import createLogger from 'redux-logger';
import { createLogger } from 'redux-logger'
import reducer from '../reducers';


// departing Pavel's framework here and following http://www.sohamkamani.com/blog/2016/06/05/redux-apis/
import {dataService} from '../services/api';



const logger = createLogger();
//const router = routerMiddleware(browserHistory);

//const appMiddleware = [thunk, router, reduxPromiseMiddleware(), logger, dataService];
const appMiddleware = [thunk, reduxPromiseMiddleware(), logger, dataService];

export default function configureStore(initialState = {}) {
  const middlewareEnhancer = applyMiddleware(...appMiddleware);
  let enhancer = middlewareEnhancer;
  
  if (window && window.__REDUX_DEVTOOLS_EXTENSION__) {
    enhancer = compose(middlewareEnhancer, window.__REDUX_DEVTOOLS_EXTENSION__());
  }

  const store = createStore(
    reducer,
    initialState,
    enhancer
  );
  return store;
}
