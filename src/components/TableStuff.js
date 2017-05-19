/* eslint-disable */

import React, { Component } from 'react';
var d3 = require('d3');
var $ = require('jquery');
//if (DEBUG) window.d3 = d3;
import _ from 'src/supergroup'; // in global space anyway...
import {VocabMapByDomain, DomainMap} from 'src/components/VocabMap';
import SigmaReactGraph from 'src/components/SigmaReactGraph';
import myrouter from 'src/myrouter'
//import sigma from 'src/sigmaSvgReactRenderer';
import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper} from 'src/utils';

import Spinner from 'react-spinner';
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
//require('react-spinner/react-spinner.css');

//require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
//require('sigma/plugins/sigma.layout.forceAtlas2/worker');
import {Glyphicon, Row, Col, FormGroup, FormControl, ControlLabel, HelpBlock,
          //Button, ButtonToolbar, ButtonGroup,
          Accordion, Label, Panel, Modal, Checkbox, OverlayTrigger, 
          Tooltip, 
          } from 'react-bootstrap';
//import {Grid} from 'ag-grid/main';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';


// not using Tables component, but worth looking at before deleting
/* if reviving, will need some of this:
export var conceptCount = new Rx.BehaviorSubject(0);
* was in AxxppState:
export var tableConfig = new Rx.BehaviorSubject({});
export var statsByTable = new Rx.BehaviorSubject([]);
export var conceptStats = new Rx.BehaviorSubject([]);
function fetchData() {
  console.log("NOT FETCHING DATA");


if i ever revive this, might need to look at old AppData.js and appSettings
  which are
  disappearing after commit 27ce5015d658935bcff4bcc44037484e83802fbc

  //AppData.cacheDirty().then(() => {
    AppData.classRelations(userSettings.getValue().filters).then(d=>classRelations.next(d));
    AppData.conceptCount(userSettings.getValue().filters).then(d=>conceptCount.next(d));
    AppData.conceptStats(userSettings.getValue().filters).then(d=>conceptStats.next(d));
  //})

* was in AxxppState initialize:
  tableConfig.next(_appSettings.tables);
  conceptStats.subscribe(
    cs => {
      var sbt = _.supergroup(cs, ['table_name','column_name','domain_id','vocabulary_id']);
      statsByTable.next(sbt);
    });
}

function tableSetup() { // not using right now, but keep just in case
  _appSettings.tableList = 
    _.map(_appSettings.tables, 
          (table, tableName) => {
            table.tableName = table.tableName || tableName;
            table.rank = table.rank || 300;
            table.headerLevel = (table.rank).toString().length - 1;
            if (table.headerLevel > 1) 
              table.hidden = true;
            return table;
          });
  _appSettings.tableList = _.sortBy(_appSettings.tableList, ['rank','tableName']);
}

export class Tables extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    this.statsByTable = AxxppState.statsByTable
          .subscribe(statsByTable=>this.setState({statsByTable}));
    this.tableConfig = AxxppState.tableConfig
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
                            - {commify(table.aggregate(_.sum, 'concept_count'))} concepts,
                            - {commify(table.aggregate(_.sum, 'record_count'))} database records
                        </p>,
      childConfig: {
        kids: table=>table.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
        kidTitle: column => <div><h3>{column.toString()} concept domains</h3>{column.children.join(', ')}</div>,
        kidContent: column=><p>
                            <strong>{column.toString()}</strong> {' '}
                              - {commify(column.aggregate(_.sum, 'concept_count'))} concepts,
                              - {commify(column.aggregate(_.sum, 'record_count'))} database records
                          </p>,
        childConfig: {
          kids: column=>column.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
          kidTitle: domain => <div><h3>{domain.toString()} vocabularies</h3>{domain.children.join(', ')}</div>,
          kidContent: domain=><p>
                              <strong>{domain.toString()}</strong> {' '}
                                - {commify(domain.aggregate(_.sum, 'concept_count'))} concepts,
                                - {commify(domain.aggregate(_.sum, 'record_count'))} database records
                            </p>,
          childConfig: {
            kids: domain=>domain.children.filter(c=>!(tableConfig[c.toString()]||{}).hidden),
            kidTitle: vocab => <div><h3>{vocab.toString()}</h3>{vocab.children.join(', ')}</div>,
            kidContent: vocab=><p>
                                <strong>{vocab.toString()}</strong> {' '}
                                  - {commify(vocab.aggregate(_.sum, 'concept_count'))} concepts,
                                  - {commify(vocab.aggregate(_.sum, 'record_count'))} database records
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
export class Search extends Component {
  constructor(props) {
    super(props);
    let cols = [
       'table_name', 
       'targetorsource',
       'column_name',
       'type_concept_name',
        'domain_id', 'vocabulary_id', 'concept_class_id',
        'standard_concept', 'invalid_reason', 'concept_count', 'record_count', 
      ].map(c => _.find(coldefs, {colId: c}));
    this.state = { filters:{}, cols };
  }
  componentDidMount() {
    this.filtSub = AxxppState.subscribeState(
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
    new AxxppState.ApiStream({
        apiCall: 'concept_groups', 
        params: {...filters, 
          //query:'conceptStats', targetOrSource: 'both', dataRequested: 'agg',
        },
        /* parseInt happened at server now
        transformResults: 
          (results) => {
            let recs = results.map(rec=>{
              return _.merge({}, rec, {
                concept_count: parseInt(rec.concept_count, 10),
                record_count: parseInt(rec.record_count, 10),
              });
            });
            console.log('new search results for', filters);
            return recs;
            //let sbt = _.supergroup(recs, ['table_name','column_name','domain_id','vocabulary_id']);
            //return sbt;
          },
          * /
        //cb: statsByTable => { this.setState({statsByTable}); }
        cb: concept_groups => { this.setState({concept_groups}); }
      });
  }
  render() {
    let {concept_groups, cols} = this.state;
    console.log(concept_groups, cols);
    return (
              <AgTable coldefs={cols} data={concept_groups}
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
              * /
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
*/

export class AgTable extends Component {
  constructor(props) {
    super(props);
    const {id} = props;
    if (_.has(AgTable.instances, id)) {
      console.error(`agGrid.${id} AgTable already exists`, id);
      let instance = AgTable.instances[id];
      return instance;
    }
    //this.initializeGridState = this._initializeGridState.bind(this);
    this.onGridReady = this.onGridReady.bind(this);
    this.saveGridState = this.saveGridState.bind(this);
    this.state = { 
      gridState: myrouter.getQuery(`agGrid.${id}`),
    };
  }
  saveGridState(p) { // for dealing with user changes but also gets called during init
    const {id} = this.props;
    const {gridReady, gridState} = this.state;
    if (!this.grid || !(p === 'fromOnGridReady' || gridReady)) return;
    if (p === 'fromOnGridReady') {
      if (gridState && gridState.columnState) {
        this.grid.columnApi.setColumnState(gridState.columnState);
        return;
      }
    }
    console.log('in saveGridState', this.state, this.grid.api.getSortModel());
    //if (this.state.status !== 'initialized') return true;
    var newGridState = {};

    let columnState = this.grid.columnApi.getColumnState();
    if (!_.isEmpty(columnState)) newGridState.columnState = columnState;
    let sortModel = this.grid.columnApi.getColumnState();
    if (!_.isEmpty(sortModel)) newGridState.sortModel = sortModel;
    let filterModel = this.grid.columnApi.getColumnState();
    if (!_.isEmpty(filterModel)) newGridState.filterModel = filterModel;

    if (_.isEqual(gridState, newGridState)) return;
console.log('NOT SAVING TABLE CHANGES RIGHT NOW')
    //myrouter.addParam(`agGrid.${id}`, newGridState);
    this.setState({gridState: newGridState});
    this.grid.columnApi.setColumnState(newGridState.columnState);
    //if (gridState.sortModel && gridState.sortModel.length) this.grid.api.setSortModel(gridState.sortModel);
    //if (gridState.filterModel && gridState.filterModel.length) this.grid.api.setFilterModel(gridState.filterModel);
  }
  onGridReady(grid) {
    this.grid = grid;
    this.setState({gridReady: true});
    this.saveGridState('fromOnGridReady');
  }
  componentDidMount() {
    this.forceUpdate();
  }
  componentDidUpdate(prevProps, prevState) {
    const {id} = this.props;
    const {gridReady, gridState} = this.state;
    if (!gridReady || !gridState) return;
    //updateReason(prevProps, prevState, this.props, this.state, 'TableStuff/AgGrid');
    if (this.props.data.length) this.grid.api.hideOverlay();
    if (!_.isEmpty(gridState.columnState))
      this.grid.columnApi.setColumnState(gridState.columnState);

    // not using this right now
    // const {columnSettings} = this.props; if (columnSettings) this.grid.columnApi.setColumnState(columnSettings);

    /*
    if (gridState.columnState) {
      this.grid.columnApi.setColumnState(gridState.columnState);
    }
    if (gridState.sortModel && gridState.sortModel.length)
      this.grid.api.setSortModel(gridState.sortModel);
    if (gridState.filterModel && gridState.filterModel.length)
      this.grid.api.setFilterModel(gridState.filterModel);
    */
  }
  shouldComponentUpdate(nextProps, nextState) {
    //if (this.state.status !== 'ready') return false;
    let stateChange = !_.isEqual(this.state, nextState);
    let propsChange = !_.isEqual(this.props, nextProps);
    //console.log(this.state, nextState, 'stateChange', stateChange);
    //console.log(this.props, nextProps, 'propsChange', propsChange);
    return stateChange || propsChange;
  }
  componentWillUnmount() {
    const {id} = this.props;
    delete AgTable.instances[id];
  }
  render() {
    const {coldefs, data=[], height=400, width='100%'} = this.props;
    let autoColDefs = data.length && 
          _.keys(data[0])
           .filter(col => _.isNumber(data[0][col]) || _.isString(data[0][col]))
           .map(col=>{
              return {  headerName: col,
                      colId: col,
                      valueGetter: ({data:d}={}) => d[col],
            }});
    return (
            <Panel>
              <Label>
                {data.length} rows
              </Label>
              <br/>
              <div style={{height, width}} className="ag-fresh">
                <AgGridReact
                  onGridReady={this.onGridReady}
                  columnDefs={coldefs || autoColDefs}
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
                  onColumnMoved={this.saveGridState}
                  onColumnVisible={this.saveGridState}
                  //onColumnEverythingChanged={this.saveGridState.bind(this)}
                  onSortChanged={this.saveGridState}
                  onFilterChanged={this.saveGridState}
                />
              </div>
            </Panel>);
  }
}
AgTable.propTypes = {
  id: React.PropTypes.string.isRequired,
}
AgTable.instances = {};

export class ConceptTree extends Component {
  //breaking ConceptTree so it won't work how it was supposed to before
  constructor(props) {
    super(props);
    this.state = { };
  }
  componentWillReceiveProps(nextProps) {
    // FIX
    if (!_.isEqual(this.props.recs, nextProps.recs)) {
      let {recs, treeFunc} = nextProps
      let tree = treeFunc(recs);
      /*
      let tree = _.supergroup(nextProps.agg,
            ['domain_id','vocabulary_id',
              'standard_concept','invalid_reason',
              'type_concept_name',
              'concept_class_id']);
      */
      this.setState({tree});
    }
  }
  render() {
    const {selectCb=d=>console.log('Concepttree selection',d)} = this.props;
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
          headerName: "Exposure Count", field: "record_count", width: 130,
          cellRenderer: params => commify(params.data.aggregate(_.sum, 'record_count')),
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
  render() { // base on AgTable instead of AgGridReact?
    const {
            //rowSelect, 
            coldefs, tree, 
            height=400, width='100%'
           } = this.props;


    // TEMPORARY!
    let autoColDefs = tree && tree.records.length && 
          _.keys(tree.records[0]).map(col=>{
            return {  headerName: col,
                      colId: col,
                      valueGetter: ({data:d}={}) => d[col],
            }});



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
                  columnDefs={coldefs || autoColDefs}
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

export const coldefs = [
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
    colId: 'concept_count',
    field: 'concept_count',
    cellFormatter: ({value}={}) => isNaN(value) ? '' : commify(value),
    //sortingOrder: ['desc','asc']
  },
  {
    headerName: 'CDM Occurrences',
    colId: 'record_count',
    field: 'record_count',
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
    headerName: 'Concept',
    colId: 'targetorsource',
    valueGetter: ({data:d}={}) => d.targetorsource,
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
];

