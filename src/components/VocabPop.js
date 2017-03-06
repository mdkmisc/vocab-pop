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
var d3 = require('d3');
var $ = require('jquery');
import * as util from '../utils';
//if (DEBUG) window.d3 = d3;
if (DEBUG) window.util = util;
import _ from 'supergroup'; // in global space anyway...
import ConceptData, {DataWrapper} from './ConceptData';
import {VocabMapByDomain, DomainMap} from './VocabMap';
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import SigmaReactGraph, { ListenerTarget, ForeignObject, ListenerNode } from './SigmaReactGraph';
import {setToAncestorSize, getAncestorSize} from '../App';

//import sigma from './sigmaSvgReactRenderer';
//require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
//require('sigma/plugins/sigma.layout.forceAtlas2/worker');
//import 'tipsy/src/stylesheets/tipsy.css';
//require('./stylesheets/Vocab.css');
require('./sass/Vocab.scss');
//require('tipsy/src/javascripts/jquery.tipsy');
//require('./VocabPop.css');


window._ = _; 

import React, { Component } from 'react';
//import { Panel, Accordion, Label, Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, 
import {Row, Col, FormGroup, FormControl, ControlLabel, HelpBlock} from 'react-bootstrap';

import {commify} from '../utils';

//import {Grid} from 'ag-grid/main';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';

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
class ConceptRecord extends Component {
  render() {
    //const {node} = this.props;
    const {node, settings, eventProps, getNodeState} = this.props;
    if (!node.conceptRecord) return null;
    console.log('conceptRecord', this.props);
    const {concept_class_id, concept_code, concept_id, concept_name,
            domain_id, invalid_reason, standard_concept, 
            vocabulary_id} = node.conceptRecord;
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
    //setToAncestorHeight(this.divRef, "concept-view-container");
    this.setGetSize();
    //this.setState({height});
  }
  componentDidUpdate() {
    this.setGetSize();
  }
  setGetSize() {
    let {width,height} = setToAncestorSize(this.divRef, ".main-content");
    if (height && height !== this.state.height &&
        width && width !== this.state.width) {
      this.setState({width,height});
    }
  }
  render() {
    const {concept_id, conceptInfo, } = this.props;
    //const {height} = this.state;
    //let cr = conceptInfo && conceptInfo.conceptRecord ? <ConceptRecord conceptRecord={conceptInfo.conceptRecord} /> : '';
    let node = {id:'testing', x:200, y:100, size: 5, NodeClass: ConceptRecord, };
    if (conceptInfo) node.conceptRecord = conceptInfo.conceptRecord;
    //console.log('conceptView', node);
    let graphProps = {
      width: this.state.width, 
      height: this.state.height,
      nodes: [node],
      //getHeight: (() => getAncestorHeight(this.divRef, ".main-content")).bind(this),
      //refFunc: (ref=>{ this.srgRef=ref; console.log('got a ref from SRG'); }).bind(this),
    };
    return  <div ref={d=>this.divRef=d}><SigmaReactGraph {...graphProps} /></div>;
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
    this.state = {concept_id:''};
  }
  componentDidMount() {
    //console.log('ConceptViewPage mounting');
  }
  componentWillUnmount() {
    //console.log('ConceptViewPage unmounting');
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.concept_id !== prevState.concept_id) {
      this.state.concept_id && this.props.fullyRenderedCb(false);
      AppState.saveState({concept_id: this.state.concept_id});
    }
    let concept_id_as = AppState.getState('concept_id');
    if (concept_id_as && concept_id_as !== this.state.concept_id) {
      this.setState({concept_id: concept_id_as});
    }
  }
  getValidationState() {
    const {concept_id} = this.state;
    if (concept_id > 0) {
      return 'success';
    }
    else if (concept_id === '') return 'warning';
    else return 'error';
  }
  handleChange(e) {
    let concept_id = e.target.value;
    if (concept_id.length) {
      concept_id = parseInt(concept_id,10);
      if (isNaN(concept_id)) return;
    }
    this.setState({concept_id});
    e.preventDefault();
  }
  newDataFromWrapper(cvState) {
    //console.log('new conceptInfo data', cvState);
    this.props.fullyRenderedCb(true);
  }
  render() {
    const {w,h} = this.props; // from ComponentWrapper
    const {concept_id} = this.state;
    let cv = 'hi ';
    if (concept_id) {
      cv =  <DataWrapper calls={[ {
                                    apiCall: 'conceptInfo',
                                    apiParams: {concept_id},
                                  },
                                ]} 
                          parentCb={this.newDataFromWrapper.bind(this)}
            >
              <ConceptView  concept_id={concept_id}
              />
            </DataWrapper>;
    }
    return  <Row>
              <Col md={2} sm={2} className="short-input">
                <FormGroup
                  controlId="concept_id_input"
                  validationState={this.getValidationState()}
                >
                  <ControlLabel>Concept Id</ControlLabel>
                  <FormControl
                    type="number" step="1"
                    value={concept_id}
                    placeholder="Concept Id"
                    inputRef={d=>this.cidInput=d}
                    onChange={this.handleChange.bind(this)}
                  />
                  <FormControl.Feedback />
                </FormGroup>
              </Col>
              <Col className="concept-view-container" md={9} sm={9} mdOffset={1} smOffset={1}>
                {cv}
              </Col>
            </Row>
                  //<HelpBlock>Validation is based on string length.</HelpBlock>
  }
}
