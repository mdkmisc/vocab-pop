/* eslint-disable */
import React, { Component } from 'react'
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'
import Routes from './App'

import configureStore from './stores/configureStore'
const {store, history} = configureStore()

render(
  <Routes store={store} history={history}  />,
  document.getElementById('root')
)

