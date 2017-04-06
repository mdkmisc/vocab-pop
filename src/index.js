/* eslint-disable */
const DEBUG=true
var d3 = require('d3');
var $ = require('jquery');
if (DEBUG) {
  window.d3 = d3
  window.$ = $
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

