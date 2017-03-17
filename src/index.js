import React from 'react'
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import {  Router, Route, 
          //browserHistory, 
          useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history';
import {App, Sidebar, ComponentWrapper} from './App';
import * as AppState from './AppState';
import config from './config';
//import { DrugContainer, Search, Home /*ConceptsContainer, Tables, */ } from './components/VocabPop';
//import './index.css';

let history = useRouterHistory(createHistory)();

AppState.initialize(history)
  .then(() => {
    console.log('rendering, history in H',history);
    window.H = history;
    render((
      <Router history={history}>
        <Route path={config.rootPath+'/'} component={App}>
          <Route path="concepts" components={{main:ComponentWrapper, compName:'VocabPop', }} />
          <IndexRoute        components={{main:ComponentWrapper, compName:'Home',}}/>
          <Route path="appstate" components={{main:AppState.AppState, sidebar:Sidebar}} />

          <Route path="conceptview" components={{main:ComponentWrapper, compName:'ConceptViewPage', }} />

          {/*

          <Route path="concepts" components={{main:ComponentWrapper, compName:'VocabPop', sidebar:Sidebar}} />
          <IndexRoute        components={{main:ComponentWrapper, compName:'Home',          sidebar:Sidebar}}/>




          <Route path="/concepts" component={ConceptsContainer} />
          <Route path="/tables" component={Tables} >
            <Route path=":table" component={Tables}/>
          </Route>
          <Route path="/vocabs" component={Vocabularies} >
            <Route path=":vocab" component={Vocabularies}/>
          </Route>
          */}
        </Route>
      </Router>
    ), document.getElementById('root'))
  });


