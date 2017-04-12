import _ from '../supergroup'
import React, { Component, PropTypes } from 'react'
import {  //ConnectedRouter, 
          push as reduxPush,
          routerMiddleware as reduxRouterMiddlewareCreator,
          routerReducer as reduxRouterReducer,
        } from 'react-router-redux'
import { BrowserRouter as ReactBrowserRouter, } from 'react-router-dom'
//import { browserHistory } from 'react-router'; 
////  maybe go with crowd and keep using browserHistory, only in react-router up to v3
//let history = browserHistory;   // this is working, but going to try react-router-redux
                                // one more time
//
// or, since their example (https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux)
// says:
// Create a history of your choosing (we're using a browser history in this case)
// maybe i can stick with browserHistory
// ...
// maybe not...but this might be a waste of time
import createHistory from 'history/createBrowserHistory'

const QUERY_PARAMS = 'QUERY_PARAMS';

const myhistory = createHistory()
class MyRouter extends Component {
  /*
  constructor(props) {
    super(props)
    let tempHist = createHistory()
    this.myhistory = myhistory || tempHist
  }
  */
  static history() {
    return myhistory
  }
  render() {
    let {children} = this.props
    return <ReactBrowserRouter history={this.constructor.history()}>
              {children}
           </ReactBrowserRouter>
  }
}

const routeState  = (state=myrouter.myhistory.location, action) => {
  //console.log('routeState REDUCER', {state, action})
  switch (action.type) {
    case 'get':
      debugger
      return _.get(state, action.path) // probably wrong
    case QUERY_PARAMS:
      let qp = new URLSearchParams(state.search)
      for (var p in action.payload) {
        qp.set(p, action.payload[p])
      }
      //qp = Object.assign(_.fromPairs([...qp.entries()]), action.payload)
      //qp.set('vocabulary_id', action.payload.vocabulary_id)
      //qp.set('concept_code_search_pattern', action.payload.concept_code_search_pattern)
      //let huh = reduxPush({pathname:'foo',query:{foo:'baz'}})
      myrouter.myhistory.push({search:qp+''})
      return myrouter.myhistory.location
    default:
      return state
  }
}
let reduxRouterMiddleware = reduxRouterMiddlewareCreator(myhistory)

const getQuery = () => {
  let qp = new URLSearchParams(myrouter.myhistory.location.search)
  return _.fromPairs([...qp.entries()])
}

// toss out everything and see what sticks
var myrouter = {
  getQuery,
  MyRouter,
  routeState,
  reduxRouterMiddleware,
  reduxRouterReducer,
  reduxPush,
  ReactBrowserRouter,
  myhistory,
  QUERY_PARAMS,
}
export default myrouter

