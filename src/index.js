/* eslint-disable */
const DEBUG=true
import Rx from 'rxjs/Rx'
var d3 = require('d3');
var $ = require('jquery');
import _ from './supergroup'
import * as AppState from './AppState'
if (DEBUG) {
  window.Rx = Rx
  window.d3 = d3
  window.$ = $
  window._ = _
  window.AppState = AppState
}
import React, { Component } from 'react'
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'
import Routes from './App'

import configureStore from './redux/configureStore'
const {store, myrouter} = configureStore()

render(
  <Routes store={store} myrouter={myrouter}  />,
  document.getElementById('root')
)

// was trying storybook
//export default ( () => <Routes store={store} myrouter={myrouter}  />)

