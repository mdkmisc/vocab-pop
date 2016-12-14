/*
Copyright 2016 Sigfried Gold

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React, { Component } from 'react';

import { /*Route, RouteHandler, */ Link } from 'react-router';
import { Nav, Navbar, 
         NavItem,
         Row, Col, 
         // NavDropdown, MenuItem, Panel, Button, 
          } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

//import logo from './logo.svg';
//import './App.css';
import _ from 'supergroup';
import * as AppState from './AppState';
//import * as util from './ohdsi.util';

function locPath(pathname) {
  return Object.assign({}, location, {pathname});
}
class DefaultNavBar extends Component {
  render() {
    return (
        <Navbar fluid={true} fixedTop={false}>
          <Navbar.Header>
            <Navbar.Brand>
              <NavLink to={locPath('/')} onlyActiveOnIndex>
                Vocab Population Browser
              </NavLink>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav >
            <LinkContainer to={locPath('/search')}>
              <NavItem eventKey={1}>Search</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/concepts')}>
              <NavItem eventKey={2}>Concepts</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/tables')}>
              <NavItem eventKey={3}>Tables</NavItem>
            </LinkContainer>
            {/*
            <LinkContainer to={locPath('/vocabs')}>
              <NavItem eventKey={4}>Vocabularies</NavItem>
            </LinkContainer>
            */}
            <LinkContainer to={locPath('/appstate')}>
              <NavItem eventKey={5}>App State</NavItem>
            </LinkContainer>
          </Nav>
        </Navbar>
    );
  }
}
class DomainNavBar extends Component {
  constructor(props) {
    super(props);
    let tables = AppState.getTableConfig();
    //let {query} = props.location;
    let domainLinks = _.chain(tables)
          .toPairs()
          .filter(d=>d[1] && d[1].enabled)
          .map(d => {
            // eslint-disable-next-line
            let [tname, dconf] = d;
            return  <LinkContainer key={tname} to={`/tables/${tname}`}>
                      <NavItem eventKey={2}>{tname}</NavItem>
                    </LinkContainer>
          })
          .value();
    this.state = {
      domainLinks,
    };
  }
  render() {
    const {domainLinks} = this.state;
    return (
        <Navbar fluid={true} fixedTop={false}>
          <Navbar.Header>
            <Navbar.Brand>
              <NavLink to={locPath('/')} onlyActiveOnIndex>
                Vocab Population Browser / Tables
              </NavLink>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav >
            {domainLinks}
          </Nav>
        </Navbar>
    );
  }
}
class NavLink extends Component {
  render() {
    return <Link {...this.props} activeClassName="active"/>
  }
}
function queryParse(query) {
  let obj = {};
  _.each(query, (v,k) => {
                  obj[k] = JSON.parse(v);
                });
  return obj;
}
export class App extends Component {
  constructor(props) {
    super(props);
    if (props.router.location.search.length) {
      AppState.saveState(queryParse(props.router.location.query));
    }
  }
  componentDidMount() {
    var {history} = AppState;
    
    this.statsByTable = AppState.statsByTable
          .subscribe(statsByTable=>this.setState({statsByTable}));
    this.tableConfig = AppState.tableConfig
          .subscribe(tableConfig=>this.setState({tableConfig}));
    this.classRelations = AppState.classRelations
          .subscribe(classRelations=>this.setState({classRelations}));
    this.userSettings = AppState.userSettings.subscribe(
      (userSettings => 
       {
          var loc = history.getCurrentLocation();
          var curQuery = queryParse(loc.query);
          if (_.isEqual(userSettings, curQuery))
            return;

          var query = {};
          _.each(userSettings,
            (v,k) => {
              query[k] = JSON.stringify(v);
            });
          //setTimeout(()=>{
          history.push({pathname: loc.pathname, query});
          //}, 200);
          //this.props.router.location.query = query;
          //this.props.router.push(this.props.router.location);
          //this.props.router.push({query});
      }).bind(this));
  }
  componentWillUnmount() {
    this.statsByTable.unsubscribe();
    this.tableConfig.unsubscribe();
    this.classRelations.unsubscribe();
    this.userSettings.unsubscribe();
  }
  render() {
    console.log('App', this.state);
    let NavBar;
    if (this.props.router.isActive('/tables'))
      NavBar = DomainNavBar 
    //else if (this.props.router.isActive('/vocabs')) NavBar = VocabNavBar 
    else
      NavBar = DefaultNavBar;
    return (
      <div>
        <NavBar />
        <Row>
          <Col md={10} mdOffset={1}>
            {this.props.children}
          </Col>
        </Row>
      </div>
    );
  }
}
  /*
                    <LinkContainer 
                        to={{
                          pathname: `/tables/${tname}`,
                          //query: _.merge({}, query, {domain: tname})
                        }}
                        key={tname}
                      >
                        <MenuItem eventKey={3.1}>{tname}</MenuItem>    
                    </LinkContainer>      
  */
/*
            <NavDropdown eventKey={3} title="Tables" id="basic-nav-dropdown">
              {domainLinks}
            </NavDropdown>  
*/
/*
class VocabNavBar extends Component {
  componentDidMount() {
    dataToStateWhenReady(this, ['breakdowns']); // need breakdowns.vocabulary_id
  }
  constructor(props) {
    super(props);
    this.state = {
      breakdowns: {},
    };
  }
  shouldComponentUpdate(nextProps, nextState) {
    const oldBreakdowns = this.state.breakdowns;
    const breakdowns = nextState.breakdowns;
    return !this.state.vocabLinks;
    debugger;
    return !!(!(oldBreakdowns && oldBreakdowns.vocabulary_id) &&
         (breakdowns && breakdowns.vocabulary_id))
  }
  componentDidUpdate() {
    const vocabs = this.state.breakdowns && this.state.breakdowns.vocabulary_id;
    if (!vocabs) return;
    let vocabLinks = vocabs.map(
                      d => {
                        let vname = d.toString();
                        return  <LinkContainer key={vname} to={`/vocabs/${vname}`}>
                                  <NavItem eventKey={2}>{vname}</NavItem>
                                </LinkContainer>
                      })
    this.setState({vocabLinks});
  }
  render() {
    const {vocabLinks} = this.state;
    return (
        <Navbar fluid={true} fixedTop={false}>
          <Navbar.Header>
            <Navbar.Brand>
              <NavLink to={locPath('/')} onlyActiveOnIndex>
                Vocab Population Browser / Vocabularies
              </NavLink>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav >
            {vocabLinks}
          </Nav>
        </Navbar>
    );
  }
}
*/
