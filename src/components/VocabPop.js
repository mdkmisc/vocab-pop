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
// @flow
// npm run-script flow
const DEBUG = true;
import React, { Component } from 'react';
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import SigmaReactGraph from './SigmaReactGraph';
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
//import sigma from './sigmaSvgReactRenderer';
//import { Panel, Accordion, Label, Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, }
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
var d3 = require('d3');
var $ = require('jquery');
//if (DEBUG) window.d3 = d3;
import _ from '../supergroup'; // in global space anyway...
import ConceptData, {DataWrapper} from './ConceptData';
import {VocabMapByDomain, DomainMap} from './VocabMap';
import {ConceptInfo, ConceptSetFromCode, ConceptSetFromText} from '../ConceptInfo';
import {AgTable} from './TableStuff';
//require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
//require('sigma/plugins/sigma.layout.forceAtlas2/worker');
//import 'tipsy/src/stylesheets/tipsy.css';
//require('./stylesheets/Vocab.css');
require('./sass/Vocab.css');
//require('tipsy/src/javascripts/jquery.tipsy');
//require('./VocabPop.css');
import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from '../utils';

import * as AppState from '../AppState';
import {locPath} from '../App';
//import {appData, dataToStateWhenReady, conceptStats} from '../AppData';
//require('./fileBrowser.css');


export default class VocabPop extends Component {
  render() {
    //const {filters, domain_id} = this.props;
    //console.log(this.props);
    /*
    let cols = [
        'targetorsource', 'type_concept_name', 'domain_id', 'vocabulary_id', 'concept_class_id',
        'standard_concept', 'concept_count', 'record_count', 
      ].map(c => _.find(coldefs, {colId: c}));
    */
    // all the important data fetching should be happening in ConceptData now
    if (!this.props.domain_id) {
      return  <ConceptData {...this.props}>
                <DomainMap {...this.props}/>
              </ConceptData>;
    }
    return  <ConceptData {...this.props}>
              <VocabMapByDomain {...this.props}/>
            </ConceptData>;
  }
}
class ConceptDesc extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.eventHandler = this._eventHandler.bind(this);
    this.conceptInfoUpdate = this.conceptInfoUpdate.bind(this);
  }
  _eventHandler({e, target, targetEl, listenerWrapper}) {
    if (e.type === 'mouseleave' || !target) {
      this.setState({ drill: undefined, above: undefined, below: undefined, });
      return;
    }
    let ci = _.get(target, 'props.conceptInfo');
    let bit = _.get(target, 'props.bit');
    let cdProps = _.get(target, 'props.cdProps');
    let data = _.get(target, 'props.data') || _.get(target, 'props.bit.data') ||{};
    let {drill={}, drillType, } = data;

    if (drill && drillType) {
      const {ci, countRec, } = drill;
      let below, above;
      switch (drillType) {
        case "rc":
        case "src":
          below = <CDMRecs {...{ci, countRec}} />;
          break;
        case "conceptAncestors":
          above = <RelatedConcept relationship='conceptAncestors' 
                    conceptInfo={ci} />
          break;
        default:
          below = <RelatedConcept relationship={drillType}
                    conceptInfo={ci} />
      }
      //console.log('drill', drillType, drill, countRec);
      this.setState({ drill: data, above, below, });
    }
  }
  conceptInfoUpdate(ci) {
    this.forceUpdate();
    return;
    throw new Error("what's this?");
    if (ci !== this.props.conceptInfo) throw new Error("didn't expect that");
    //console.log('got update from', ci.get('concept_name','no name yet'), ci.role());
    if (ci.isConceptSet()) {
      throw new Error("check this");
      this.setState({conceptSet: ci});
      return;
    }
  }
  componentDidMount() {
    this.props.conceptInfo.subscribe(this.conceptInfoUpdate);
  }
  render() {
    const {above, below, drill, drillType} = this.state;
    let ci = this.props.conceptInfo;
    if (ci.get('depth') > 9) return null; //throw new Error('concept too deep');
    let related = '';
    if (ci.validConceptId()) {
      let concept_id = ci.get('concept_id', 'fail');
      related = <div>
                  <ButtonGroup>
                    {ci.get('conceptAncestorCount') 
                      ? <HoverButton data={{drill:{ci}, drillType:'conceptAncestors'}} >
                          {ci.get('conceptAncestorCount')} Ancestor concepts{' '}
                        </HoverButton>
                      : ''}
                    {ci.get('conceptDescendantCount') 
                      ? <HoverButton data={{drill:{ci}, drillType:'conceptDescendants'}} >
                          {ci.get('conceptDescendantCount')} Descendant concepts{' '}
                        </HoverButton>
                      : ''}
                  </ButtonGroup>
                </div>
    }
    //console.log('rendering', ci.get('concept_name'), ci.role(), 'isConceptSet', ci.isConceptSet());
    if (ci.isConceptSet()) {
      throw new Error("shouldn't be here");
    }
    let mapsto=null, mappedfrom=null;

    let mapstoRecs = ci.getRelatedRecs('mapsto',[]);
    let mappedfromRecs = ci.getRelatedRecs('mappedfrom',[]);
    if (mapstoRecs.length && mappedfromRecs.length) throw new Error("not expecting that");

    let mainCols = 12;
    if (mapstoRecs.length) {
      mainCols = 6;
      debugger;
      mapsto =  <Col xs={6}>
                  <RelatedConcept recs={mapstoRecs} relationship='mapsto' conceptInfo={ci} />
                </Col>
    }

    if (mappedfromRecs.length) {
      mainCols = 6;
      mappedfrom =  <Col xs={6}>
                      <RelatedConcept recs={mappedfromRecs} relationship='mappedfrom' conceptInfo={ci} />
                    </Col>
    }

    console.log(ci.get('concept_code'), ci.get('status'));
    return  <ListenerWrapper wrapperTag="div" className="concept-info-menu"
                  eventsToHandle={['onMouseMove','onMouseLeave']}
                  eventHandlers={[this.eventHandler]} >
              <div className={`depth-${ci.depth()} concept-desc ${ci.scClassName()}`}>
                <p>status: {ci.get('status')} {ci.get('fetchedRelated') ? 'fetched related' : ''}</p>
                <Row className="header">
                  <Col xs={12} >
                      {ci.selfInfo('header').map(
                        (ib,i)=><InfoBit conceptInfo={ci} bit={ib} key={i}
                                        cdProps={this.props} />)}
                  </Col>
                </Row>
                <Row>
                  <Col xs={12}>
                    <Row>
                      {mappedfrom}
                      <Col xs={mainCols} className={`depth-${ci.depth()}`}>
                        {above}
                        {ci.selfInfo().map(
                          (ib,i)=><InfoBit conceptInfo={ci} bit={ib} key={i}
                                          cdProps={this.props} />)}
                        {related}
                        {below}
                      </Col>
                      {mapsto}
                    </Row>
                  </Col>
                </Row>
              </div>
            </ListenerWrapper>;
  }
}
class RelatedConcept extends Component { // stop using?
  constructor(props) {
    super(props);
    const {recs} = props;
    this.state = {recs};
  }
  componentDidMount() {
    let {recs} = this.state;
    if (!_.isEmpty(recs)) return;

    let {relationship} = this.props;
    let ci = this.props.conceptInfo;
    //if (!ci.isRole('main')) return; // probably don't want this...not sure yet
    // try this instead:
    if (ci.get('depth') > 9) return;
    recs = ci.getRelatedRecs(relationship);
    this.setState({recs});
  }

  render() {
    let {recs} = this.state;
    if (_.isEmpty(recs)) return null;
    let {relationship} = this.props;
    let ci = this.props.conceptInfo;
    //if (!ci.isRole('main')) return null;  // probably don't want this...not sure yet
    // try this instead:
    if (ci.get('depth') > 9) throw new Error('too deep');
    return  <div className={relationship}>
              <h4>{ci.fieldTitle(relationship, recs[0].get('relationship_id'))}</h4>
              {recs.map(
                (rec,i)=> <ConceptDesc key={i} conceptInfo={rec} />)}
            </div>
  }
}
class ConceptList extends Component {
  componentDidMount() {
    let cl = this.props.conceptList;
    cl.subscribe(()=>{
      console.log("concept list got update", cl);
      this.forceUpdate();
    });
  }
  render() {
    let {className} = this.props;
    let cl = this.props.conceptList;
    return  <div className={"concept-list " + className }>
              <h4>{cl.get('title')}</h4>
              {cl.items().map(
                ci=> <ConceptDesc
                        key={ci.get('concept_id')} conceptInfo={ci} />)}
            </div>;
  }
}
class InfoBit extends Component {
  render() {
    const {conceptInfo, bit, cdProps, } = this.props;
    let {title, className, value, wholeRow, linkParams, data} = bit; // an infobit should have (at least) title, className, value
    //<Glyphicon glyph="map-marker" title="Concept (name)" />&nbsp;
    let content;
    if (wholeRow) {
      content = <Row className={`${className} infobit `}>
                  <Col xs={12} >
                    {wholeRow}
                  </Col>
                </Row>
    } else {
      content = <Row className={`${className} infobit `}>
                  <Col xs={5} xsOffset={0} className="title" role="button">
                    {title}
                  </Col>
                  <Col xs={7} xsOffset={0} className="value">
                    {value}
                  </Col>
                </Row>
    }
    if (linkParams) {
      return  <ListenerTargetWrapper wrapperTag="div" wrappedComponent={this} 
                  className="click-link strong" >
                <Nav>
                  <NavItem 
                  //onClick={ ()=>AppState.saveStateN({ change:{ ...linkParams, conceptInfoUserChange:'user:concept_id' }, deepMerge: false, }) } 
                  >
                    {content}
                  </NavItem>
                </Nav>
              </ListenerTargetWrapper>
    } else if (data) { // this bit wants to send data on some mouse event
                         // can't do both links and events for now
      return  <ListenerTargetWrapper wrapperTag="div" wrappedComponent={this} 
                  className="drillable-on-hover strong" >
                {content}
              </ListenerTargetWrapper>
    }
    return content;
  }
}
class CDMRecs extends Component {
  constructor(props) {
    super(props);
    this.state = { recs: [], };
  }
  componentDidMount() {
    this.forceUpdate();
  }
  componentDidUpdate(prevProps, prevState) {
    const {ci, countRec, rowLimit=40} = this.props;
    const {tbl, col} = countRec;
    //updateReason(prevProps, prevState, this.props, this.state, 'VocabPop/CDMRecs');
      
    const oldStream = this.state.stream;
    if (oldStream && tbl === this.state.tbl && col === this.state.col)
      return;
    let params = { tbl, col, concept_id: ci.get('concept_id','fail'), };
    if (_.isNumber(rowLimit)) params.rowLimit = rowLimit;
    let stream = new AppState.ApiStream({
      apiCall: 'cdmRecs',
      params,
      //meta: { statePath },
      //transformResults,
    });
    stream.subscribe((recs,stream)=>{
      this.setState({recs});
    });
    this.setState({stream, tbl, col});
  }
  render() {
    const {recs} = this.state;
    const {ci, countRec, } = this.props;
    const {tbl, col} = countRec;
    if (!recs) {
      return <div>
                <Spinner/>
                <p>Waiting for recs from {ci.tblcol(countRec)}</p>
             </div>;
    }
      //coldefs={cols} 
    return  <AgTable data={recs}
                      width={"100%"} height={250}
                      id="cdmRecs"
            />
            /*
    <pre>
              {ci.tblcol(countRec)}:
              {recs.slice(0,4).map(d=>JSON.stringify(d,null,2))}
           </pre>;
           */
  }
}
class HoverButton extends Component {
  render() {
    let {empty} = this.props;
    if (empty) return null;
    return  <ListenerTargetWrapper wrapperTag="span" wrappedComponent={this} 
                className="hover-button" >
              <Button bsStyle="primary" bsSize="small" >
                {this.props.children}
              </Button>
            </ListenerTargetWrapper>
  }
}
/*
class ConceptRecord extends Component {
  render() {
    //const {node} = this.props;
    const {node, settings, eventProps, getNodeState} = this.props;
    let ci = node.conceptInfo;
    if (!ci) return null;
    console.log('ConceptRecord', this.props);
    const {concept_class_id, concept_code, concept_id, concept_name,
            domain_id, invalid_reason, standard_concept, 
            vocabulary_id} = node.conceptInfo;
    let className = [ "concept-record",
                      invalid_reason ? "invalid-concept" : '',
                      expandSc(standard_concept, 'className'),
                    ].join(' ');

    return  <div className={className} >
              <div className="domain">{domain_id}</div>
              <div className="class">{concept_class_id}</div>
              <div className="name">{concept_name}</div>
              <div className="vocab">{vocabulary_id}</div>
              <div className="code">{concept_code}</div>
              {this.props.children}
            </div>;
  }
}
*/
export class ConceptView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    this.forceUpdate();
  }
  componentDidUpdate(prevProps, prevState) {
    const parentClass = this.props.parentClass || "flex-remaining-height";
    //updateReason(prevProps, prevState, this.props, this.state);
    //console.log("resizing ConceptView to ", parentClass);
    setToAncestorSize(this, this.divRef, '.'+parentClass, 'VocabPop:ConceptView');
  }
  render() {
    const {concept_id, conceptInfo, } = this.props;
    const {width, height} = this.state;
    //const {height} = this.state;
    //let cr = conceptInfo && conceptInfo.conceptInfo ? <ConceptRecord conceptInfo={conceptInfo.conceptInfo} /> : '';
    let node = {id:concept_id, x:200, y:100, size: 5, label: 'no concept...'};
                  //LabelClass: ConceptRecord, 
    if (conceptInfo && conceptInfo.concept_id === concept_id) {
      node.conceptInfo = conceptInfo;
      node.label = conceptInfo.concept_name;
    }
    //console.log('ConceptView', node, width, height);
    let graphProps = {
      width, height,
      nodes: [node],
      //getHeight: (() => getAncestorHeight(this, this.divRef, ".main-content")).bind(this),
      //refFunc: (ref=>{ this.srgRef=ref; console.log('got a ref from SRG'); }).bind(this),
    };
    return  <div 
              ref={d=>this.divRef=d} className={"concept-view-graph-div"}
            ><SigmaReactGraph {...graphProps} /></div>;
    /*
    return  <div ref={d=>this.divRef=d}>
              {cr}
              <SigmaReactGraph {...graphProps} />
              <pre>
                concept_id: {concept_id} {'\n'}
                props: {_.keys(this.props).join(',')}
              </pre>
              <Inspector search={false} 
                data={ conceptInfo||{} } />
            </div>
    */
  }
}
export class ConceptViewPage extends Component {
  constructor(props) {
    super(props);
    //this.transformResults = d=>new ConceptInfo(d);
    let concept_id = AppState.getState('concept_id') || '';
    let concept_code = AppState.getState('concept_code') || '';
    let concept_text = AppState.getState('concept_text') || '';
    this.state = {concept_id, concept_code, concept_text,};
    //this.handleChange = this.handleChange.bind(this);
    this.conceptInfoUpdate = this.conceptInfoUpdate.bind(this);
    this.conceptSetUpdate = this.conceptSetUpdate.bind(this);
    this.conceptIdFetch = this.conceptIdFetch.bind(this);
    this.conceptCodeFetch = this.conceptCodeFetch.bind(this);
    this.eventHandler = this._eventHandler.bind(this);
    //if (typeof concept_id !== "string" && typeof concept_id !== "number") debugger;
    //if (typeof concept_code !== "string" && typeof concept_code !== "number") debugger;
    //this.wrapperUpdate = this._wrapperUpdate.bind(this);
  }
  _eventHandler({e, target, targetEl, listenerWrapper}) {
    if (e.type === 'click') {
      let concept_id = _.get(target, 'props.bit.data.concept_id');
      if (typeof concept_id !== 'undefined') {
        this.conceptIdFetch(concept_id);
        return;
      }
    }
    /*
    if (data) {
      const {drill={}, drillType, } = data;
      const {ci, countRec, } = drill;
      let below, above;
      switch (drillType) {
        case "rc":
        case "src":
          below = <CDMRecs {...{ci, countRec}} />;
          break;
        case "conceptAncestors":
          above = <RelatedConcept relationship='conceptAncestors' 
                    conceptInfo={ci} />
          break;
        default:
          below = <RelatedConcept relationship={drillType}
                    conceptInfo={ci} />
      }
      //console.log('drill', drillType, drill, countRec);
      this.setState({ drill: data, above, below, });
    }
    */
  }
  /*
  _wrapperUpdate(wrapperSelf) {
    const parentClass = this.props.parentClass || "flex-remaining-height";
    //console.log('new conceptInfo data', wrapperSelf.state);
    this.divRef = wrapperSelf.refs.conceptViewWrapper;
    setToAncestorSize(this, this.divRef, '.'+parentClass, false, 'VocabPop:ConceptViewPage');
    //this.props.fullyRenderedCb(true);
    //console.log("resizing ConceptViewPage to ", parentClass);
    this.setState(wrapperSelf.state); // conceptInfo
  }
  */
  componentDidMount() {
    let {concept_id, concept_code, concept_text} = this.state;
    AppState.subscribeState(null,
                            c=>{
                              /*
                              //console.log('appChange', c);
                              if (c.conceptInfoUserChange) {
                                AppState.deleteState('conceptInfoUserChange');
                                if (c.conceptInfoUserChange.match(/concept_id/)) {
                                  AppState.deleteState('conceptInfoParams.concept_code');
                                  AppState.deleteState('conceptInfoParams.concept_text');
                                  this.conceptIdFetch(c.conceptInfoParams, 'user', 'concept_id');
                                } else if (c.conceptInfoUserChange.match(/concept_code/)) {
                                  AppState.deleteState('conceptInfoParams.concept_id');
                                  AppState.deleteState('conceptInfoParams.concept_text');
                                  this.conceptCodeFetch(c.conceptInfoParams, 'user', 'concept_code');
                                } else if (c.conceptInfoUserChange.match(/concept_text/)) {
                                  AppState.deleteState('conceptInfoParams.concept_id');
                                  AppState.deleteState('conceptInfoParams.concept_code');
                                  this.conceptTextFetch(c.conceptInfoParams, 'user', 'concept_code');
                                }
                              }
                              //this.setState({change:'appState',appStateChange:c}));
                              */
                            });
    if (concept_id !== '') {
      this.conceptIdFetch(concept_id);
    } else if (concept_code !== '') {
      this.conceptCodeFetch(concept_code);
    } else if (concept_text !== '') {
      this.conceptTextFetch(concept_text);
    }
  }
  conceptInfoUpdate(ci) {
    console.log(this);
    //if (this.state.conceptInfo === ci) return;
    //this.forceUpdate();
    this.setState({conceptInfo:ci});
  }
  conceptSetUpdate(cs) {
    console.log(this);
    //if (this.state.conceptSet === cs) return;
    //this.forceUpdate();
    this.setState({conceptSet:cs},
                 function(){
                   console.log("setting conceptSet from conceptSetUpdate", this.state);
                 });
  }
  unsub() {
    const {conceptInfo} = this.state;
    conceptInfo && conceptInfo.done();
  }
  conceptIdFetch(concept_id) {
    let {conceptInfo} = this.state;
    let newState = {  //conceptInfoUserChange:'user:concept_id', 
                      concept_id, concept_code:'', conceptSet:undefined,}
    if (!conceptInfo || conceptInfo.concept_id !== concept_id) {
      conceptInfo && conceptInfo.done();
      conceptInfo = new ConceptInfo({concept_id});
      conceptInfo.subscribe(this.conceptInfoUpdate);
    }
    let appState = AppState.getState();
    let newAppState = _.merge({}, appState, newState);
    if (!_.isEqual(appState, newAppState)) {
      AppState.saveState(newState);
    }
    newState.conceptInfo = conceptInfo;
    this.setState(newState);
  }
  conceptCodeFetch(concept_code) {
    let {conceptSet} = this.state;
    let newState = {  //conceptSetUserChange:'user:concept_code', 
                      concept_code, concept_id:'', conceptInfo:undefined,}
    if (!conceptSet || conceptSet.concept_code !== concept_code) {
      conceptSet && conceptSet.done();
      conceptSet = new ConceptSetFromCode({concept_code});
      conceptSet.subscribe(this.conceptSetUpdate);
    }
    let appState = AppState.getState();
    let newAppState = _.merge({}, appState, newState);
    if (!_.isEqual(appState, newAppState)) {
      AppState.saveState(newState);
    }
    newState.conceptSet = conceptSet;
    this.setState(newState);
  }
  conceptTextFetch(concept_text) {
    console.error("not handling text input yet");
    let conceptSet = new ConceptSetFromText({concept_text});
    conceptSet.subscribe(this.conceptSetUpdate);
    this.setState({concept_text, conceptSet});
  }
  componentWillUnmount() {
    this.unsub();
    //console.log('ConceptViewPage unmounting');
  }
  componentDidUpdate(prevProps, prevState) {
    updateReason(prevProps, prevState, this.props, this.state, this);
  }
  getValidationState(field) {
    const {concept_id, concept_code, conceptInfo, } = this.state;
    if (field === 'concept_id') {
      if (!isFinite(parseInt(concept_id,10))) {
        return null;
      } else if (!conceptInfo || conceptInfo.failed()) {
        return 'error';
      } else if (conceptInfo.concept_id !== concept_id) {
        throw new Error("not sure what's up");
      } else if (conceptInfo.validConceptId()) {
        return 'success';
      }
    } else if (field === 'concept_code') {
      if (!concept_code) {
        return null;
      } else if (!conceptInfo || conceptInfo.failed()) {
        return 'error';
      } else if (conceptInfo.validConceptId()) {
        return 'success';
      } else if (conceptInfo.isConceptSet()) {
        return 'warning';
      }
    }
    //else if (concept_id === '') return 'warning';
    return 'error';
  }
  /*
  handleChange(e) {
    e.preventDefault();
    let conceptInfoParams = {};
    let change;
    if (e.target.id === 'concept_id_input') {
      let concept_id = e.target.value;
      concept_id = parseInt(concept_id,10);
      if (!_.isNumber(concept_id)) {
        AppState.deleteState('conceptInfoParams');
        return;
      }
      conceptInfoParams.concept_id = concept_id;
      change = 'user:concept_id';
    } else if (e.target.id === 'concept_code_input') {
      let concept_code = e.target.value;
      if (!concept_code.length) {
        AppState.deleteState('conceptInfoParams');
        return;
      }
      conceptInfoParams.concept_code = concept_code;
      change = 'user:concept_code';
    } else {
      throw new Error('huh?');
    }
    if (!_.isEqual(AppState.getState('conceptInfoParams'), conceptInfoParams))
      AppState.saveState({conceptInfoParams, conceptInfoUserChange:change});
  }
  */
  render() {
    const {w,h} = this.props; // from ComponentWrapper
    let {concept_id, concept_code, concept_text, conceptInfo, conceptSet, change} = this.state;
    //concept_id = conceptInfo && conceptInfo.get('concept_id', '') || '';
    //concept_code = conceptInfo && conceptInfo.get('concept_code') || '';
    //if (typeof concept_id !== "string" && typeof concept_id !== "number") debugger;
    //if (typeof concept_code !== "string" && typeof concept_code !== "number") debugger;
    let cv = 'No concept chosen';
    // do I really need a wrapper?  ... switching to state to pass data down
    if (conceptSet) {
      cv =  <div className="concept-set-container" >
              <ConceptList conceptList={conceptSet} />
            </div>
    } else if (conceptInfo) {
      cv =  <div className="concept-view-container" >
              <ConceptDesc conceptInfo={conceptInfo} />
            </div>
    }
    const conceptIdValidation = 
      () => (this.state.valid_concept_id === true && 'success') ||
            (this.state.valid_concept_id === 'loading' && 'warning') ||
            (this.state.valid_concept_id === 'false' ? 'error' : null );
    /*
    const conceptCodeValidation = 
      () => (this.state.conceptSet && this.state.conceptSet.length && 'success') ||
            (this.state.valid_concept_id === 'loading' && 'warning') ||
            'error';
    */
    return  <ListenerWrapper wrapperTag="div" className="flex=box"
                  eventsToHandle={['onClick']}
                  eventHandlers={[this.eventHandler]} >
              <Form horizontal className="flex-fixed-height-40">
                <FormGroup controlId="concept_id_input"
                        validationState={conceptIdValidation()} >
                  <Col componentClass={ControlLabel}>Concept Id</Col>
                  <Col xs={4}>
                    <FormControl type="number" step="1" value={concept_id} placeholder="Concept Id"
                      onChange={ e => {
                                e.preventDefault();
                                let concept_id = e.target.value;
                                concept_id = parseInt(concept_id,10);
                                if (!_.isNumber(concept_id)) {
                                  concept_id = null;
                                  //this.setState({concept_id, valid_concept_id: 'error', conceptInfo: undefined, });
                                  //return;
                                }
                                this.conceptIdFetch(concept_id);
                        }}
                    />
                    <FormControl.Feedback />
                    <HelpBlock>{(this.state.valid_concept_id === 'loading' && 'Loading...') ||
                                (this.state.valid_concept_id === false 
                                    && 'Invalid concept id') || ''}</HelpBlock>
                  </Col>
                </FormGroup>

                <FormGroup controlId="concept_code_input"
                        //validationState={conceptCodeValidation()} 
                  >
                  <Col componentClass={ControlLabel}>Concept Code</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={concept_code} placeholder="Concept Code"
                      onChange={
                        e => {
                                e.preventDefault();
                                let concept_code = e.target.value;
                                this.conceptCodeFetch(concept_code);
                        }}
                    />
                    <FormControl.Feedback />
                    {/*<HelpBlock>{(this.state.valid_concept_code === 'loading' && 'Loading...') ||
                                (this.state.valid_concept_code === false 
                                    && 'Invalid concept id') || ''}</HelpBlock> */}
                  </Col>
                </FormGroup>

                <FormGroup controlId="concept_text_input"
                        //validationState={conceptTextValidation()} 
                  >
                  <Col componentClass={ControlLabel}>Concept Text</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={concept_text} placeholder="Concept Text"
                      onChange={
                        e => {
                          throw new Error("not handling this yet");
                          /*
                                e.preventDefault();
                                let concept_text = e.target.value;
                                if (conceptInfo && conceptInfo.concept_text === concept_text) return;
                                AppState.saveState({conceptInfoUserChange:'user:concept_text', concept_text, });
                                this.setState({concept_text,
                                              valid_concept_text: 'loading',
                                              conceptSet: this.conceptTextFetch(concept_text)});
                          */
                        }}
                    />
                    <FormControl.Feedback />
                    {/*<HelpBlock>{(this.state.valid_concept_text === 'loading' && 'Loading...') ||
                                (this.state.valid_concept_text === false 
                                    && 'Invalid concept id') || ''}</HelpBlock> */}
                  </Col>
                </FormGroup>


              </Form>
              <Row className="flex-remaining-height">
                <Col xs={10} xsOffset={0} >
                  {cv}
                </Col>
              </Row>

            </ListenerWrapper>;
    return <div className="flex-box"> 

          </div>
  }
}
