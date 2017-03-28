import React, { Component } from 'react';
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';



import configureStore from './stores/configureStore';
//import { BrowserRouter as Router, Route, browserHistory, IndexRoute, Link } from 'react-router-dom'
//import { syncHistoryWithStore } from 'react-router-redux';
//import routes from './routes';


import { bindActionCreators } from 'redux';
//import BEMHelper from 'react-bem-helper';
//import { deepOrange500 } from 'material-ui/styles/colors';
//import getMuiTheme from 'material-ui/styles/getMuiTheme';
//import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//import AppBar from 'material-ui/AppBar';

import { Provider } from 'react-redux';

import App, {Sidebar, ComponentWrapper} from './App';
import * as AppState from './AppState';
import config from './config';
//import { DrugContainer, Search, Home /*ConceptsContainer, Tables, */ } from './components/VocabPop';
//import './index.css';


const store = configureStore();

render(
  <App store={store}  />,
  document.getElementById('root')
);


//const history = syncHistoryWithStore(browserHistory, store);

//import { createHistory } from 'history';
//const JUNK_HISTORY_FOR_GLOBAL = useRouterHistory(createHistory)();


//AppState.initialize(history, store, JUNK_HISTORY_FOR_GLOBAL)
/*
AppState.initialize(store)
  .then(() => {
    //console.log('rendering, history in H',history);
    window.H = browserHistory;
            //<IndexRoute        components={{main:ComponentWrapper, compName:'Home',}}/>
    render((
      <Provider store={store}>
        <Router history={browserHistory}>
          <Route path={config.rootPath+'/'} >
            <App>
              <Route path="concepts" components={{main:ComponentWrapper, compName:'VocabPop', }} />
              <Route path="appstate" components={{main:AppState.AppState, sidebar:Sidebar}} />

              <Route path="conceptview" components={{main:ComponentWrapper, compName:'ConceptViewPage', }} />

              <Route path="sourcetargetsource" components={{main:ComponentWrapper, compName:'SourceTargetSource', }} />
            </App>
          </Route>
        </Router>
      </Provider>
    ), document.getElementById('root'))
  });
*/


