import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history';
import {App} from './App';
import * as AppState from './AppState';
import {ConceptsContainer, Tables, Search} from './components/VocabPop'
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
      <IndexRoute component={AppState.AppState}/>
      <Route path="/search" component={Search} />
      <Route path="/concepts" component={ConceptsContainer} />
      <Route path="/tables" component={Tables} >
        <Route path=":table" component={Tables}/>
      </Route>
      {/*
      <Route path="/vocabs" component={Vocabularies} >
        <Route path=":vocab" component={Vocabularies}/>
      </Route>
      */}
      <Route path="/appstate" component={AppState.AppState} />
    </Route>
  </Router>
), document.getElementById('root'))

