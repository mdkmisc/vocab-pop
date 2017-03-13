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
          Nav, Navbar, NavItem, 
          FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
var d3 = require('d3');
var $ = require('jquery');
//if (DEBUG) window.d3 = d3;
import _ from 'supergroup'; // in global space anyway...
import ConceptData, {DataWrapper} from './ConceptData';
import {VocabMapByDomain, DomainMap} from './VocabMap';
import ConceptInfo from '../ConceptInfo';
import {AgTable} from './TableStuff';
//require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
//require('sigma/plugins/sigma.layout.forceAtlas2/worker');
//import 'tipsy/src/stylesheets/tipsy.css';
//require('./stylesheets/Vocab.css');
require('./sass/Vocab.scss');
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
class ConceptInfoMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.eventHandler = this._eventHandler.bind(this);
  }
  _eventHandler({e, target, targetEl, listenerWrapper}) {
    if (target && target.props && target.props.data) {
      const {drill={}, drillType, } = target.props.data;
      const {ci, crec, } = drill;
      let below, above;
      //console.log(ci, drill);
      switch (drillType) {
        case "ancestors":
          console.log('drill', drillType, drill);
          break;
        case "rc":
        case "src":
          console.log('drill', drillType, drill, );
          //below = <p>drill to {ci.tblcol(crec)}</p>;
          below = <CDMRecs {...{ci, crec}} />;
          break;
        case "related":
          below = <RelatedConcepts {...{ci, crec}} />;
          console.log('drill', drillType, drill);
          break;
      }
      this.setState({ drill: target.props.data, above, below, });
    }
  }
  render() {
    let ci = this.props.conceptInfo;
    if (!ci) return null;
    const {above, below, drill, drillType} = this.state;
                  //sendRefsToParent={getRefsFunc(this,'graphDiv')}
    return  <ListenerWrapper wrapperTag="div" className="concept-info-menu"
                  eventsToHandle={['onMouseMove']}
                  eventHandlers={[this.eventHandler]} >
              {above}
              <ConceptDesc {...this.props} drill={drill} drillType={drillType} />
              {below}
            </ListenerWrapper>;
  }
}
class ConceptDesc extends Component {
  render() {
    const {drill, drillType, context} = this.props;
    let ci = this.props.conceptInfo;
    let thisInfo = '', related = '', mapsTo = '', mappedFrom = '';
    if (ci.valid()) {
      let concept_id = ci.get('concept_id', 'fail');
      thisInfo =  <div>
                    <span className="sc">
                      { ci.scTitle() }
                    </span>&nbsp;&nbsp;

                    <Nav>
                        <NavItem 
                          onClick={
                            ()=>AppState.saveState(
                              {conceptInfoParams:{concept_id},
                                conceptInfoUserChange:'user:concept_id'})
                          }
                        >
                          <Glyphicon glyph="map-marker" title="Concept (name)" />&nbsp;
                          {ci.selfInfoBit('concept_name').value},
                          {/*ci.concept_name*/}
                        </NavItem>
                    </Nav>
                    <br/>

                    <span className="domain">
                      <Glyphicon glyph="globe" title="Domain" />&nbsp;
                      {ci.selfInfoBit('domain_id').value},
                    </span>{' '}

                    <span className="class">
                      <Glyphicon glyph="asterisk" title="Concept Class" />&nbsp;
                      {ci.get('concept_class_id','fail')}
                    </span>{' '}

                    <span className="vocab">
                      <Glyphicon glyph="book" title="Vocabulary" />&nbsp;
                      {ci.get('vocabulary_id','fail')}
                    </span>

                    <span className="code">
                      <Glyphicon glyph="barcode" title="Concept Code" />&nbsp;
                      Code {ci.get('concept_code','fail')}
                    </span>
                  </div>
      mapsTo = <MapsTo conceptInfo={ci} />;
      mappedFrom = <MappedFrom conceptInfo={ci} />;
      related = <div>
                  <ButtonGroup>
                    {
                      ci.get('cdmCounts','fail').map(crec=>
                        <HoverButton key={'rc-'+ci.tblcol(crec)}
                            data={{drill:{ci, crec}, drillType:'rc'}}  >
                          {crec.rc} CDM records in {ci.tblcol(crec)}
                        </HoverButton>)
                    }
                    {
                      ci.get('cdmSrcCounts','fail').map(crec=>
                        <HoverButton key={'src-'+ci.tblcol(crec)}
                            data={{drill:{ci, crec}, drillType:'src'}}  >
                          {crec.src} CDM source records in {ci.tblcol(crec)}
                        </HoverButton>)
                    }
                  </ButtonGroup>

                  <ButtonGroup>
                    {ci.get('relatedConceptCount','fail') 
                      ? <HoverButton data={{drill:{ci}, drillType:'related'}} >
                          {ci.get('relatedConceptCount','fail')} Related concepts{' '}
                        </HoverButton>
                      : ''}
                    {ci.conceptAncestorCount 
                      ? <HoverButton data={{drill:{ci}, drillType:'ancestors'}} >
                          {ci.get('conceptAncestorCount','fail')} Ancestor concepts{' '}
                        </HoverButton>
                      : ''}
                    {ci.conceptAncestorCount 
                      ? <HoverButton data={{drill:{ci}, drillType:'descendants'}} >
                          {ci.get('conceptDescendant','fail')} Descendant concepts{' '}
                        </HoverButton>
                      : ''}
                  </ButtonGroup>
                </div>
    } else if (ci.multiple()) {
      thisInfo =  <div>
                    <span className="name">
                      Code {ci.get('concept_code','fail')} matches {ci.getMultiple().length} concepts
                    </span>:{' '}
                    
                    {ci.getMultipleAsCi().map(rec=>
                      <ConceptInfoMenu key={rec.concept_id} conceptInfo={rec} />)}
                  </div>
    } else {
      return null;
    }
    /*
              <div className="self-info">
                {ci.selfInfo().map(ib=><InfoBit conceptInfo={ci} bit=ib context={context} />)}
              </div>
    */
    return  <div className={"concept-desc " + ci.scClassName() }>
              {thisInfo}
              <div className="mapsto">
                <MapsTo conceptInfo={ci} />
              </div>
              <div className="mappedfrom">
                <MappedFrom conceptInfo={ci} />
              </div>
              related<br/>anc/desc<br/>recs<br/>docs
              {related}
            </div>;
  }
}
class RelatedConcepts extends Component {
  constructor(props) {
    super(props);
    this.state = { recs: [], };
  }
  componentDidMount() {
    this.forceUpdate();
  }
  /*
  componentDidUpdate(prevProps, prevState) {
    const {ci, crec, rowLimit/*=40* /} = this.props;
    const {tbl, col} = crec;
    //updateReason(prevProps, prevState, this.props, this.state, 'VocabPop/CDMRecs');
      
    const oldStream = this.state.stream;
    if (oldStream && tbl === this.state.tbl && col === this.state.col)
      return;
    let params = { tbl, col, concept_id: ci.concept_id, };
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
  */
  render() {
    //const {recs} = this.state;
    const {ci, crec, rowLimit=40} = this.props;
    //const {tbl, col} = crec; {ci.tblcol(crec)}:
    return <pre>
              {ci.get('relatedConcepts','fail').slice(0,4).map(d=>JSON.stringify(d,null,2))}
              {ci.get('relatedConceptGroups','fail').slice(0,4).map(d=>JSON.stringify(d,null,2))}
           </pre>;

    /*
    if (!recs) {
      return <div>
                <Spinner/>
                <p>Waiting for recs from {ci.tblcol(crec)}</p>
             </div>;
    }
      //coldefs={cols} 
    return  <AgTable data={recs}
                      width={"100%"} height={250}
                      id="cdmRecs"
            />
            /*
    <pre>
              {ci.tblcol(crec)}:
              {recs.slice(0,4).map(d=>JSON.stringify(d,null,2))}
           </pre>;
           */
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
    const {ci, crec, rowLimit/*=40*/} = this.props;
    const {tbl, col} = crec;
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
    const {ci, crec, rowLimit=40} = this.props;
    const {tbl, col} = crec;
    if (!recs) {
      return <div>
                <Spinner/>
                <p>Waiting for recs from {ci.tblcol(crec)}</p>
             </div>;
    }
      //coldefs={cols} 
    return  <AgTable data={recs}
                      width={"100%"} height={250}
                      id="cdmRecs"
            />
            /*
    <pre>
              {ci.tblcol(crec)}:
              {recs.slice(0,4).map(d=>JSON.stringify(d,null,2))}
           </pre>;
           */
  }
}
class MapsTo extends Component {
  render() {
    let ci = this.props.conceptInfo;
    return  <ul>{ci.mapsto().map(
                  mt=><li key={mt.get('concept_id','fail')}>
                        Maps to {' '}
                          {mt.get('domain_id','fail')}{' '}
                          {mt.get('vocabulary_id','fail')} concept {' '}
                          {mt.get('concept_name','fail')}
                      </li>)}
            </ul>
  }
}
class MappedFrom extends Component {
  render() {
    let ci = this.props.conceptInfo;
    return  <ul>{ci.mappedfrom().map(
                  mf=><li key={mf.get('concept_id','fail')}>
                        Mapped from {' '}
                          {mf.get('domain_id','fail')}{' '}
                          {mf.get('vocabulary_id','fail')} concept {' '}
                          {mf.get('concept_name','fail')}
                      </li>)}
            </ul>
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
    console.log('ConceptView', node, width, height);
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
    let concept_id = AppState.getState('conceptInfoParams.concept_id') || '';
    let concept_code = AppState.getState('conceptInfoParams.concept_code') || '';
    this.state = {concept_id, concept_code};
    this.handleChange = this.handleChange.bind(this);
    this.conceptInfoUpdate = this.conceptInfoUpdate.bind(this);
    //if (typeof concept_id !== "string" && typeof concept_id !== "number") debugger;
    //if (typeof concept_code !== "string" && typeof concept_code !== "number") debugger;
    //this.wrapperUpdate = this._wrapperUpdate.bind(this);
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
    let {concept_id, concept_code} = this.state;
    AppState.subscribeState(null,
                            c=>{
                              console.log('appChange', c);
                              if (c.conceptInfoUserChange) {
                                AppState.deleteState('conceptInfoUserChange');
                                if (c.conceptInfoUserChange.match(/concept_id/)) {
                                  AppState.deleteState('conceptInfoParams.concept_code');
                                  this.getConceptInfo(c.conceptInfoParams, 'user', 'concept_id');
                                } else if (c.conceptInfoUserChange.match(/concept_code/)) {
                                  AppState.deleteState('conceptInfoParams.concept_id');
                                  this.getConceptInfo(c.conceptInfoParams, 'user', 'concept_code');
                                }
                              }
                              //this.setState({change:'appState',appStateChange:c}));
                            });
    if (concept_id !== '') {
      this.getConceptInfo({concept_id}, 'init', 'concept_id');
    } else if (concept_code !== '') {
      this.getConceptInfo({concept_code}, 'init', 'concept_code');
    }
    //if (typeof concept_id !== "string" && typeof concept_id !== "number") debugger;
    //if (typeof concept_code !== "string" && typeof concept_code !== "number") debugger;
  }
  conceptInfoUpdate(conceptInfo) {
    if (conceptInfo.valid()) {
      this.setState({ concept_id: conceptInfo.concept_id,
                      concept_code: conceptInfo.concept_code});
    } else if (conceptInfo.multiple()) {
      conceptInfo.resolveMultiple(4);
      this.forceUpdate();
    } else {
      this.forceUpdate();
    }
    /*
    else if (conceptInfo.status === 'multiple') {
      this.setState({ multipleMatchingRecs: concept_code: conceptInfo.concept_code});
    } else {
    }
    */
  }
  unsub() {
    const {conceptInfo} = this.state;
    conceptInfo && conceptInfo.done();
  }
  getConceptInfo(params, source, lookupField) {
    //console.log('getConceptInfo', loadChange, params);
    let {concept_id, concept_code, conceptInfo, 
          multipleMatchingRecs, } = this.state;
    //this.unsub();
    let newState = Object.assign( {}, this.state, 
        { concept_id:'', concept_code:'', },
          params, 
          {change: `${source} triggered getConceptInfo:${lookupField}:${params[lookupField]}`});

    conceptInfo = conceptInfo 
          ? conceptInfo.want({lookupField, params})
          : new ConceptInfo({lookupField, params});

    conceptInfo.subscribe(this.conceptInfoUpdate);
    newState.conceptInfo = conceptInfo;
    if (conceptInfo.valid()) {
      newState.concept_id = conceptInfo.concept_id;
      newState.concept_code = conceptInfo.concept_code;
    }
    if (typeof newState.concept_id !== "string" && typeof newState.concept_id !== "number") debugger;
    if (typeof newState.concept_code !== "string" && typeof newState.concept_code !== "number") debugger;
    this.setState(newState);
  }
  componentWillUnmount() {
    this.unsub();
    //console.log('ConceptViewPage unmounting');
  }
  componentDidUpdate(prevProps, prevState) {
    const {concept_id, concept_code} = this.state;
    //if (typeof concept_id !== "string" && typeof concept_id !== "number") debugger;
    //if (typeof concept_code !== "string" && typeof concept_code !== "number") debugger;
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
      } else if (conceptInfo.valid()) {
        return 'success';
      }
    } else if (field === 'concept_code') {
      if (!concept_code) {
        return null;
      } else if (!conceptInfo || conceptInfo.failed()) {
        return 'error';
      } else if (conceptInfo.valid()) {
        return 'success';
      } else if (conceptInfo.multiple()) {
        return 'warning';
      }
    }
    //else if (concept_id === '') return 'warning';
    return 'error';
  }
  handleChange(e) {
    e.preventDefault();
    let conceptInfoParams = {};
    let change;
    if (e.target.id === 'concept_id_input') {
      let concept_id = e.target.value;
      if (concept_id.length) {
        concept_id = parseInt(concept_id,10);
        if (!isFinite(concept_id)) return;
      }
      //this.getConceptInfo({concept_id}, 'user:concept_id');
      conceptInfoParams.concept_id = concept_id;
      change = 'user:concept_id';
    } else if (e.target.id === 'concept_code_input') {
      let concept_code = e.target.value;
      if (concept_code.length) {
        //this.getConceptInfo({concept_code}, 'user:concept_code');
        conceptInfoParams.concept_code = concept_code;
        change = 'user:concept_code';
      }
    } else {
      throw new Error('huh?');
    }
    //this.getConceptInfo(params, change);
    AppState.saveState({conceptInfoParams, conceptInfoUserChange:change});
  }
  render() {
    const {w,h} = this.props; // from ComponentWrapper
    let {concept_id, concept_code, conceptInfo, 
            multipleMatchingRecs, change} = this.state;
    concept_id = conceptInfo && conceptInfo.get('concept_id') || '';
    concept_code = conceptInfo && conceptInfo.get('concept_code') || '';
    //if (typeof concept_id !== "string" && typeof concept_id !== "number") debugger;
    //if (typeof concept_code !== "string" && typeof concept_code !== "number") debugger;
    let cv = 'No concept chosen';
    // do I really need a wrapper?  ... switching to state to pass data down
    if (!conceptInfo) {

    } else if (conceptInfo.loaded()) {
      cv =  <div className="concept-view-container" >
              <ConceptInfoMenu conceptInfo={conceptInfo} />
            </div>
    }
    /*
    else if (conceptInfo.multiple()) {
      cv =  <div className="concept-view-multiple" >
              <ConceptInfoMenu conceptInfo={conceptInfo} />
              {conceptInfo.getMultipleAsCi().map(rec=>
                <ConceptInfoMenu key={rec.concept_id} conceptInfo={rec} />)}
            </div>
    }
    */
    return <div className="flex-box"> 
            <Row className="flex-fixed-height-40">
              <Col md={5} sm={5} >{/*className="short-input"*/}
                <FormGroup
                  controlId="concept_id_input"
                  validationState={this.getValidationState('concept_id')}
                >
                  <ControlLabel>Concept Id</ControlLabel>
                  <FormControl
                    type="number" step="1"
                    value={concept_id}
                    placeholder="Concept Id"
                    //inputRef={d=>this.cidInput=d}
                    onChange={this.handleChange}
                  />
                  <FormControl.Feedback />
                  <HelpBlock>{this.getValidationState('concept_id') === 'error'
                                && 'Invalid concept id'}</HelpBlock>
                </FormGroup>
              </Col>
              <Col md={5} sm={5}
                    mdOffset={1} smOffset={1}>
                <FormGroup
                  controlId="concept_code_input"
                  validationState={this.getValidationState('concept_code')}
                >
                  <ControlLabel>Concept Code</ControlLabel>
                  <FormControl
                    type="string" step="1"
                    value={concept_code}
                    placeholder="Concept Code"
                    //inputRef={d=>this.codeInput=d}
                    onChange={this.handleChange}
                  />
                  <FormControl.Feedback />
                  <HelpBlock>{this.getValidationState('concept_code') === 'error'
                                && 'Invalid concept code'}</HelpBlock>
                </FormGroup>
              </Col>
            </Row>
            <Row className="flex-remaining-height">
              <Col md={10} sm={10} mdOffset={0} smOffset={0}>
                {cv}
              </Col>
            </Row>
          </div>
  }
}
