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
var d3 = require('d3');
var $ = require('jquery');
//if (DEBUG) window.d3 = d3;
import _ from 'supergroup'; // in global space anyway...
import ConceptData, {DataWrapper} from './ConceptData';
import {VocabMapByDomain, DomainMap} from './VocabMap';
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import SigmaReactGraph from './SigmaReactGraph';
import ConceptInfo from '../ConceptInfo';
import Spinner from 'react-spinner';
import {AgTable} from './TableStuff';
//require('react-spinner/react-spinner.css');

//import sigma from './sigmaSvgReactRenderer';
//require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
//require('sigma/plugins/sigma.layout.forceAtlas2/worker');
//import 'tipsy/src/stylesheets/tipsy.css';
//require('./stylesheets/Vocab.css');
require('./sass/Vocab.scss');
//require('tipsy/src/javascripts/jquery.tipsy');
//require('./VocabPop.css');
//import { Panel, Accordion, Label, Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, 
import {Glyphicon, Row, Col, 
          FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap';
import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper} from '../utils';

import * as AppState from '../AppState';
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
function expandSc(sc, out="title") { // out = title or className
  
  return ({
            S: {title:'Standard Concept', className: 'standard-concept'},
            C: {title:'Classification Concept', className: 'classification-concept'},
            X: {title:'Non-Standard Concept', className: 'non-standard-concept'},
      })[sc][out];
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
              {ci.ci.relatedConcepts.slice(0,4).map(d=>JSON.stringify(d,null,2))}
              {ci.ci.relatedConceptGroups.slice(0,4).map(d=>JSON.stringify(d,null,2))}
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
class ConceptDesc extends Component {
  render() {
    const {drill, drillType} = this.props;
    let ci = this.props.conceptInfo;
    let thisInfo = '', related = '';
    if (ci.valid()) {
      thisInfo =  <div>
                    <div className="sc">
                      { expandSc(ci.standard_concept, 'title') }
                    </div>
                    <Glyphicon glyph="map-marker" title="Concept (name)" />
                    <span className="name">{ci.concept_name}</span>:{' '}

                    <Glyphicon glyph="asterisk" title="Concept Class" />
                    <span className="class">{ci.concept_class_id}</span>

                    <Glyphicon glyph="globe" title="Domain" />
                    <span className="domain">{ci.domain_id}</span>.{' '}

                    <Glyphicon glyph="barcode" title="Concept Code" />
                    Code <span className="code">{ci.concept_code}</span> in

                    <Glyphicon glyph="book" title="Vocabulary" />
                    <span className="vocab">{ci.vocabulary_id}</span>
                  </div>
      related = <div>
                  <ButtonGroup>
                    {
                      ci.cdmCounts().map(crec=>
                        <HoverButton key={'rc-'+ci.tblcol(crec)}
                            data={{drill:{ci, crec}, drillType:'rc'}}  >
                          {crec.rc} CDM records in {ci.tblcol(crec)}
                        </HoverButton>)
                    }
                    {
                      ci.cdmSrcCounts().map(crec=>
                        <HoverButton key={'src-'+ci.tblcol(crec)}
                            data={{drill:{ci, crec}, drillType:'src'}}  >
                          {crec.src} CDM source records in {ci.tblcol(crec)}
                        </HoverButton>)
                    }
                  </ButtonGroup>

                  <ButtonGroup>
                    {ci.ci.relatedConceptCount 
                      ? <HoverButton data={{drill:{ci}, drillType:'related'}} >
                          {ci.ci.relatedConceptCount} Related concepts{' '}
                        </HoverButton>
                      : ''}
                    {ci.ci.conceptAncestorCount 
                      ? <HoverButton data={{drill:{ci}, drillType:'ancestors'}} >
                          {ci.ci.conceptAncestorCount} Ancestor concepts{' '}
                        </HoverButton>
                      : ''}
                    {ci.ci.conceptAncestorCount 
                      ? <HoverButton data={{drill:{ci}, drillType:'descendants'}} >
                          {ci.ci.conceptDescendant} Descendat concepts{' '}
                        </HoverButton>
                      : ''}
                  </ButtonGroup>
                </div>
    } else if (ci.multiple()) {
      thisInfo =  <div>
                    <span className="name">
                      Code {ci.get('concept_code')} matches {ci.getMultiple().length} concepts
                    </span>:{' '}
                    
                    {ci.getMultipleAsCi().map(rec=>
                      <ConceptInfoMenu key={rec.concept_id} conceptInfo={rec} />)}
                  </div>
    } else {
      return null;
    }
    return  <div className={"concept-desc " + "sc-" + ci.standard_concept}>
              {thisInfo}
              {related}
            </div>;
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
class ConceptRecord extends Component {
  render() {
    //const {node} = this.props;
    const {node, settings, eventProps, getNodeState} = this.props;
    if (!node.conceptInfo) return null;
    console.log('conceptInfo', this.props);
    const {concept_class_id, concept_code, concept_id, concept_name,
            domain_id, invalid_reason, standard_concept, 
            vocabulary_id} = node.conceptInfo;
    let className = [ "concept-record",
                      invalid_reason ? "invalid" : '',
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
    this.setState(newState);
  }
  componentWillUnmount() {
    this.unsub();
    //console.log('ConceptViewPage unmounting');
  }
  componentDidUpdate(prevProps, prevState) {
  }
  getValidationState(field) {
    const {concept_id, concept_code, conceptInfo, } = this.state;
    if (field === 'concept_id') {
      if (concept_id >= 0 && conceptInfo && concept_id === conceptInfo.concept_id) {
        return 'success';
      } else if (!concept_id) {
        return null;
      }
    } else if (field === 'concept_code') {
      if (!concept_code) {
        return null;
      } else if (!conceptInfo) {
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
        if (isNaN(concept_id)) return;
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
    const {concept_id, concept_code, conceptInfo, 
            multipleMatchingRecs, change} = this.state;
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
              <Col md={4} sm={2} >{/*className="short-input"*/}
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
              <Col md={4} sm={2}
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
