/* eslint-disable */
//console.clear() // debugger not clearing from before reload
const DEBUG=true
import Rx from 'rxjs/Rx'
var d3 = require('d3');
var $ = require('jquery');
import _ from './supergroup'
if (DEBUG) {
  window.Rx = Rx
  window.d3 = d3
  window.$ = $
  window._ = _
}
import React, { Component } from 'react'
import { render } from 'react-dom'
import { connect, Provider, } from 'react-redux'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'
import App from './App'
import configureStore from './redux/configureStore'
import { BrowserRouter as Router, Route, IndexRoute, Link, NavLink, } from 'react-router-dom'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import muiTheme, * as muit from './muitheme'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const {store, myrouter} = configureStore()
render (
          <Provider store={store}>
            <MuiThemeProvider muiTheme={muiTheme}>
              <myrouter.ConnectedRouter data-myrouter={myrouter} history={myrouter.history}>
                <Route path='/' component={App} />
              </myrouter.ConnectedRouter>
            </MuiThemeProvider>
          </Provider>,
          document.getElementById('root')
)
/*
render(
  <App store={store} myrouter={myrouter}  />,
  document.getElementById('root')
)
class App extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    const {store, myrouter, } = this.props
    /*  was working fine...trying ConnectedRouter
              <myrouter.MyRouter>
                <Route path='/' component={App} />
              </myrouter.MyRouter>
    * /
    return (
          <Provider store={store}>
            <MuiThemeProvider muiTheme={muiTheme}>
              <myrouter.ConnectedRouter history={myrouter.history}>
                <Route path='/' component={App} />
              </myrouter.ConnectedRouter>
            </MuiThemeProvider>
          </Provider>
    )
  }
  static propTypes = {
    store: PropTypes.object.isRequired,
    myrouter: PropTypes.object.isRequired
  }
}
function mapStateToProps(state) {
  //console.log("could be mapping state to props", state);
  return { 
  }
}
function mapDispatchToProps(dispatch) {
  //console.log("could be mapping dispatch to props", dispatch);
  return { }
}
//const AppWithRouter = withRouter(Routes)
//export default AppWithRouter
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)

*/
// was trying storybook
//export default ( () => <App store={store} myrouter={myrouter}  />)
