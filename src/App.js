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
import { Nav, Navbar, //Modal,
         NavItem, //Button,
         Row, Col, Glyphicon,
         // NavDropdown, MenuItem, Panel, Button, 
          } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
//import Inspector from 'react-json-inspector';
//import 'react-json-inspector/json-inspector.css';
import {FilterForm} from './components/Filters';
import Draggable from 'react-draggable'; // The default


//import logo from './logo.svg';
//import './App.css';
import './components/VocabPop.css';
import _ from 'supergroup';
//import * as AppState from './AppState';
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
            <LinkContainer to={locPath('/drug')}>
              <NavItem eventKey={1}>Drug</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/condition')}>
              <NavItem eventKey={1}>Condition</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/search')}>
              <NavItem eventKey={1}>Search</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/appstate')}>
              <NavItem eventKey={5}>App State</NavItem>
            </LinkContainer>
            {/*
            <LinkContainer to={locPath('/tables')}>
              <NavItem eventKey={3}>Tables</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/concepts')}>
              <NavItem eventKey={2}>Concepts</NavItem>
            </LinkContainer>
            <LinkContainer to={locPath('/vocabs')}>
              <NavItem eventKey={4}>Vocabularies</NavItem>
            </LinkContainer>
            */}
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
/*
const ModalWrapper = ({children, title, closeFunc}) => {
  return (
      <Modal bsSize="lg"
          dialogClassName="sidebar-modal"
          show={true} 
          onHide={closeFunc}
          >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {children}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={closeFunc}>Close</Button>
        </Modal.Footer>
      </Modal>
  );
};
*/
class DraggableWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
                    activeDrags: 0,
                    deltaPosition: {
                      x: 0, y: 0
                    },
                };
    //console.log(this.state);
  }
  handleDrag(e, ui) {
    //console.log(this.state);
    const {x, y} = this.state.deltaPosition;
    this.setState({
      deltaPosition: {
        x: x + ui.deltaX,
        y: y + ui.deltaY,
      }
    });
  }
  handleStart() {
    this.setState({activeDrags: ++this.state.activeDrags});
  }
  handleStop() {
    this.setState({activeDrags: --this.state.activeDrags});
  }

  render() {
    const {children, title, closeFunc} = this.props;
    return <Draggable 
                    handle=".handle"
                    defaultPosition={{x: 400, y: 200}}
                    position={null}
                    //grid={[25, 25]}
                    //zIndex={99999}
                    onStart={this.handleStart.bind(this)}
                    onDrag={this.handleDrag.bind(this)}
                    onStop={this.handleStop.bind(this)}>
                  <div className="box no-cursor">
                    <div className="cursor handle">
                      <span>
                        {title}
                      </span>
                      <span style={{float:'right', cursor:'pointer'}}>
                        <Glyphicon glyph="remove" 
                          onClick={closeFunc}
                        />
                      </span>
                    </div>
                    {children}
                  </div>
                </Draggable>;
    /*
    return (
        <Modal bsSize="lg"
            dialogClassName="sidebar-modal"
            show={true} 
            onHide={closeFunc}
            >
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {children}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={closeFunc}>Close</Button>
          </Modal.Footer>
        </Modal>
    );
    */
  }
};
const Settings = ({props}) => <h4>Settings</h4>;
const History = ({props}) => <h4>History</h4>;
const DataLoaded = ({props}) => <h4>DataLoaded</h4>;

  

export class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      component: <h4>nothing loaded</h4>,
      title: 'waiting for content',
    };
  }
  closeModal() {
    this.setState({ showModal: false });
  }
  openModal(componentName) {
    this.setState({ 
      showModal: true,
      component: ({
                    settings: <Settings/>,
                    filters: <FilterForm/>,
                    history: <History/>,
                    dataLoaded: <DataLoaded/>,
                  })[componentName],
      title: componentName,
    });
  }
  render() {
    const {showModal, component, title} = this.state;
    let content = '';
    if (showModal) {
      /*
      content = <Draggable 
                    handle=".handle"
                    defaultPosition={{x: 300, y: 0}}
                    position={null}
                    grid={[25, 25]}
                    zIndex={100}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}>
                  <div>
                    <div className="handle">{title}</div>
                      {component}
                  </div>
                </Draggable>;
      content = <ModalWrapper 
                      title={title}
                      closeFunc={this.closeModal.bind(this)}>
                  {component}
                </ModalWrapper>;
      */
      content = <DraggableWrapper 
                      title={title}
                      closeFunc={this.closeModal.bind(this)}>
                  {component}
                </DraggableWrapper>;
    }
    return (
      <div>
        {content}
        <Nav
            stacked activeKey={1} onSelect={this.openModal.bind(this)} >
            <NavItem eventKey={'settings'}>Settings</NavItem>
            <NavItem eventKey={'filters'}>Filters</NavItem>
            <NavItem eventKey={'history'}>History</NavItem>
            <NavItem eventKey={'dataLoaded'}>Data loaded</NavItem>
          {/*
          */}
        </Nav>
      </div>
    );
  }
  showModal(which) {
  }
}

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }
  /* 
  componentDidMount() {
    
    var {history} = AppState; // global history object
    this.statsByTable = AppState.statsByTable
          .subscribe(statsByTable=>this.setState({statsByTable}));
    this.tableConfig = AppState.tableConfig
          .subscribe(tableConfig=>this.setState({tableConfig}));
    this.classRelations = AppState.classRelations
          .subscribe(classRelations=>this.setState({classRelations}));
    //moving to AppState
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
          history.push({pathname: loc.pathname, query});
      }));
  }
  componentWillUnmount() {
    this.statsByTable.unsubscribe();
    this.tableConfig.unsubscribe();
    this.classRelations.unsubscribe();
    this.userSettings.unsubscribe();
  }
  */
  render() {
    const {main, sidebar} = this.props;
    let NavBar = DefaultNavBar;
    /*
    if (this.props.router.isActive('/tables'))
      NavBar = DomainNavBar 
    //else if (this.props.router.isActive('/vocabs')) NavBar = VocabNavBar 
    */
    return (
      <div className="vocab-app">
        <NavBar />
        <Row>
          <Col md={2} className="sidebar">
            {sidebar}
          </Col>
          <Col md={10} className="main-content">
            {main}
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
*/
