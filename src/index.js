/* eslint-disable */
import React, { Component } from 'react'
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-theme.css'
import Routes from './App'

import configureStore from './redux/configureStore'
const {store, history} = configureStore()

export default (
  () => <Routes store={store} history={history}  />)



render(
  <Routes store={store} history={history}  />,
  document.getElementById('root')
)

