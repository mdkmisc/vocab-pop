import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import {App, SettingsDump} from './App';
import {ConceptsContainer, Domains, Home, Vocabularies} from './components/VocabPop'
import './index.css';


/* 
 * send all requests to index.html so browserHistory works
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
*/

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Home}/>
      <Route path="/concepts" component={ConceptsContainer} />
      <Route path="/domains" component={Domains} >
        <Route path=":domain" component={Domains}/>
      </Route>
      <Route path="/vocabs" component={Vocabularies} >
        <Route path=":vocab" component={Vocabularies}/>
      </Route>
      <Route path="/settings" component={SettingsDump} />
    </Route>
  </Router>
), document.getElementById('root'))

