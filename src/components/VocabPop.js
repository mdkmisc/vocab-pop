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
import { Panel, Accordion, Label
          //Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, FormGroup, Radio
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
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
require('./VocabPop.css');
require('./fileBrowser.css');

const coldefs = [
  {
    headerName: 'CDM Table',
    colId: 'table_name',
    //unSortIcon: true,
    //headerRenderer: () => `<a target="_blank" href="http://www.ohdsi.org/web/wiki/doku.php?id=documentation:cdm:standardized_clinical_data_tables">CDM Table</a>`,
    field: 'table_name',
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
    //sortingOrder: ['desc','asc']
  },
  {
    headerName: 'Distinct Concepts',
    colId: 'conceptrecs',
    field: 'conceptrecs',
    cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
    //sortingOrder: ['desc','asc']
  },
  {
    headerName: 'CDM Occurrences',
    colId: 'dbrecs',
    field: 'dbrecs',
    /*
    comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
      let ret = (isNaN(valueA) ? -Infinity : valueA) - (isNaN(valueB) ? -Infinity: valueB);
      return isNaN(ret) ? 0 : ret;
    },
    */
    cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
    //sort: 'desc',
    //sortingOrder: ['desc','asc']
  },
  {
    headerName: 'Type',
    colId: 'type_concept_name',
    valueGetter: ({data:d}={}) => d.type_concept_name,
  },
  {
    headerName: 'Invalid',
    colId: 'invalid_reason',
    valueGetter: ({data:d}={}) => d.invalid_reason,
  },
  {
    headerName: 'Standard Concept',
    colId: 'standard_concept',
    valueGetter: ({data:d}={}) => d.standard_concept,
  },
  {
    headerName: 'Distinct Concepts',
    colId: 'concept_count',
    field: 'concept_count',
    cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
    //sortingOrder: ['desc','asc']
  },
  {
    headerName: 'CDM Occurrences',
    colId: 'exposure_count',
    field: 'exposure_count',
    /*
    comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
      let ret = (isNaN(valueA) ? -Infinity : valueA) - (isNaN(valueB) ? -Infinity: valueB);
      return isNaN(ret) ? 0 : ret;
    },
    */
    cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
    //sort: 'desc',
    //sortingOrder: ['desc','asc']
  },
];

export class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    this.stateSub = AppState.subscribeState('',
        state => this.setState(state));
    //AppState.subscribe(this, 'statsByTable');
    //AppState.subscribe(this, 'tableConfig');
    //AppState.subscribe(this, 'classRelations');
    //AppState.subscribe(this, 'userSettings');
    //AppState.subscribe(this, 'conceptCount');
  }
  componentWillUnmount() {
    this.stateSub.unsubscribe();
    //AppState.unsubscribe(this, 'statsByTable');
    //AppState.unsubscribe(this, 'tableConfig');
    //AppState.unsubscribe(this, 'classRelations');
    //AppState.unsubscribe(this, 'userSettings');
    //AppState.unsubscribe(this, 'conceptCount');
  }
  render() {
    var conceptCount = this.state.conceptCount || 0;
    return  <div>
              <Inspector search={false} 
                data={ AppState.getState() } />
              <br/>
              Current concepts: { commify(conceptCount) }
            </div>;
  }
}
export class DrugContainer extends Component {
  render() {
    let {filters} = AppState.getState();
    // don't want updates when router changes,
    // so add level of indirection -- better way?
    return <DrugContainerNoRouter filters={filters}/>;
  }
}
export class DrugContainerNoRouter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      counts: {},
      drugagg: [],
    };
    //this.streamsRequested = [];
    this.countStreamsToWatch = {}; 
    // All,Inv,NoMatch,NonStd, and ONLY current With filt
  }
  componentDidMount() {
    this.countSub( 'All', {
        excludeInvalidConcepts: false,
        excludeNoMatchingConcepts: false,
        excludeNonStandardConcepts: false, });
    this.countSub( 'Invalid', {
        includeFiltersOnly: true,
        includeInvalidConcepts: true, });
    this.countSub( 'No matching concept', {
        includeFiltersOnly: true,
        includeNoMatchingConcepts: true, });
    this.countSub( 'Non-standard concepts', {
        includeFiltersOnly: true,
        includeNonStandardConcepts: true, });

    this.countsSubscriber = new AppState.StreamsSubscriber(
      streams=>this.streamsCallback(streams,'counts'));
    this.aggSubscriber = new AppState.StreamsSubscriber(
      streams=>this.streamsCallback(streams,'agg'));
    this.fetchData();
  }
  componentDidUpdate(prevProps, prevState) {
    // should only need to fetch data if filters change, right?
    if (!_.isEqual(prevProps.filters, this.props.filters)) {
      this.fetchData();
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    //let equal = _.isEqual(this.state.counts, nextState.counts);
    let stateChange = !_.isEqual(this.state, nextState);
    let propsChange = !_.isEqual(this.props, nextProps);
    //console.log(this.state, nextState, 'stateChange', stateChange);
    //console.log(this.props, nextProps, 'propsChange', propsChange);
    return stateChange || propsChange;
  }
  componentWillUnmount() {
    //AppState.unsubscribe(this);
    this.countsSubscriber.unsubscribe();
    this.aggSubscriber.unsubscribe();
  }
  countSub(displayName, filters) {
    let stream = new AppState.ApiStream({
        apiCall: 'drugConceptCounts', 
        params: {...filters, queryName:displayName}, 
        singleValue: true,
        transformResults: 
          (results) => DrugContainerNoRouter.formatCounts(results, displayName),
        meta: {
          statePath: `counts.${displayName}`,
        }
      });
    this.countStreamsToWatch[displayName] = stream;
    //if (stream.newInstance) this.streamsRequested.push(stream);
  }
  fetchData() {
    const {filters} = this.props;
    //console.log('in Drug.fetchData with filters', filters);
    this.countSub('With current filters', filters);
    this.countsSubscriber.filter( stream => 
        _.includes( _.values(this.countStreamsToWatch), 
                   stream));

    let aggStream = new AppState.ApiStream({
        apiCall: 'drugConceptAgg', 
        params: {...filters, queryName:'drugagg'}, 
        meta: {
          statePath: `drugagg`,
        },
        transformResults: 
          results => results.map(
            rec => {
              rec.exposure_count = parseInt(rec.exposure_count,10);
              rec.concept_count = parseInt(rec.concept_count,10);
              return rec;
            }),
      });
    if (this.aggStream !== aggStream) {
      this.aggStream = aggStream;
      this.aggSubscriber.filter(stream => aggStream === stream);
    } else {
      console.log('created same aggStream');
    }
  }
  streamsCallback(streams, subName) {
    console.log(`Drug ${subName} streamsSubscriber`, streams);
    let state = _.merge({}, this.state);
    streams.forEach(stream => {
      _.set(state, stream.meta.statePath, stream.results);
    })
    this.setState(state);
  }
  static formatCounts(dcc, displayName) {
    return {
          'Drug exposures': commify(parseInt(dcc.exposure_count,10)),
          'Drug concepts': commify(parseInt(dcc.concept_count,10)),
    };
  }
  render() {
    const {filters} = this.props;
    const {counts, drugagg} = this.state;
    let cols = coldefs.filter(
      col => _.includes([ 
        'type_concept_name', 'domain_id', 'vocabulary_id', 'concept_class_id',
        'standard_concept', 'concept_count', 'exposure_count', ], col.colId));
    return <Drug filters={filters}
                  counts={counts}
                  drugagg={drugagg}
                  cols={cols} >
              <div>
                <Label bsStyle="warning">Debug stuff</Label>
                <Inspector search={false} data={this.state} />
              </div>
            </Drug>;
  }
}

class Drug extends Component {
  render() {
    const {children, counts, drugagg, cols} = this.props;
    return  <div>
              <AgTable coldefs={cols} data={drugagg}
                      width={800} height={200}
                      id="DrugAgg"
              />
              <DrugTree drugagg={drugagg} />
              <ul>
                {
                  _.map(counts,
                    (cat, catName) => (
                      <li key={catName}>{catName}
                        <ul>
                          {
                            _.map(cat, 
                              (count, countName) => (
                                <li key={countName}>
                                  {countName}: {count}
                                </li>
                            ))
                          }
                        </ul>
                      </li>
                    ))
                }
              </ul>
              {children}
              <p>
                notes:<br/>
                  counts with/without filters<br/>
                  source/target<br/>
                  drug type<br/>
                  drug class<br/>
                  standard concept (color)<br/>
                  <br/>
                  <br/>
                  relationships:<br/>
                  hierarchical/not<br/>
                  to domain<br/>
                  counts<br/>
                  samples<br/>
              </p>
            </div>;
  }
}
class DrugTree extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.drugagg, nextProps.drugagg)) {
      let tree = _.supergroup(nextProps.drugagg,
            ['domain_id','vocabulary_id',
              'standard_concept','invalid_reason',
              'type_concept_name',
              'concept_class_id']);
      this.setState({tree});
    }
  }
  render() {
    const {selectCb=d=>console.log('drugtree selection',d)} = this.props;
    const {tree} = this.state;
    //let rootVal = tree.length === 1 ? tree[0] : tree.asRootVal('');
    function innerCellRenderer(params) {
      let str;
      if (params.node.group) {
        str = `${params.data.dim}: <strong>${params.data.toString()}</strong>`;
      } else {
        str = `${params.data.dim}: <strong>${params.data.toString()}</strong>`;
      }
      return str;
    }
    var coldefs = [
        {headerName: "Attributes", field: "node", width: 450,
            cellRenderer: 'group',
            cellRendererParams: {
                innerRenderer: innerCellRenderer
            }
        },
        {
          headerName: "Concept Count", field: "concept_count", width: 130,
          cellRenderer: params => commify(params.data.aggregate(_.sum, 'concept_count')),
          cellStyle: {'text-align': 'right'},
        },
        {
          headerName: "Exposure Count", field: "exposure_count", width: 130,
          cellRenderer: params => commify(params.data.aggregate(_.sum, 'exposure_count')),
          cellStyle: {'text-align': 'right'},
        },
        /*
        {headerName: "Size", field: "size", width: 70, cellStyle: sizeCellStyle},
        {headerName: "Type", field: "type", width: 150},
        {headerName: "Date Modified", field: "dateModified", width: 150}
        */
    ];
    return (
      <AgSgTreeBrowser
              tree={tree}
              coldefs={coldefs}
              rowSelect={node => selectCb(node)}
      />
    );
    //return <h2>nothing here yet</h2>;
  }
}
export class AgSgTreeBrowser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gridOptions: {
        rowSelection: 'multiple',
        enableColResize: true,
        enableSorting: true,
        animateRows: true,
        rowHeight: 30,
        getNodeChildDetails: function(sgVal) {
            if (sgVal.children) {
                return {
                    group: true,
                    children: sgVal.children,
                    expanded: typeof sgVal.open === 'undefined' ? true : false,
                };
            } else {
                return null;
            }
        },
        onRowClicked: this.rowClicked.bind(this),
      },
      nodeSelected: null,
    };
  }
  rowClicked(params) {
    const {rowSelect, rowSelectWholeParams=false} = this.props;
    this.setState({nodeSelected: params.node});
    if (rowSelect) {
      if (rowSelectWholeParams)
        rowSelect(params)
      else
        rowSelect(params.data);
    }

  }
  render() {
    const {
            //rowSelect, 
            coldefs, tree, 
            height=400, width='100%'
           } = this.props;
    if (!tree || !tree.length)
      return <Label bsStyle="warning">No data yet</Label>;
    const {gridOptions, nodeSelected} = this.state;
    return (
            <Panel>
              <Label>
                {tree.records.length} records
                <br/>
                {nodeSelected ? nodeSelected.data.namePath(' - ') : ''}
              </Label>
              <br/>
              <div style={{height, width}} className="ag-fresh">
                
                <AgGridReact
                  {...gridOptions}
                  //onGridReady={this.onGridReady.bind(this)}
                  columnDefs={coldefs}
                  rowData={tree}
                  /*
                  rowHeight="22"
                  enableFilter={true}
                  enableSorting={true}
                  //sortingOrder={['asc','desc']}
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
                  //onSortChanged={this.saveGridState.bind(this)}
                  onFilterChanged={this.saveGridState.bind(this)}
                  */
                />
              </div>
            </Panel>);
  }
  
}
export class Search extends Component {
  constructor(props) {
    super(props);
    this.state = { filters:{} };
  }
  componentDidMount() {
    this.filtSub = AppState.subscribeState(
      'filters', filters => {
        //console.log('new search filters', filters);
        this.setState({filters});
      });
    this.fetchData();
  }
  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevState.filters, this.state.filters)) {
      this.fetchData(this.state.filters);
    }
  }
  componentWillUnmount() {
    this.filtSub.unsubscribe();
  }
  fetchData(filters={}) {
    //let stream = 
    new AppState.ApiStream({
        apiCall: 'concepts', 
        params: {...filters, 
                      query:'conceptStats'
                    }, 
        transformResults: 
          (results) => {
            let recs = results.map(rec=>{
              return _.merge({}, rec, {
                conceptrecs: parseInt(rec.conceptrecs, 10),
                dbrecs: parseInt(rec.dbrecs, 10),
              });
            });
            console.log('new search results for', filters);
            return recs;
            //let sbt = _.supergroup(recs, ['table_name','column_name','domain_id','vocabulary_id']);
            //return sbt;
          },
        //cb: statsByTable => { this.setState({statsByTable}); }
        cb: conceptStats => { this.setState({conceptStats}); }
      });
  }
  render() {
    let {conceptStats} = this.state;
    let cols = coldefs.filter(
      col => _.includes([ 'table_name', 'column_name',
        'domain_id', 'vocabulary_id', 'concept_class_id',
        'sc', 'invalid', 'conceptrecs', 'dbrecs', ], col.colId));

    return (
              <AgTable coldefs={cols} data={conceptStats}
                      width={"100%"} height={550}
                      id="Search"
              />
    );
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
    throw new Error("haven't tried this for a while");
    /*
    this.state = { 
      breakdowns: {},
    };
    */
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
    if (false) return null; // avoid lint warning
    throw new Error("haven't tried this for a while");
    /*
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
    */
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
export class AgTable extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      status: 'initializing' 
    };
    const {id} = props;
    if (_.has(AgTable.instances, id)) {
      console.error(`agGrid.${id} AgTable already exists`, id);
      let instance = AgTable.instances[id];
      return instance;
    }
  }
  saveGridState(arg) { // for dealing with user changes
                       // but also gets called during init
    if (!this.grid) return;
    const {id} = this.props;
    console.log('in saveGridState', this.state, this.grid.api.getSortModel());
    if (this.state.status !== 'initialized') return true;
    var gridState = {
      columnState: this.grid.columnApi.getColumnState(),
      sortModel: this.grid.api.getSortModel(),
      filterModel: this.grid.api.getFilterModel(),
    };
    //let state = AppState.getState(`agGrid.${id}`) || {sortModel:[{}]};
    //console.log('old', state.sortModel[0], 'new', gridState.sortModel[0]);
    //this.grid.api.setSortModel(gridState.sortModel);
    AppState.saveState(`agGrid.${id}`, gridState);
  }
  componentWillUnmount() {
    const {id} = this.props;
    delete AgTable.instances[id];
  }
  initializeGridState(urlGridState) {
    if (!(this.props.data && this.props.data.length)) {
      console.log('waiting for data, have to run initializeGridState again');
      setTimeout(()=>this.initializeGridState(urlGridState), 500);
      return;
    }
    //AppState.saveState({test:this.grid.columnApi.getColumnState()[1]});
    
    //var currentGridState = {};
    if (urlGridState.columnState) {
      this.grid.columnApi.setColumnState(urlGridState.columnState);
    }
    if (urlGridState.sortModel)
      this.grid.api.setSortModel(urlGridState.sortModel);
    if (urlGridState.filterModel)
      this.grid.api.setFilterModel(urlGridState.filterModel);

    setTimeout(()=>this.setState({status: 'initialized'}),500);
    /*
    if (urlGridState.sortModel)
      currentGridState.sortModel = this.grid.api.getSortModel();
    if (urlGridState.filterModel)
      currentGridState.filterModel = this.grid.api.getFilterModel();

    if (_.isEqual(currentGridState, urlGridState)) {
      this.setState({status: 'initialized'});
    } else {
      if (this.props.data && this.props.data.length) {
        //urlGridState.columnState && this.grid.columnApi.setColumnState(urlGridState.columnState);
        urlGridState.sortModel && this.grid.api.setSortModel(urlGridState.sortModel);
        urlGridState.filterModel && this.grid.api.setFilterModel(urlGridState.filterModel);
      }
      // sometimes it doesn't work, so try again
    }
    */
  }
  onGridReady(grid) {
    const {id} = this.props;
    this.grid = grid;
    let urlGridState = AppState.getState(`agGrid.${id}`);
    if (urlGridState)
      this.initializeGridState(urlGridState);
    else
      this.setState({status: 'initialized'});
    window.grid = this.grid;
  }
  componentDidUpdate() {
    const {columnSettings} = this.props;
    if (columnSettings)
      this.grid.columnApi.setColumnState(columnSettings);
  }
  shouldComponentUpdate(nextProps, nextState) {
    //if (this.state.status !== 'ready') return false;
    let stateChange = !_.isEqual(this.state, nextState);
    let propsChange = !_.isEqual(this.props, nextProps);
    //console.log(this.state, nextState, 'stateChange', stateChange);
    //console.log(this.props, nextProps, 'propsChange', propsChange);
    return stateChange || propsChange;
  }
  render() {
    const {coldefs, data=[], height=400, width='100%'} = this.props;
    return (
            <Panel>
              <Label>
                {data.length} rows
              </Label>
              <br/>
              <div style={{height, width}} className="ag-fresh">
                <AgGridReact
                  onGridReady={this.onGridReady.bind(this)}
                  columnDefs={coldefs}
                  rowData={data}
                  rowHeight="22"
                  enableFilter={true}
                  enableSorting={true}
                  //sortingOrder={['asc','desc']}
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
}
AgTable.propTypes = {
  id: React.PropTypes.string.isRequired,
}
AgTable.instances = {};
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
