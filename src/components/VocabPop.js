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
require('./stylesheets/Vocab.css');
require('tipsy/src/javascripts/jquery.tipsy');
//require('./VocabPop.css');


window._ = _; 

import React, { Component } from 'react';
//import { Panel, Accordion, Label, Row, Col, Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, FormGroup, Radio } from 'react-bootstrap';

import {commify} from '../utils';

//import {Grid} from 'ag-grid/main';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';

import * as AppState from '../AppState';
//import {appData, dataToStateWhenReady, conceptStats} from '../AppData';
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
require('./fileBrowser.css');


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
