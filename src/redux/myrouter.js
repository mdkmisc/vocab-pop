import _ from '../supergroup'



import { ConnectedRouter, routerReducer, 
          routerMiddleware, push } from 'react-router-redux'
import reduxPromiseMiddleware from 'redux-promise-middleware';

import { BrowserRouter as Router, } from 'react-router-dom'
//import { browserHistory } from 'react-router';
//let router = new Router();
//let history = browserHistory;   // this is working, but going to try react-router-redux
                                // one more time
// or, since their example (https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)
// says:
// Create a history of your choosing (we're using a browser history in this case)
// maybe i can stick with browserHistory
// ...
// maybe not...but this might be a waste of time
import createHistory from 'history/createBrowserHistory'

export const history = createHistory()
//export const rrRouter

export const routeState  = (state={}, action) => {
  //console.log('routeState REDUCER', {state, action})
  switch (action.type) {
    case 'get':
      return _.get(state, action.path) // probably wrong
    default:
      return state
  }
}


export const QUERY_PARAMS = 'QUERY_PARAMS';
