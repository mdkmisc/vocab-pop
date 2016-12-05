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
import { Panel, } from 'react-bootstrap';
//import { Button, Panel, Modal, Checkbox, 
//          OverlayTrigger, Tooltip,
//          FormGroup, Radio } from 'react-bootstrap';

import {commify} from '../utils';
//import DataTable from './FixedDataTableSortFilt';
//import yamlLoader from 'yaml-configuration-loader';
import {appData, dataToStateWhenReady} from '../AppData';
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
require('./VocabPop.css');
import settings from '../Settings';


export class Vocabularies extends Component {
  constructor(props) {
    super(props);
    this.state = {
      breakdowns: {},
    };
  }
  componentDidMount() {
    dataToStateWhenReady(this);
  }
  render() {
    const vocabs = this.state.breakdowns.vocabulary_id;
    
    if (!vocabs)
      return <h3>no vocabs</h3>;
    console.log(this.state);
    return <pre>
            {vocabs+''}
           </pre>;
  }
}
export class Domains extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
    dataToStateWhenReady(this);
  }
  render() {
    let {domain} = this.props.params;
    let {domains} = settings;
    if (!domains)
      return <h3>nothing</h3>;
    console.log(this.state);
    return <pre>
            {JSON.stringify(domains[domain],null,2)}
           </pre>;
           /*
              domains.map((domain,i)=>{
                return <li key={i}>
                          <pre>
                            {JSON.stringify(domain,null,2)}
                          </pre>
                        </li>
              })
              */
  }
}
export class ConceptsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      breakdowns: {},
    };
  }
  componentDidMount() {
    this.fetchConceptStats(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.fetchConceptStats(nextProps);
  }
  fetchConceptStats(props) {
    dataToStateWhenReady(this);
    /*
    let {conceptCount, conceptStats, breakdowns } = appData;
    conceptCount.then(
      cc => this.setState({conceptCount: cc}));
    conceptStats.then(
      cs => this.setState({conceptStats: cs}));
    breakdowns.then(
      bd => this.setState({breakdowns: bd}));
    */
  }

  render() {
    const {conceptStats, conceptCount, breakdowns} = this.state;
    if (breakdowns && typeof conceptCount !== 'undefined') {
      return <Concepts  
                conceptCount={conceptCount} 
                conceptStats={conceptStats} 
                breakdowns={breakdowns} 
              />;
    } else {
      return <Waiting>Waiting for concept stats...</Waiting>;
    }
  }
}
 
export class Home extends Component {
  render() {
    return <div>
              <h3>Home!</h3>
              <pre>
                {JSON.stringify(settings, null, 2)}
              </pre>
           </div>
  }
}
export class Concepts extends Component {
  render() {
    const {conceptCount, breakdowns, conceptStats} = this.props;
    //{commify(conceptStats.length)} used in database<br/>
                          //{bd.aggregate(_.sum, 'conceptrecs')} concepts, {' '}
                          //{bd.aggregate(_.sum, 'dbrecs')} database records {' '}
                          //{commify(_.sum(bd.records.map(d=>d.conceptrecs)))} concepts, {' '}
                          //{commify(_.sum(bd.records.map(d=>d.dbrecs)))} database records {' '}
    return  <Panel className="concept-stats">
              {commify(conceptCount)} total concepts in concept table<br/>
              <ul>
                {_.map(breakdowns,
                  (bd, attr) => {
                    return (
                      <li key={attr}>
                        {bd.length} {attr}s
                      </li>);
                  })}
              </ul>
              <pre>
                {JSON.stringify(conceptStats, null, 2)}
              </pre>
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
