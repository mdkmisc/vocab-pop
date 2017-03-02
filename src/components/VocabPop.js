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
import ConceptData from './ConceptData';
import {VocabMapByDomain, DomainMap} from './VocabMap';

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
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
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
export class ConceptView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    this.concept_id_sub = 
      AppState.stateStream('concept_id')
              .debounceTime(1000)
              .subscribe(
                concept_id => { 
                  if (concept_id !== this.state.concept_id) {
                    this.setState({concept_id});
                  }
                });
  }
  componentWillUnmount() {
    this.concept_id_sub && this.concept_id_sub.unsubscribe();
  }
  render() {
    const {concept_id} = this.state;
    return  <pre>
              concept_id: {concept_id} {'\n'}
              props: {_.keys(this.props).join(',')}
            </pre>
  }
}
export class ConceptViewPage extends Component {
  constructor(props) {
    super(props);
    this.state = {concept_id:''};
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.concept_id !== prevState.concept_id) {
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
  render() {
    const {concept_id} = this.state;
    console.log('rendering with', concept_id);
    let cv = 'hi ';
    if (concept_id) {
      cv =  <ConceptData {...this.props}>
              <ConceptView  />
            </ConceptData>;
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
              <Col md={9} sm={9} mdOffset={1} smOffset={1}>
                {cv}
              </Col>
            </Row>
                  //<HelpBlock>Validation is based on string length.</HelpBlock>
  }
}
