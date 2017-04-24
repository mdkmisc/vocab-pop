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
    if (!this.props.domain_id) {
      return  <DomainMap {...this.props}/>
    }
    return  <VocabMapByDomain {...this.props}/>
  }
}
class ConceptDesc extends Component {
  constructor(props) {
    super(props);
    this.state = { drill: {}};
    this.eventHandler = this._eventHandler.bind(this);
    this.conceptInfoUpdate = this.conceptInfoUpdate.bind(this);
  }
  _eventHandler({e, target, targetEl, listenerWrapper}) {
    if (e.type === 'mouseleave' || !target) {
      this.setState({ drill: {}, drillType: undefined, });
      return;
    }
    let ci = _.get(target, 'props.conceptInfo');
    if (!ci) throw new Error("need a ci");
    let infobit = _.get(target, 'props.infobit');
    let cdProps = _.get(target, 'props.cdProps');
    let data = _.get(target, 'props.data') || _.get(target, 'props.infobit.data') ||{};
    let {drill={}, drillType, } = data;
    console.log(e.type,  drill, drillType);
    // getting pretty confused here

    let ibCollection = ci._bits; // FIX THIS!!!!
    ibCollection.currentEvent({e, target, targetEl});
// REALLY NEEDS CLEANUP
    if (drill && drillType) {
      const {ci, countRec, } = drill;
      switch (drillType) {
        case "rc":
        case "src":
          infobit.drillContent(<CDMRecs {...{ci, countRec}} />);
          break;
        case "conceptAncestors":
          infobit.drillContent(<RelatedConcept relationship='conceptAncestors' 
                    conceptInfo={ci} />);
          break;
        default:
          infobit.drillContent(<RelatedConcept relationship={drillType}
                    conceptInfo={ci} />);
      }
      //console.log('drill', drillType, drill, countRec);
      this.setState({ drill: data, });
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
    const {drill, drillType} = this.state;
    let ci = this.props.conceptInfo;
    let mainCols = 12;
    if (ci.get('depth') > 9) return null; //throw new Error('concept too deep');
    /*  NOT USING RIGHT NOW
    let related = '';
                        {related}
                        {below}
                        {above}
                      {mappedfrom}
                      {mapsto}
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
    let mapsto=null, mappedfrom=null;

    let mapstoRecs = ci.getRelatedRecs('mapsto',[]);
    let mappedfromRecs = ci.getRelatedRecs('mappedfrom',[]);
    if (mapstoRecs.length && mappedfromRecs.length) throw new Error("not expecting that");

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
    */
    //console.log(this,ci.get('concept_code'), ci.get('status'));
    return  <ListenerWrapper wrapperTag="div" className="concept-info-menu"
                  eventsToHandle={['onMouseMove','onMouseLeave']}
                  eventHandlers={[this.eventHandler]} >
              <div className={`depth-${ci.depth()} concept-desc ${ci.scClassName()}`}>
                <Row className="main-desc strong">
                  <Col xs={12} >
                      <Spinner style={{display: ci.loading() ? null : 'none'}} />
                      {ci.bits('main-desc','header')
                         .map((ib,i)=><InfoBitDisp conceptInfo={ci} infobit={ib} key={i}
                                        cdProps={this.props} />)}
                      {ci.bits('main-desc', null, d=>d.name !== 'header')
                         .map((ib,i)=><InfoBitDisp conceptInfo={ci} infobit={ib} key={i}
                                        cdProps={this.props} />)}
                      <h5>CDM Recs</h5>
                      {ci.bits(/^cdm/).map((ib,i)=><InfoBitDisp conceptInfo={ci} infobit={ib} key={i}
                                        cdProps={this.props} />)}
                  </Col>
                </Row>

                <Row>
                  <Col xs={12}>
                    <Row>
                      <Col xs={mainCols} className={`depth-${ci.depth()}`}>
                        <h5>Related Concepts</h5>
                        {ci.bits(/^rel-/).map(
                          (ib,i)=><InfoBitDisp conceptInfo={ci} infobit={ib} key={i}
                                          cdProps={this.props} />)}
                      </Col>
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
class InfoBitDisp extends Component {
  render() {
    const {conceptInfo, infobit, cdProps, } = this.props;
    let {title, className, value, wholeRow, linkParams, data} = infobit; // an infobit should have (at least) title, className, value
    //<Glyphicon glyph="map-marker" title="Concept (name)" />&nbsp;
    // CLEAN UP!!!!!!!!!!!!!!!!!!
    let drillContent = infobit.drillContent()
      ? <Row className={`${className} drill-content `} role="button">
          <Col xs={12} xsOffset={0} className="value">
            {infobit.drillContent()}
          </Col>
        </Row>
      //? 'got some recs to show'
      : '';
    let content;
    if (wholeRow) {     // not using wholeRow right now
      if (drillContent) throw new Error("put drillContent in here");
      content = <Row className={`${className} infobit `}>
                  <Col xs={12} >
                    {wholeRow}
                  </Col>
                </Row>
    } else {
      content = <div className={`${className} infobit ${drillContent ? 'strong' : ''}`} >
                  <Row role="button" >
                    <Col xs={5} xsOffset={0} className="title" >
                      {title}
                    </Col>
                    <Col xs={7} xsOffset={0} className="value">
                      {value}
                    </Col>
                  </Row>
                  {drillContent}
                </div>
    }
    if (linkParams) {
      /*
                <Nav>
                  <NavItem //onClick={ ()=>AxxppState.saveStateN({ change:{ ...linkParams, conceptInfoUserChange:'user:concept_id' }, deepMerge: false, }) } >
                  </NavItem>
                </Nav>
      */
      return  <ListenerTargetWrapper wrapperTag="div" wrappedComponent={this} 
                  className="click-link strong" >
                    {content}
              </ListenerTargetWrapper>
    } else if (data) { // this infobit wants to send data on some mouse event
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
    throw new Error("FIX")
    /*
    let stream = new AxxppState.ApiStream({
      apiCall: 'cdmRecs',
      params,
      //meta: { statePath },
      //transformResults,
    });
    stream.subscribe((recs,stream)=>{
      this.setState({recs});
    });
    this.setState({stream, tbl, col});
    */
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
