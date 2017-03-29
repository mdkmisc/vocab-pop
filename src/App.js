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
import VocabPop, {ConceptViewPage} from './components/VocabPop'
          /* Search, DrugContainer, Tables, */
import SourceTargetSource from './components/SourceTargetSource'
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
import {commify, updateReason, setToAncestorSize, getAncestorHeight, ComponentWrapper} from './utils'

/*
export default const App = () => {
      <Router history={history}>
        <Route path={config.rootPath+'/'} component={App}>
          <Route path="concepts" components={{main:ComponentWrapper, compName:'VocabPop', }} />
          <IndexRoute        components={{main:ComponentWrapper, compName:'Home',}}/>
          <Route path="appstate" components={{main:AppState.AppState, sidebar:Sidebar}} />
          <Route path="conceptview" components={{main:ComponentWrapper, compName:'ConceptViewPage', }} />
        </Route>
      </Router>
}
*/
const routes = [
  { path: '/',
    exact: true,
    //main: ComponentWrapper,
    //InnerComp: VocabPop,
    main: ()=><ComponentWrapper InnerComp={VocabPop} />,
  },
  { path: '/appstate',
    sidebar: Sidebar,
    //main: AppState.AppState,
    main: ()=><ComponentWrapper InnerComp={AppState.AppState} />,
  },
  { path: '/conceptview',
    main: ()=><ComponentWrapper InnerComp={ConceptViewPage} />,
    //main: ComponentWrapper,
    //InnerComp: ConceptViewPage,
  },
  { path: '/sourcetargetsource',
    main: (a,b,c,d,e,f) => {
      //console.log("did i get anything in sts main?", {a,b,c,d,e,f});
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
class App extends Component {
  render() {
    console.log("IN APP", this.props);
    const {match, store, location, pathname, } = this.props
    //const {main, sidebar} = this.props
    //let NavBar = DefaultNavBar
                      //<Nav > </Nav>
    let route = _.find(routes, r=>r.path===location.pathname);
    let sidebar = route.sidebar 
                    ? <Route {...route} component={route.sidebar} />
                    : null
    let main = <Route {...route} component={route.main} />;
    return (
              <div className="vocab-app flex-box">
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
                  <h3>the route? {location.pathname} </h3>
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
                        <h4>should not have a sidebar</h4>
                        <Col xs={12} md={12} >
                          {main}
                        </Col>
                      </Row>
                  }
                </div>
              </div>
    )
  }
  static propTypes = {
    //store: PropTypes.object.isRequired,
    //pathname: PropTypes.string.isRequired,
    //history: PropTypes.object.isRequired
  }
}
const Settings = ({props}) => <h4>Settings</h4>
const History = ({props}) => <h4>History</h4>
const DataLoaded = ({props}) => <h4>DataLoaded</h4>
export function locPath(location, pathname, opts={}) {
  let loc = Object.assign({}, location, {pathname: `${config.rootPath}${pathname}`, })
  //loc.search = '?' + AppState.myqs.stringify(search)
  //console.log("WHAT locPath RETURNS", loc);
  return loc;
  /*
  //browserHistory.push(opts, pathname)

  // not sure whether to get state from AppState.getState()
  // here. this does the same:
  let search = AppState.myqs.parse(location.search.substr(1))
  if (opts.clear) {
    opts.clear.forEach(param=>delete search[param])
  }
  if (opts.params) {
    _.each(opts.params, (v,p) => search[p] = v)
  }

  // let's try putting pathname in hash instead of pathname because prod build isn't working

  let loc = Object.assign({}, location, {pathname: config.rootPath, })
  //let loc = Object.assign({}, location, {pathname: config.rootPath, hash: pathname})
  loc.search = '?' + AppState.myqs.stringify(search)
  return loc
  */
}

const RouteWithSubRoutes = (route) => (
  //https://reacttraining.com/react-router/web/example/route-config
  <Route path={route.path} render={props => (
    // pass the sub-routes down to keep nesting
    <route.component {...route} {...props} routes={route.routes}/>
  )}/>
)
class Routes extends Component {
  render() {
    const {store, history, } = this.props
    //const {main, sidebar} = this.props
    //let NavBar = DefaultNavBar
                      //<Nav > </Nav>
    /*
    let route = <Route path={router.history.location.path} exact={false} 
                  component={ComponentWrapper} compName="SourceTargetSource" 
                />
    */
    //let route = <RouteWithSubRoutes component={App} {...routeDesc} />
    return (
          <Provider store={store}>
            <Router history={history}>
              <Route path='/' component={App} />
                {
                  /*
              <Route path={config.rootPath+'/'} >
                  routes.map((route, index) => (
                    <Route key={index} path={route.path} exact={route.exact} 
                        {...route} component={App} />
                  ))
                  <Route path="concepts" components={{main:ComponentWrapper, compName:'VocabPop', }} />
                  <IndexRoute        components={{main:ComponentWrapper, compName:'Home',}}/>
                  <Route path="appstate" components={{main:AppState.AppState, sidebar:Sidebar}} />
                  <Route path="conceptview" components={{main:ComponentWrapper, compName:'ConceptViewPage', }} />
                <App>
                  <Route path="appstate" main={AppState.AppState} sidebar={Sidebar} />
                  <Route path="appstate" main={ComponentWrapper} compName='ConceptViewPage' />
                </App>
              </Route>
                  */
                }
            </Router>
          </Provider>
    )
    /*
              <div>
                <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/about">About</Link></li>
                  <li><Link to="/topics">Topics</Link></li>
                </ul>

                <hr/>

                <Route exact path="/" component={Home}/>
                <Route path="/about" component={About}/>
                <Route path="/topics" component={Topics}/>
              </div>
    */
  }
  static propTypes = {
    store: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
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



export class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentDidMount() {
    this.stateSub = AppState.subscribeState('', state => this.setState(state))
  }
  componentWillUnmount() {
    this.stateSub.unsubscribe()
  }
  render() {
    //const {filters, domain_id} = this.props
    var conceptCount = this.state.conceptCount || 0
    //console.log(this.props)
    return  <div>
              {/*
              <div>
                <VocabPop filters={filters} domain_id={domain_id} />
              </div>
              */}
              <Inspector search={false} 
                data={ AppState.getState() } />
              <br/>
              Current concepts: { commify(conceptCount) }
            </div>
  }
}
/*
class DefaultNavBar extends Component {
  render() {
    return (
        <Navbar fluid={true} fixedTop={false} collapseOnSelect={true} >
          <Navbar.Header>
            <Navbar.Brand>
              <NavLink to={locPath('/',{clear:['domain_id']})} /*onlyActiveOnIndex* / >
                Vocab Viz
              </NavLink>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav >
              <LinkContainer to={locPath('/concepts',{params:{domain_id:'Drug'}})}>
                <NavItem eventKey={1}>Drug</NavItem>
              </LinkContainer>
              <LinkContainer to={locPath('/concepts',{params:{domain_id:'Condition'}})}>
                <NavItem eventKey={2}>Condition</NavItem>
              </LinkContainer>
              <LinkContainer to={locPath('/concepts',{clear:['domain_id']})}>
                <NavItem eventKey={3}>All Domains</NavItem>
              </LinkContainer>
              <LinkContainer to={locPath('/conceptview',{clear:['domain_id']})}>
                <NavItem eventKey={4}>Concept View</NavItem>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
    )
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
  )
}
*/
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
