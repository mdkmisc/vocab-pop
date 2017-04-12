/* eslint-disable */
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



import React, { Component, PropTypes } from 'react'
import { connect, Provider, } from 'react-redux'
//import { ConnectedRouter, } from 'react-router-redux'

import { BrowserRouter as Router, Route, IndexRoute, Link, NavLink, } from 'react-router-dom'
//import { withRouter } from 'react-router'
import { Nav, Navbar, //Modal,
         NavItem, Button,
         Row, Col, Glyphicon,
         // NavDropdown, MenuItem, Panel, Button, 
          } from 'react-bootstrap'
//import { LinkContainer } from 'react-router-bootstrap'
import Inspector from 'react-json-inspector'
import 'react-json-inspector/json-inspector.css'
import {FilterForm} from './components/Filters'
import Draggable from 'react-draggable'; // The default
import config from './config'
import * as AppState from './AppState'
var $ = require('jquery')
import Spinner from 'react-spinner'
//require('react-spinner/react-spinner.css')
//import logo from './logo.svg'
//import './App.css'
import './stylesheets/VocabPop.css'
import _ from './supergroup'
//import * as AppState from './AppState'
//import * as util from './ohdsi.util'
import muiThemeable from 'material-ui/styles/muiThemeable';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
//import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import {
  teal500, teal700,
  greenA200,
  teal50,
  brown50,
  teal100,
  grey100, grey300, grey400, grey500,
  white, darkBlack, fullBlack,
} from 'material-ui/styles/colors';
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator';
import * as colorManipulator from 'material-ui/utils/colorManipulator';
window.colorManipulator = colorManipulator
const muiTheme = getMuiTheme({
  palette: {
    primary1Color: teal500,
    primary2Color: teal700,
    primary3Color: grey400,
    accent1Color: greenA200,
    accent2Color: grey100,
    accent3Color: grey500,
    textColor: darkBlack,
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    //disabledColor: fade(darkBlack, 0.3),
    pickerHeaderColor: teal500,
    //clockCircleColor: fade(darkBlack, 0.07),
    shadowColor: fullBlack,
  },
  appBar: {
    height: 50,
  },
});
window.muiTheme = muiTheme

// from: https://github.com/callemall/material-ui/issues/5208
import injectTapEventPlugin from 'react-tap-event-plugin';


import {commify, updateReason, setToAncestorSize, getAncestorHeight, ComponentWrapper} from './utils'
import SourceTargetSource from './components/SourceTargetSource'
import VocabPop from './components/VocabPop'
import ConceptView from './components/ConceptView'
          /* Search, DrugContainer, Tables, */

const routes = [
  { path: '/',
    exact: true,
    main: ()=><ComponentWrapper InnerComp={VocabPop} />,
  },
  { path: '/appstate',
    sidebar: Sidebar,
    main: ()=><ComponentWrapper InnerComp={AppState.AppState} />,
  },
  { path: '/conceptview',
    main: ()=><ConceptView/>,
  },
  { path: '/concepts',
    main: ()=><VocabPop/>,
  },
  { path: '/sourcetargetsource',
    main: (a,b,c,d,e,f) => {
      //console.log("did i get anything in sts main?", {a,b,c,d,e,f});
      return <SourceTargetSource/>
      return (<ComponentWrapper >
                <SourceTargetSource />
              </ComponentWrapper>)
    },
    /*
    main: ComponentWrapper,
    main: props => {
      console.error("sourcetargetsource ROUTE", props)
      return <pre>{JSON.stringify(props,null,2)}</pre>
    },
    InnerComp: SourceTargetSource,
    */
  },
]
const defaultRoute = routes[0];
class App extends Component {
  constructor(props: any) {
    // from https://github.com/callemall/material-ui/issues/5208
    injectTapEventPlugin();
    super(props);
  }
  
  render() {
    const {match, store, location, pathname, } = this.props
    let route = _.find(routes, r=>r.path===location.pathname)
                || defaultRoute
    let sidebar = route.sidebar 
                    ? <Route {...route} component={route.sidebar} />
                    : null
    let main = <Route {...route} component={route.main} />;
    /*
                  <VVAppBar />
    */
    return (
              <div className="vocab-app flex-box" style={{backgroundColor: brown50}}>
                <div className="flex-content-height container" style={{width:'100%'}} >
                  <Navbar fluid={true} fixedTop={false} collapseOnSelect={true} >
                    <Navbar.Header>
                      <Navbar.Brand>
                        <NavLink to={locPath(location, '/',{clear:['domain_id']})} /*onlyActiveOnIndex*/ >
                          Vocab Viz
                        </NavLink>
                      </Navbar.Brand>
                      <Navbar.Toggle />
                    </Navbar.Header>
                    <Navbar.Collapse>
                        <NavLink to={locPath(location, '/concepts',{params:{domain_id:'Drug'}})}>
                          <Button >Drug</Button>
                        </NavLink>
                        <NavLink to={locPath(location, '/concepts',{params:{domain_id:'Condition'}})}>
                          <Button >Condition</Button>
                        </NavLink>
                        <NavLink to={locPath(location, '/concepts',{clear:['domain_id']})}>
                          <Button >All Domains</Button>
                        </NavLink>
                        <NavLink to={locPath(location, '/conceptview',{clear:['domain_id']})}>
                          <Button >Concept View</Button>
                        </NavLink>
                        <NavLink to='/sourcetargetsource'>
                          <Button >Source-&gt;Target-&gt;Source</Button>
                        </NavLink>
                    </Navbar.Collapse>
                  </Navbar>
                </div>
                <div className="flex-remaining-height container" style={{width:'100%'}}>
                  {sidebar
                    ? <Row>
                        <h4>should have a sidebar</h4>
                        <Col xs={2} md={2} className="sidebar">
                          {sidebar}
                        </Col>
                        <Col xs={10} md={10} >
                          {main}
                        </Col>
                      </Row>
                    : <Row>
                        <Col xs={12} md={12} className="should-be-12">
                          {main}
                        </Col>
                      </Row>
                  }
                </div>
              </div>
    )
  }
}

import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import Toggle from 'material-ui/Toggle';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';

class Login extends Component {
  static muiName = 'FlatButton';

  render() {
    return (
      <FlatButton {...this.props} label="Login" />
    );
  }
}

const Logged = (props) => (
  <IconMenu
    {...props}
    iconButtonElement={
      <IconButton><MoreVertIcon /></IconButton>
    }
    targetOrigin={{horizontal: 'right', vertical: 'top'}}
    anchorOrigin={{horizontal: 'right', vertical: 'top'}}
  >
    <MenuItem primaryText="Refresh" />
    <MenuItem primaryText="Help" />
    <MenuItem primaryText="Sign out" />
  </IconMenu>
);

Logged.muiName = 'IconMenu';

/**
 * This example is taking advantage of the composability of the `AppBar`
 * to render different components depending on the application state.
 * http://www.material-ui.com/#/components/app-bar
 */
class VVAppBar extends Component {
  state = {
    logged: true,
  };

  handleChange = (event, logged) => {
    this.setState({logged: logged});
  };

  render() {
    return (
      <div>
        <Toggle
          label="Logged"
          defaultToggled={true}
          onToggle={this.handleChange}
          labelPosition="right"
          style={{margin: 20}}
        />
        <AppBar
          title="Title"
          iconElementLeft={<IconButton><NavigationClose /></IconButton>}
          iconElementRight={this.state.logged ? <Logged /> : <Login />}
        />
      </div>
    );
  }
}



    //console.log("IN APP", this.props);
const Settings = ({props}) => <h4>Settings</h4>
const History = ({props}) => <h4>History do something with this someday</h4>
const DataLoaded = ({props}) => <h4>DataLoaded</h4>
export function locPath(location, pathname, opts={}) {
  let loc = Object.assign({}, location, {pathname: `${config.rootPath}${pathname}`, })
  return loc;
}

const RouteWithSubRoutes = (route) => (
  //https://reacttraining.com/react-router/web/example/route-config
  <Route path={route.path} render={props => (
    // pass the sub-routes down to keep nesting
    <route.component {...route} {...props} routes={route.routes}/>
  )}/>
)
class Routes extends Component {
  constructor(props) {
    super(props)
    console.log(props)
  }
  render() {
    const {store, myrouter, } = this.props
    //const {main, sidebar} = this.props
    //let NavBar = DefaultNavBar
                      //<Nav > </Nav>
    /*
    let route = <Route path={router.history.location.path} exact={false} 
                  component={ComponentWrapper} compName="SourceTargetSource" 
                />
    */
    //let route = <RouteWithSubRoutes component={App} {...routeDesc} />
              //<ConnectedRouter history={history}>
              //</ConnectedRouter>
    return (
          <Provider store={store}>
            <MuiThemeProvider muiTheme={muiTheme}>
              <myrouter.MyRouter>
                <Route path='/' component={App} />
              </myrouter.MyRouter>
            </MuiThemeProvider>
          </Provider>
    )
  }
  static propTypes = {
    store: PropTypes.object.isRequired,
    myrouter: PropTypes.object.isRequired
  }
}
function mapStateToProps(state) {
  //console.log("could be mapping state to props", state);
  return { 
  }
}
function mapDispatchToProps(dispatch) {
  //console.log("could be mapping dispatch to props", dispatch);
  return { }
}
//const AppWithRouter = withRouter(Routes)
//export default AppWithRouter
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Routes)



class DraggableWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = {
                    activeDrags: 0,
                    deltaPosition: {
                      x: 0, y: 0
                    },
                }
    //console.log(this.state)
  }
  handleDrag(e, ui) {
    //console.log(this.state)
    const {x, y} = this.state.deltaPosition
    this.setState({
      deltaPosition: {
        x: x + ui.deltaX,
        y: y + ui.deltaY,
      }
    })
  }
  handleStart() {
    this.setState({activeDrags: ++this.state.activeDrags})
  }
  handleStop() {
    this.setState({activeDrags: --this.state.activeDrags})
  }

  render() {
    const {children, title, closeFunc} = this.props
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
                </Draggable>
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
    )
    */
  }
}

export class Sidebar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showModal: false,
      component: <h4>nothing loaded</h4>,
      title: 'waiting for content',
    }
  }
  closeModal() {
    this.setState({ showModal: false })
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
    })
  }
  render() {
    const {showModal, component, title} = this.state
    let content = ''
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
                </Draggable>
      content = <ModalWrapper 
                      title={title}
                      closeFunc={this.closeModal.bind(this)}>
                  {component}
                </ModalWrapper>
      */
      content = <DraggableWrapper 
                      title={title}
                      closeFunc={this.closeModal.bind(this)}>
                  {component}
                </DraggableWrapper>
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
    )
  }
  showModal(which) {
  }
}
