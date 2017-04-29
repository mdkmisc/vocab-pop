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


import muiThemeable from 'material-ui/styles/muiThemeable';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
//import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import {
  teal500, teal700,
  greenA200,
  teal50,
  brown50,
  teal100,
  grey100, grey300, grey400, grey500,
  white, darkBlack, fullBlack,
} from 'material-ui/styles/colors';
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator';
import * as colorManipulator from 'material-ui/utils/colorManipulator';
window.colorManipulator = colorManipulator
const muiTheme = getMuiTheme({
  palette: {
    primary1Color: teal500,
    primary2Color: teal700,
    primary3Color: grey400,
    accent1Color: greenA200,
    accent2Color: grey100,
    accent3Color: grey500,
    textColor: darkBlack,
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    //disabledColor: fade(darkBlack, 0.3),
    pickerHeaderColor: teal500,
    //clockCircleColor: fade(darkBlack, 0.07),
    shadowColor: fullBlack,
  },
  appBar: {
    height: 50,
  },
});
window.muiTheme = muiTheme

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
