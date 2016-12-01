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
const DEBUG = true;
var d3 = require('d3');
import * as util from '../utils';
if (DEBUG) window.d3 = d3;
if (DEBUG) window.util = util;
import _ from 'supergroup'; // in global space anyway...

import React, { Component } from 'react';
import { Button, Panel, Modal, Checkbox, 
          OverlayTrigger, Tooltip,
          FormGroup, Radio } from 'react-bootstrap';

import {commify} from '../utils';
import DataTable from './FixedDataTableSortFilt';
import yaml from 'js-yaml';
//import yamlLoader from 'yaml-configuration-loader';
import domainsYaml from '../domains.yml';
import {conceptCount, conceptStats} from '../appData';
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
require('./VocabPop.css');


export class Domains extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
    let domains = yaml.safeLoad(domainsYaml);
    this.setState({domains});
  }
  render() {
    let {domains} = this.state;
    if (!domains)
      return <h3>nothing</h3>;
    return <ul>
            {
              domains.Domains.map((domain,i)=>{
                return <li key={i}>
                          <pre>
                            {JSON.stringify(domain,null,2)}
                          </pre>
                        </li>
              })
            }
           </ul>
  }
}
export class ConceptsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { 
    };
  }
  componentDidMount() {
    this.fetchConceptStats(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.fetchConceptStats(nextProps);
  }
  fetchConceptStats(props) {
    const {settings} = props;
    conceptCount()
      .then((conceptCount) => {
        setTimeout(()=>{
          this.setState({conceptCount});
        }, 4000);
      });
    conceptStats()
      .then((conceptStats) => {
        this.setState({conceptStats});
      });
  }
  render() {
    const {settings} = this.props;
    const {conceptStats, conceptCount} = this.state;
    if (conceptStats && typeof conceptCount !== 'undefined') {
      return <Concepts  
                conceptStats={conceptStats} 
                conceptCount={conceptCount} 
              />;
    } else {
      return <Waiting>Waiting for concept stats...</Waiting>;
    }
  }
}
 
export class Concepts extends Component {
  render() {
    let {conceptStats, conceptCount} = this.props;
    return  <Panel className="concept-stats">
              {commify(conceptCount)} total concepts in concept table<br/>
              {commify(conceptStats.length)} used in database<br/>
            </Panel>;
  }
}
export class Waiting extends Component {
  render() {
    let {content, children} = this.props;
    content = content || children ||
              `waiting for something`;
    return  <Panel className="waiting"
                    style={{
                    }}
            >
              <Spinner />
              doo dee doo...<br/>
              {content}
            </Panel>;
  }
}
