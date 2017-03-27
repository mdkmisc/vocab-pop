import React, { Component } from 'react';
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';



import configureStore from './stores/configureStore';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
//import routes from './routes';


import { bindActionCreators } from 'redux';
//import BEMHelper from 'react-bem-helper';
//import { deepOrange500 } from 'material-ui/styles/colors';
//import getMuiTheme from 'material-ui/styles/getMuiTheme';
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import AppBar from 'material-ui/AppBar';

import { Provider } from 'react-redux';

import {  Router, Route, 
          //browserHistory, 
          useRouterHistory, IndexRoute } from 'react-router'
import App, {Sidebar, ComponentWrapper} from './App';
import * as AppState from './AppState';
import config from './config';
//import { DrugContainer, Search, Home /*ConceptsContainer, Tables, */ } from './components/VocabPop';
//import './index.css';


const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);

import { createHistory } from 'history';
const JUNK_HISTORY_FOR_GLOBAL = useRouterHistory(createHistory)();


AppState.initialize(history, store, JUNK_HISTORY_FOR_GLOBAL)
  .then(() => {
    console.log('rendering, history in H',history);
    window.H = history;
    render((
      <Provider store={store}>
        <Router history={history}>
          <Route path={config.rootPath+'/'} component={App}>
            <Route path="concepts" components={{main:ComponentWrapper, compName:'VocabPop', }} />
            <IndexRoute        components={{main:ComponentWrapper, compName:'Home',}}/>
            <Route path="appstate" components={{main:AppState.AppState, sidebar:Sidebar}} />

            <Route path="conceptview" components={{main:ComponentWrapper, compName:'ConceptViewPage', }} />

            <Route path="sourcetargetsource" components={{main:ComponentWrapper, compName:'SourceTargetSource', }} />
          </Route>
        </Router>
      </Provider>
    ), document.getElementById('root'))
  });


