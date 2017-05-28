/* eslint-disable */
//console.clear() // debugger not clearing from before reload
const DEBUG=true
import Rx from 'rxjs/Rx'
var d3 = require('d3');
var $ = require('jquery');
//import _ from 'src/supergroup'
//import lodash from 'src/supergroup'; // in global space anyway...
//const lodash = require('src/supergroup')
//const _ = lodash.supergroupOpts({allowCloning:true, childProp:'foo'})
//console.log(_.supergroup([{a:2,b:2}],['a','b'])[0])
if (DEBUG) {
  window.Rx = Rx
  window.d3 = d3
  window.$ = $
  //window._ = _
}
import React, { Component } from 'react'
import { render } from 'react-dom'
import { connect, Provider, } from 'react-redux'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'
import App from 'src/App'
import configureStore from 'src/configureStore'
import { BrowserRouter as Router, Route, IndexRoute, Link, NavLink, } from 'react-router-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import muit from 'src/muitheme'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const {store, myrouter} = configureStore()
let theme = muit()()

render (
          <Provider store={store}>
            <MuiThemeProvider muiTheme={theme}>
              <myrouter.ConnectedRouter data-myrouter={myrouter} history={myrouter.history}>
                <Route path='/' component={App} />
              </myrouter.ConnectedRouter>
            </MuiThemeProvider>
          </Provider>,
          document.getElementById('root')
)
