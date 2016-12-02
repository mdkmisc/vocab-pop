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

import { Route, RouteHandler, Link } from 'react-router';
import { Button, Nav, Navbar, NavDropdown, MenuItem, NavItem,
            Row, Col, Panel,
        } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

//import logo from './logo.svg';
import './App.css';
import _ from 'supergroup';
//import * as util from './ohdsi.util';

export default class App extends Component {
  render() {
    return (
      <div>
        <Navbar fluid={true} fixedTop={false}>
          <Navbar.Header>
            <Navbar.Brand>
              <NavLink to="/" onlyActiveOnIndex>
                Vocab Population Browser
              </NavLink>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav >
            <LinkContainer to="/concepts">
              <NavItem eventKey={2}>Concepts</NavItem>
            </LinkContainer>
            <NavDropdown eventKey={3} title="Domains" id="basic-nav-dropdown">
              <LinkContainer to="/domains">
                <MenuItem eventKey={3.1}>Domains</MenuItem>    
              </LinkContainer>      
            </NavDropdown>  
          </Nav>
        </Navbar>
        <Row>
          <Col md={12}>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            {this.props.children}
          </Col>
        </Row>
      </div>
    );
  }
}
/*
        <Row>
          <Col md={4} mdOffset={4} >
            <ConceptsContainer
              settings={settings}
            />
          </Col>
        </Row>
        <Row>
          <Domains
            settings={settings}
          />
        </Row>
*/
class NavLink extends Component {
  render() {
    return <Link {...this.props} activeClassName="active"/>
  }
}
