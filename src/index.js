import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history';
import {App, Sidebar} from './App';
import * as AppState from './AppState';
import {
          Drug, Search, Home
          /*ConceptsContainer, Tables, */
        } from './components/VocabPop'
import './index.css';


/* 
 * send all requests to index.html so browserHistory works
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
*/

AppState.history = useRouterHistory(createHistory)();

render((
  <Router history={AppState.history}>
    <Route path="/" component={App}>
      <Route path="search" components={{main:Search, sidebar:Sidebar}} />
      <Route path="drug" components={{main:Drug, sidebar:Sidebar}} />
      <Route path="appstate" components={{main:AppState.AppState, sidebar:Sidebar}} />
      <IndexRoute components={{main:Home, sidebar:Sidebar}}/>
      {/*
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

