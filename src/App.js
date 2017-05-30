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


import {ApiWatch, ApiSnackbar} from 'src/api'
import config from 'src/config'
import 'src/sass/Vocab.css'
import {ConceptCodesLookupForm} from 'src/components/Lookups'
import SourceTargetSource from 'src/components/SourceTargetSource'
import _ from 'src/supergroup'
import {Tooltips, } from 'src/tooltip'
import {commify, updateReason, setToAncestorSize, getAncestorHeight, } from 'src/utils'
import VocabPop from 'src/components/VocabPop'

import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import myrouter from 'src/myrouter'

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
import {FilterForm} from 'src/components/Filters'
import Draggable from 'react-draggable'; // The default
var $ = require('jquery')
import Spinner from 'react-spinner'
//require('react-spinner/react-spinner.css')


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
import CircularProgress from 'material-ui/CircularProgress';


const routes = [
  { path: '/',
    exact: true,
    main: ()=><VocabPop/>,
  },
  { path: '/concepts',
    main: ()=><VocabPop/>,
  },
  { path: '/sourcetargetsource',
    main: () => {
      return <SourceTargetSource/>
    },
  },
  { path: '/lookup',
    main: () => <ConceptCodesLookupForm noDialog={true}/>
  },
]

// from APPBAR EXAMPLE http://www.material-ui.com/#/components/app-bar
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import Menu from 'material-ui/Menu';

import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Toggle from 'material-ui/Toggle';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import NavigationMenu from 'material-ui/svg-icons/navigation/menu';
import {Tabs, Tab} from 'material-ui/Tabs';


const styles = {
  headline: {
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 12,
    fontWeight: 400,
  },
  appBarTitle: {
    cursor: 'pointer',
  },
};
    /*
    let route = <Route path={router.history.location.path} exact={false} 
                  component={SourceTargetSource} 
                />
    //let route = <RouteWithSubRoutes component={App} {...routeDesc} />
              //<ConnectedRouter history={history}>
              //</ConnectedRouter>
    */
const defaultRoute = routes[0];


import * as cncpt from 'src/ducks/concept'
class App extends Component {
  constructor(props: any) {
    super(props);
  }
  render() {
    const {match, store, location, pathname, nav, } = this.props
    let route = _.find(routes, r=>r.path===location.pathname)
                || defaultRoute
    let sidebar = route.sidebar 
                    ? <Route {...route} component={route.sidebar} />
                    : null
    let main = <Route {...route} component={route.main} />;
                //<cncpt.ConceptStatusReport lines={ this.props.conceptStatusReport } />
    return (
      <div>

        <AppBar
          iconElementLeft={ 
            <IconMenu
              //{...props}
              iconButtonElement={
                <IconButton><NavigationMenu /></IconButton>
              }
              targetOrigin={{horizontal: 'right', vertical: 'top'}}
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
            >
              <MenuItem primaryText="config?" />
              <MenuItem primaryText="stuff?" />
            </IconMenu>
          }
          title={<span style={styles.appBarTitle}>Vocab-Viz</span>}
          onTitleTouchTap={()=>nav('/')}
        >
          <div style={{ 
                        //border: '3px solid pink', 
                        flexGrow:2
          }} >
          </div>
        </AppBar>
        <AppTabs {...{route, sidebar, main, }}/>
        <Tooltips />
      </div>
    )
    /*
    return (
              <div className="vocab-app flex-box" style={{backgroundColor: brown50}}>
                <div className="flex-content-height container" style={{width:'100%'}} >
                  <Navbar fluid={true} fixedTop={false} collapseOnSelect={true} >
                    <Navbar.Header>
                      <Navbar.Brand>
                        <NavLink to={locPath(location, '/',{clear:['domain_id']})} /*onlyActiveOnIndex* / >
                          Vocab Viz
                        </NavLink>
                      </Navbar.Brand>
                      <Navbar.Toggle />
                    </Navbar.Header>
                    <Navbar.Collapse>
                        {/*
                        <NavLink to={locPath(location, '/concepts',{params:{domain_id:'Drug'}})}>
                          <Button >Drug</Button>
                        </NavLink>
                        <NavLink to={locPath(location, '/concepts',{params:{domain_id:'Condition'}})}>
                          <Button >Condition</Button>
                        </NavLink>
                        <NavLink to={locPath(location, '/concepts',{clear:['domain_id']})}>
                          <Button >All Domains</Button>
                        </NavLink>
                        * /}
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
                        <h3>main stuff</h3>
                        <Col xs={12} md={12} className="should-be-12">
                          {main}
                        </Col>
                      </Row>
                  }
                </div>
              </div>
    )
    */
  }
}
App = connect(
  (state, props) => { // mapStateToProps
    let conceptStatusReport = cncpt.conceptStatusReport(state)
    conceptStatusReport = conceptStatusReport.concat(
      'ttips: ' + _.map(state.tooltips, (v,k) => `${k}: ${_.keys(v).length}`),
      `globalTtStore: ${_.keys(globalTtStore).length}`
    )
    return {
      conceptStatusReport,
    }
  },
  // mapDispatchToProps:
  dispatch => bindActionCreators(
    { nav,
    }, dispatch)
)(App)
export default App


class AppTabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: myrouter.getQuery('appTab'),
    };
  }

  handleChange = (value) => {
    myrouter.addParam('appTab', value)
    this.setState({
      value: value,
    });
  };

  render() {
    const {route, sidebar, main, } = this.props
    return (
      <Tabs
        value={this.state.value}
        onChange={this.handleChange}
      >
        <Tab  label="STS Report" value="ststreport"
            data-route="/sourcetargetsource"
            onActive={tab=>nav(tab.props['data-route'])} 
        >
          {main}
        </Tab>
        <Tab  label="Lookup Form" value="lookup"
            data-route="/lookup"
            onActive={tab=>nav(tab.props['data-route'])} 
        >
          {main}
        </Tab>
        {/*
        <Tab label="nothing" value="nothing">
          <CircularProgress />
          <CircularProgress color={palette.accent1Color} size={60} thickness={7} />
          <CircularProgress size={80} thickness={5} />
        </Tab>
        <Tab label="Tab A" value="a">
          <div>
            <h2 style={styles.headline}>Controllable Tab A</h2>
            <p>
              Tabs are also controllable if you want to programmatically pass them their values.
              This allows for more functionality in Tabs such as not
              having any Tab selected or assigning them different values.
            </p>
          </div>
        </Tab>
        <Tab label="Tab B" value="b">
          <div>
            <h2 style={styles.headline}>Controllable Tab B</h2>
            <p>
              This is another example of a controllable tab. Remember, if you
              use controllable Tabs, you need to give all of your tabs values or else
              you wont be able to select them.
            </p>
          </div>
        </Tab>
        */}
      </Tabs>
    );
  }
}
function nav(pathname) {
  return myrouter.setPathname(pathname)
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
