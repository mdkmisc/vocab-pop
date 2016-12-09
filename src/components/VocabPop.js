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
import * as util from '../utils';
if (DEBUG) window.d3 = d3;
if (DEBUG) window.util = util;
import _ from 'supergroup'; // in global space anyway...

import React, { Component } from 'react';
import { Panel, Label, Accordion, } from 'react-bootstrap';
//import { Button, Panel, Modal, Checkbox, 
//          OverlayTrigger, Tooltip,
//          FormGroup, Radio } from 'react-bootstrap';

import {commify} from '../utils';

import {Grid} from 'ag-grid/main';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';

//import DataTable from './FixedDataTableSortFilt';
//import yamlLoader from 'yaml-configuration-loader';
import settings, { moreTables } from '../Settings';
import {appData, dataToStateWhenReady, conceptStats} from '../AppData';
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
require('./VocabPop.css');

export class Search extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }
  componentDidMount() {
    conceptStats.subscribe( conceptStats => this.setState({conceptStats}) );
  }
  render() {
    let {conceptStats} = this.state;
    if (!conceptStats)
      return <Waiting>Waiting for concept stats...</Waiting>;

    const tableProps = {
      rowHeight: 25,
      headerHeight: 55,
      width: 1200,
      height: 700,
    };
    const coldefs = [
      {
        headerName: 'CDM Table',
        name: 'table_name',
        valueGetter: ({data:d}={}) => (d.table_name || <span style={{fontWeight:'lighter',fontSize:'90%',fontStyle:'italic'}}>does not appear in CDM data</span>),
        colProps: {fixed:true, width:70,flexGrow:2},
        searchable: true, 
        sortable: true,
        //defaultSortDir: 'DESC',
      },
      {
        headerName: 'CDM Column',
        name: 'column_name',
        valueGetter: ({data:d}={}) => d.column_name,
        colProps: {fixed:true, width:90,align:'left',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
      {
        headerName: 'Domain',
        name: 'domain_id',
        valueGetter: ({data:d}={}) => d.domain_id,
        colProps: {fixed:true, width:50,align:'left',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
      {
        headerName: 'Vocabulary',
        name: 'vocabulary_id',
        valueGetter: ({data:d}={}) => d.vocabulary_id,
        colProps: {fixed:true, width:50,align:'left',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
      {
        headerName: 'Concept Class',
        name: 'concept_class_id',
        valueGetter: ({data:d}={}) => d.concept_class_id,
        colProps: {fixed:true, width:50,align:'left',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
      {
        headerName: 'Standard Concept',
        name: 'sc',
        valueGetter: ({data:d}={}) => d.sc,
        colProps: {fixed:true, width:20,align:'left',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
      {
        headerName: 'Concept Invalid',
        name: 'invalid',
        valueGetter: ({data:d}={}) => d.invalid,
        colProps: {fixed:true, width:20,align:'left',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
      {
        headerName: 'Distinct Concepts',
        name: 'conceptrecs',
        valueGetter: ({data:d}={}) => isNaN(d.conceptrecs) ? Infinity : d.conceptrecs,
        fmtAccessor: ({data:d}={}) => isNaN(d.conceptrecs) ? '' : commify(d.conceptrecs),
        colProps: {fixed:true, width:30,align:'right',flexGrow:1},
        sortable: true,
      },
      {
        headerName: 'CDM Occurrences',
        name: 'dbrecs',
        valueGetter: ({data:d}={}) => isNaN(d.dbrecs) ? Infinity : d.dbrecs,
        fmtAccessor: ({data:d}={}) => isNaN(d.dbrecs) ? '' : commify(d.dbrecs),
        colProps: {fixed:true, width:30,align:'right',flexGrow:1},
        searchable: true, 
        sortable: true,
      },
    ];
    return (
            <Panel>
              <h3>Concept Search</h3>
              <div style={{height:500, width:'100%'}} className="ag-fresh">
                <AgGridReact
                  columnDefs={coldefs}
                  rowData={conceptStats}
                  rowHeight="22"
                />
              </div>
            </Panel>);
  }
}
                       /*
              <DataTable  
                      //_key={rollup.toString()}
                      data={conceptStats}
                      coldefs={coldefs}
                      tableProps={tableProps}
                      searchWidth={500}
                      tableHeadFunc={
                        (datalist) => {
                          return <span>{datalist.getSize()} rows</span>;
                      }}
                      _rowClassNameGetter={
                        rec => {
                          switch (rec.sc) {
                            case 'S':
                              return 'standard-concept';
                            case 'C':
                              return 'classification-concept';
                            default:
                              return '';
                          }
                      }}
                      _onRowClick={
                        (evt, idx, obj, datalist)=>{
                          let concept = datalist.getObjectAt(idx);
                          let concept_id = concept.records[0].rollupConceptId;
                          this.setState({concept, concept_id});
                        }}
                />
                        */ 
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
export class TreeWalker extends Component {
  constructor(props) {
    super(props);
    this.state = { drill: null };
  }
  render() {
    let {kidTitle, nodeVal, kids, kidContent, childConfig, level=1 } = this.props;
    return (
        <Accordion className='treewalker'>
          {
            kids(nodeVal).map(kid => {
              let drill = '';
              /*
              if (this.state.drill === val && childConfig) {
                drill = <TreeWalker nodeVal={val} {...childConfig} />;
              }
              */
              if (childConfig) {
                drill = <TreeWalker nodeVal={kid} level={level+1} {...childConfig} />;
              }
              return <Panel 
                          header={kidTitle(kid)}
                          eventKey={kid.toString()}
                          key={kid.toString()}
                          onMouseOver={()=>this.setState({drill:kid})}
                      >
                        {kidContent(kid)}
                        {drill}
                    </Panel>
            })
          }
        </Accordion>
    );
  }
}
export class Tables extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    conceptStats.subscribe(
      cs => {
        let {tableList} = settings;
        console.log(cs);
        let statsByTable = _.supergroup(cs, 
          ['table_name','column_name','domain_id','vocabulary_id']);
        moreTables(statsByTable.map(String));
        console.log(tableList);
        statsByTable = tableList.map(
          tableConfig => {
            let stats = statsByTable.lookup(tableConfig.tableName);
            if (!stats)
              console.error(`conceptStats missing tableName ${tableConfig.tableName}`);
            stats.tableConfig = tableConfig;
            return stats;
          });
        _.addSupergroupMethods(statsByTable);
        this.setState({statsByTable});
    });
  }
  render() {
    let {domain} = this.props.params;
    let {statsByTable, } = this.state;
    let {tables} = settings;
    if (!tables)
      return <h3>nothing</h3>;
    if (domain) {
      return <pre>
              {JSON.stringify(tables[domain],null,2)}
            </pre>;
    }
    if (!statsByTable) 
      return <h4>waiting for table stats</h4>;

    let rootVal = statsByTable.asRootVal('');
    let fsScale = d3.scaleLinear().domain([0,6]).range([120,60]);
    let treeWalkerConfig = {
      nodeVal: rootVal,
      kids: root=>root.children.filter(c=>!(c.tableConfig||{}).hidden),
      kidTitle: (table) => {
        let fontSize = fsScale(table.tableConfig.headerLevel) + '%';
        return <div style={{fontSize}}><span style={{fontSize:'-15%'}}>{table.toString()} columns with concept_ids</span>{table.children.join(', ')}</div>
        //return <div><H>{table.toString()} columns with concept_ids</H>{table.children.join(', ')}</div>,
      },
      kidContent: table=><p>
                          <strong>{table.toString()}</strong> {' '}
                            - {commify(table.aggregate(_.sum, 'conceptrecs'))} concepts,
                            - {commify(table.aggregate(_.sum, 'dbrecs'))} database records
                        </p>,
      childConfig: {
        kids: table=>table.children.filter(c=>!(c.tableConfig||{}).hidden),
        kidTitle: column => <div><h3>{column.toString()} concept domains</h3>{column.children.join(', ')}</div>,
        kidContent: column=><p>
                            <strong>{column.toString()}</strong> {' '}
                              - {commify(column.aggregate(_.sum, 'conceptrecs'))} concepts,
                              - {commify(column.aggregate(_.sum, 'dbrecs'))} database records
                          </p>,
        childConfig: {
          kids: column=>column.children.filter(c=>!(c.tableConfig||{}).hidden),
          kidTitle: domain => <div><h3>{domain.toString()} vocabularies</h3>{domain.children.join(', ')}</div>,
          kidContent: domain=><p>
                              <strong>{domain.toString()}</strong> {' '}
                                - {commify(domain.aggregate(_.sum, 'conceptrecs'))} concepts,
                                - {commify(domain.aggregate(_.sum, 'dbrecs'))} database records
                            </p>,
          childConfig: {
            kids: domain=>domain.children.filter(c=>!(c.tableConfig||{}).hidden),
            kidTitle: vocab => <div><h3>{vocab.toString()}</h3>{vocab.children.join(', ')}</div>,
            kidContent: vocab=><p>
                                <strong>{vocab.toString()}</strong> {' '}
                                  - {commify(vocab.aggregate(_.sum, 'conceptrecs'))} concepts,
                                  - {commify(vocab.aggregate(_.sum, 'dbrecs'))} database records
                              </p>,
          }
        }
      }
    }
    let title = <div><h3>CDM Tables with concept_ids</h3>{rootVal.children.join(', ')}</div>;
    return  <Panel header={title} >
              <TreeWalker {...treeWalkerConfig} />
            </Panel>
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
