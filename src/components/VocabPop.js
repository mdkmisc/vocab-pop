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
import { Panel, Accordion, 
          //Label, Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, FormGroup, Radio
                    } from 'react-bootstrap';

import {commify} from '../utils';

//import {Grid} from 'ag-grid/main';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';

import * as AppState from '../AppState';
//import {appData, dataToStateWhenReady, conceptStats} from '../AppData';
import Spinner from 'react-spinner';
//require('react-spinner/react-spinner.css');
require('./VocabPop.css');

export class Home extends Component {
  render() {
    return <h4>home</h4>;
  }
}
export class Drug extends Component {
  render() {
    return <h4>drugs</h4>;
  }
}
export class Search extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }
  componentDidMount() {
    console.log('mounting Search');
    this.conceptStats = AppState.conceptStats
          .subscribe(conceptStats => this.setState({conceptStats}));
  }
  onGridReady(grid) {
    this.grid = grid;
    /*
    this.userSettings = AppState.userSettings.subscribe(
      userSettings => {
        this.grid.columnApi.setColumnState(userSettings.agGrid.columnState);
        //this.setState({userSettings});
      });
    */
  }
  componentWillUnmount() {
    console.log('unmounting Search');
    this.conceptStats.unsubscribe();
    this.userSettings && this.userSettings.unsubscribe();
  }
  componentDidUpdate() {
    var userSettings = AppState.userSettings.getValue();
    var gridSettings = userSettings.agGrid && userSettings.agGrid.columnState;
    //console.log('applying col settings', gridSettings);
    gridSettings && this.grid.columnApi.setColumnState(gridSettings);
  }
  render() {
    console.log('rendering Search');
    let {conceptStats, userSettings} = this.state;
    //if (!conceptStats) return <Waiting>Waiting for concept stats...</Waiting>;

    const coldefs = [
      {
        headerName: 'CDM Table',
        colId: 'table_name',
        headerRenderer: () => `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:standardized_clinical_data_tables">CDM Table</a>`,
        //field: 'table_name',
        cellRenderer: ({data:d}={}) => (
          d.table_name
            ? `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:${d.table_name}">${d.table_name}</a>`
            : `<span class="aside">does not appear in CDM data</span>`),
      },
      {
        headerName: 'CDM Column',
        colId: 'column_name',
        valueGetter: ({data:d}={}) => d.column_name,
      },
      {
        headerName: 'Domain',
        colId: 'domain_id',
        headerRenderer: () => `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:domain">Domain</a>`,
        valueGetter: ({data:d}={}) => d.domain_id,
      },
      {
        headerName: 'Vocabulary',
        colId: 'vocabulary_id',
        headerRenderer: () => `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:vocabulary">Vocabulary</a>`,
        valueGetter: ({data:d}={}) => d.vocabulary_id,
      },
      {
        headerName: 'Concept Class',
        headerRenderer: () => `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:concept_class">Concept Class</a>`,
        colId: 'concept_class_id',
        valueGetter: ({data:d}={}) => d.concept_class_id,
      },
      {
        headerName: 'Standard Concept',
        colId: 'sc',
        headerRenderer: () => `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:concept">Standard Concept</a>`,
        valueGetter: ({data:d}={}) => d.sc,
      },
      {
        headerName: 'Concept Invalid',
        colId: 'invalid',
        valueGetter: ({data:d}={}) => d.invalid,
        sortingOrder: ['desc','asc']
      },
      {
        headerName: 'Distinct Concepts',
        colId: 'conceptrecs',
        field: 'conceptrecs',
        cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
        sortingOrder: ['desc','asc']
      },
      {
        headerName: 'CDM Occurrences',
        colId: 'dbrecs',
        field: 'dbrecs',
        comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
          let ret = (isNaN(valueA) ? -Infinity : valueA) - (isNaN(valueB) ? -Infinity: valueB);
          return isNaN(ret) ? 0 : ret;
        },
        cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
        sort: 'desc',
        sortingOrder: ['desc','asc']
      },
    ];
    return (
            <Panel>
              <h3>Concept Search</h3>
              <div style={{height:500, width:'100%'}} className="ag-fresh">
                <AgGridReact
                  onGridReady={this.onGridReady.bind(this)}
                  columnDefs={coldefs}
                  rowData={conceptStats}
                  rowHeight="22"
                  enableFilter={true}
                  enableSorting={true}
                  sortingOrder={['asc','desc']}
                  animateRows={true}
                  getRowStyle={
                    (params) => params.data.sc === 'S' ? {backgroundColor:'rgba(143, 188, 143, 0.46)'}
                              : params.data.sc === 'C' ? {backgroundColor:'rgba(177, 224, 231, 0.51)'}
                              : {backgroundColor:'rgba(255, 160, 122, 0.41)'}
                  }
                  headerCellRenderer={
                    p => p.colDef.headerRenderer ? p.colDef.headerRenderer(p) : p.colDef.headerName
                  }
                  onColumnMoved={this.saveGridState.bind(this)}
                  onColumnVisible={this.saveGridState.bind(this)}
                  //onColumnEverythingChanged={this.saveGridState.bind(this)}
                  onSortChanged={this.saveGridState.bind(this)}
                  onFilterChanged={this.saveGridState.bind(this)}
                />
              </div>
            </Panel>);
  }
  saveGridState() {
    if (!this.grid) return;
    var gridState = {
      columnState: this.grid.columnApi.getColumnState(),
      sortModel: this.grid.api.getSortModel(),
      filterModel: this.grid.api.getFilterModel(),
    };
    AppState.saveState('agGrid', gridState);
  }
}
                       /*
    const tableProps = {
      rowHeight: 25,
      headerHeight: 55,
      width: 1200,
      height: 700,
    };
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
    this.statsByTable = AppState.statsByTable
          .subscribe(statsByTable=>this.setState({statsByTable}));
    this.tableConfig = AppState.tableConfig
          .subscribe(tableConfig=>this.setState({tableConfig}));
  }
  componentWillUnmount() {
    this.statsByTable.unsubscribe();
    this.tableConfig.unsubscribe();
  }
  render() {
    let {table} = this.props.params;
    let {statsByTable, tableConfig } = this.state;
    if (!statsByTable)
      return <h3>nothing</h3>;
    if (table) {
      return <pre>
              {JSON.stringify(tableConfig[table],null,2)}
            </pre>;
    }
    if (!statsByTable) 
      return <h4>waiting for table stats</h4>;

    let rootVal = statsByTable.asRootVal('');
    let fsScale = d3.scaleLinear().domain([0,6]).range([120,60]);
    let treeWalkerConfig = {
      nodeVal: rootVal,
      kids: root=>root.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
      kidTitle: (table) => {
        let fontSize = fsScale((tableConfig[table]||{}).headerLevel) + '%';
        return <div style={{fontSize}}><span style={{fontSize:'-15%'}}>{table.toString()} columns with concept_ids</span>{table.children.join(', ')}</div>
        //return <div><H>{table.toString()} columns with concept_ids</H>{table.children.join(', ')}</div>,
      },
      kidContent: table=><p>
                          <strong>{table.toString()}</strong> {' '}
                            - {commify(table.aggregate(_.sum, 'conceptrecs'))} concepts,
                            - {commify(table.aggregate(_.sum, 'dbrecs'))} database records
                        </p>,
      childConfig: {
        kids: table=>table.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
        kidTitle: column => <div><h3>{column.toString()} concept domains</h3>{column.children.join(', ')}</div>,
        kidContent: column=><p>
                            <strong>{column.toString()}</strong> {' '}
                              - {commify(column.aggregate(_.sum, 'conceptrecs'))} concepts,
                              - {commify(column.aggregate(_.sum, 'dbrecs'))} database records
                          </p>,
        childConfig: {
          kids: column=>column.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
          kidTitle: domain => <div><h3>{domain.toString()} vocabularies</h3>{domain.children.join(', ')}</div>,
          kidContent: domain=><p>
                              <strong>{domain.toString()}</strong> {' '}
                                - {commify(domain.aggregate(_.sum, 'conceptrecs'))} concepts,
                                - {commify(domain.aggregate(_.sum, 'dbrecs'))} database records
                            </p>,
          childConfig: {
            kids: domain=>domain.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
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
    AppState.subscribe('appData.conceptStats')(conceptStats => this.setState({conceptStats}));
    AppState.subscribe('appData.conceptCount')(conceptCount => this.setState({conceptCount}));
    //console.error("FIX");
    //dataToStateWhenReady(this);
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
/*
export class Vocabularies extends Component {
  constructor(props) {
    super(props);
    this.state = {
      breakdowns: {},
    };
  }
  componentDidMount() {
    console.error("FIX");
    //dataToStateWhenReady(this);
    AppState.subscribe('conceptStats')(conceptStats => this.setState({conceptStats}));
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
*/
