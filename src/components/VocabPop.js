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
var d3v4 = require('d3');
var $ = require('jquery');
import * as util from '../utils';
//if (DEBUG) window.d3 = d3;
if (DEBUG) window.util = util;
import _ from 'supergroup'; // in global space anyway...
import ConceptData from './ConceptData';
import {VocabMapByDomain} from './VocabMap';

var sigma = require('sigma');
var d3v3 = window.d3;
//var d3v3 = d3v4;
//var d3v3 = require('./d3.min');
//require('sigma/plugins/sigma.layout.forceAtlas2/supervisor');
//require('sigma/plugins/sigma.layout.forceAtlas2/worker');
//import 'tipsy/src/stylesheets/tipsy.css';
require('./stylesheets/Vocab.css');
require('tipsy/src/javascripts/jquery.tipsy');
var dagreD3 = require('dagre-d3');
//require('./VocabPop.css');


window._ = _; 

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
require('./fileBrowser.css');

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

export class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    this.stateSub = AppState.subscribeState('', state => this.setState(state));
  }
  componentWillUnmount() {
    this.stateSub.unsubscribe();
  }
  render() {
    //const {filters, domain_id} = this.props;
    var conceptCount = this.state.conceptCount || 0;
    console.log(this.props);
    return  <div>
              {/*
              <div>
                <ConceptContainer filters={filters} domain_id={domain_id} />
              </div>
              */}
              <Inspector search={false} 
                data={ AppState.getState() } />
              <br/>
              Current concepts: { commify(conceptCount) }
            </div>;
  }
}

export class ConceptContainer extends Component {
  render() {
    const {filters, domain_id} = this.props;
    let cols = [
        'targetorsource', 'type_concept_name', 'domain_id', 'vocabulary_id', 'concept_class_id',
        'standard_concept', 'concept_count', 'record_count', 
      ].map(c => _.find(coldefs, {colId: c}));
    // all the important data fetching should be happening in ConceptData now
    if (!domain_id) {
      //return <Junk/>;
      return  <ConceptData filters={filters} >
                <DomainMap />
              </ConceptData>;
    }
    return  <ConceptData filters={filters} domain_id={domain_id} >
              <ConceptBrowse cols={cols} domain_id={domain_id}/>
            </ConceptData>;
  }
}
class DomainMap extends Component {
  constructor(props) {
    super(props);
    this.state = {updates:0};
  }
  componentDidMount() {
    this.setState({updates: this.state.updates+1}); // force a rerender after div ref available
  }
  componentDidUpdate() {
    const { vocgroups } = this.props;
    if (_.isEmpty(vocgroups)) return;
    let sg = _.supergroup(vocgroups, "domain_id");
    sg.addLevel(d=>_.uniq(d.dcgs.map(e=>e.vals[0])).sort(),
                {dimName:'ddom',multiValuedGroup:true});
    let y = d3v4.scaleQuantize().domain(d3v4.extent(sg.map(d=>d.getChildren(true).length)))
                              .range(_.range(1,6).reverse());

    var dagre = new dagreD3.graphlib.Graph().setGraph({});
    window.dagre = dagre;
    sg.forEach((d,i)=>{
      let node = {
              id:d.toString(), 
              size:d.toString().length,
              label:d.toString(),
              //x: i % 5,
              //y: y(d.getChildren(true).length),
              val: d,
              rx:5, ry:5,
            }
      dagre.setNode(node.id, node);
    });
    sg.leafNodes().filter(d=>d.parent).map(d=>{
      let edge = {
                id: d.namePath(),
                source: d.parent.toString(),
                target: d.toString(),
                sval: d.parent,
                tval: d,
            }
      dagre.setEdge(edge.source, edge.target, {label: ''});
    });
    // Create the renderer
    var render = new dagreD3.render();
    var svg = d3v3.select(this.graphDiv),
        inner = svg.append("g");

    // Set up zoom support
    //var zoom = d3v3.behavior.zoom().on("zoom", function() {})
    var zoom = d3v3.behavior.zoom().on("zoom", function() {
        inner.attr("transform", "translate(" + d3v3.event.translate + ")" +
                                    "scale(" + d3v3.event.scale + ")");
      });
    svg.call(zoom);

    // Simple function to style the tooltip for the given node.
    var styleTooltip = function(name, description) {
      console.log(name);
      return "<p class='name'>" + name + "</p>";
      //return "<p class='name'>" + name + "</p><p class='description'>" + description + "</p>";
    };

    // Run the renderer. This is what draws the final graph.
    render(inner, dagre);

    inner.selectAll("g.node")
      .attr("title", function(v) { return styleTooltip(v, dagre.node(v).description) })
      .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

    // Center the graph
    var initialScale = 0.75;
    zoom
      .translate([(svg.attr("width") - dagre.graph().width * initialScale) / 2, 20])
      .scale(initialScale)
      .event(svg);
    svg.attr('height', dagre.graph().height * initialScale + 40);


    /*
    let elements = {
      nodes: sg.map((d,i)=>{return {
                id:d.toString(), 
                size:d.toString().length,
                label:d.toString(),
                x: i % 5,
                y: y(d.getChildren(true).length),
                val: d,
              }}),
      edges: sg.leafNodes().filter(d=>d.parent).map(d=>{return {
                  id: d.namePath(),
                  source: d.parent.toString(),
                  target: d.toString(),
                  sval: d.parent,
                  tval: d,
              }}),
    };
    this.sigmaInstance = this.sigmaInstance || sigmaSimple(this.graphDiv, elements);
    */
  }
  render() {
    const { vocgroups, concept_groups } = this.props;
    //console.log(vocgroups, concept_groups);

    return <div className="junk">
              <svg ref={div=>this.graphDiv=div} className="domain-map"
                  style={{width:960, height:600}}
              />
            </div>;
    /*
    return <pre>{
                sg.sortBy(d=>-d.getChildren().length)
                  .map(d=>d + '  -->  ' + d.getChildren(true).map(String))
                  .join('\n')
            }</pre>
    */
  }
}
function sigmaSimple(domnode, elements) {
  let s = new sigma({
    container: domnode,
    graph: { ...elements }, // should contain nodes and edges
    settings: {
      //enableHovering: false,
      //mouseEnabled: false,
      //eventsEnabled: false,
      //labelThreshold: 6,
    }
  });
  /*
  let cam = s.addCamera();
  s.addRenderer({
    container: domnode,
    type: 'svg',
    camera: cam,
    settings: {
      hideEdgesOnMove: true,
      defaultLabelColor: '#fff',
      defaultNodeColor: '#999',
      defaultEdgeColor: '#333',
      edgeColor: 'default',
      labelSize: 'proportional',
    }
  });
  */
  //s.startForceAtlas2({worker: true, barnesHutOptimize: false});
  s.refresh();
  window.elements = elements;
  window.s = s;
}
class ConceptBrowse extends Component {
  constructor(props) { 
    super(props); 
    this.state = {ww:$(window).width(), wh:$(window).height()}; 
  }
  componentDidMount() {
    const {concept_groups} = this.props;
    if (concept_groups && concept_groups.length)
      this.setState({concept_groups});
  }
  componentDidUpdate(prevProps, prevState) {
    const {concept_groups, domain_id, } = this.props;
    const { w, h, ww, wh } = this.state;
    if (concept_groups && concept_groups.length && 
        concept_groups !== prevProps.concept_groups) {
      let cg = domain_id 
        ? (concept_groups||[]).filter(d=>d.domain_id===domain_id) : concept_groups;
      let newState = {cg};
      if (!w || $(window).width() !== ww) newState.w = $(window).width() * .7;
      if (!h || $(window).height() !== wh) newState.h = $(window).height() * .8;
      this.setState(newState);
    }

  }
  render() {
    const { children, counts, agg, cols} = this.props;
    const { cg, w, h } = this.state;
            
    return  <div style={{width:w, height:h}}
                  className="concept-browse"
            >
                <VocabMapByDomain
                          concept_groups={cg}
                          width={w}
                          height={h}
                />
            </div>;


    // turning this stuff off for a while. the aggrid was going really slow
            // starting i think when a lot of renders were being called
    return  <div>
              <div style={{clear:'both'}}>
                <h5>Concept Tree</h5>
                <AgTable coldefs={cols} data={agg}
                      width={800} height={200}
                      id="Agg"
                />
                <ConceptTree agg={agg} />
              </div>
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
                  Concept type<br/>
                  Concept class<br/>
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
class ConceptTree extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }
  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.agg, nextProps.agg)) {
      let tree = _.supergroup(nextProps.agg,
            ['domain_id','vocabulary_id',
              'standard_concept','invalid_reason',
              'type_concept_name',
              'concept_class_id']);
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

    // this still necessary?
    setTimeout(()=>this.setState({status: 'initialized'}),500);
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





// not using Tables component, but worth looking at before deleting
/* if reviving, will need some of this:
export var conceptCount = new Rx.BehaviorSubject(0);
* was in AppState:
export var tableConfig = new Rx.BehaviorSubject({});
export var statsByTable = new Rx.BehaviorSubject([]);
export var conceptStats = new Rx.BehaviorSubject([]);
function fetchData() {
  console.log("NOT FETCHING DATA");
  AppData.cacheDirty().then(() => {
    AppData.classRelations(userSettings.getValue().filters).then(d=>classRelations.next(d));
    AppData.conceptCount(userSettings.getValue().filters).then(d=>conceptCount.next(d));
    AppData.conceptStats(userSettings.getValue().filters).then(d=>conceptStats.next(d));
  })

* was in AppState initialize:
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
*/

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
    let fsScale = d3v4.scaleLinear().domain([0,6]).range([120,60]);
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
/*
export class Concepts extends Component {
  render() {
    if (false) return null; // avoid lint warning
    throw new Error("haven't tried this for a while");
    /*
    const {conceptCount, breakdowns, conceptStats} = this.props;
    //{commify(conceptStats.length)} used in database<br/>
                          //{bd.aggregate(_.sum, 'concept_count')} concepts, {' '}
                          //{bd.aggregate(_.sum, 'record_count')} database records {' '}
                          //{commify(_.sum(bd.records.map(d=>d.concept_count)))} concepts, {' '}
                          //{commify(_.sum(bd.records.map(d=>d.record_count)))} database records {' '}
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
    * /
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
    * /
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
    * /
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
    new AppState.ApiStream({
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
*/
class Junk extends Component {
  componentDidMount() {
    // Create a new directed graph
    var g = new dagreD3.graphlib.Graph().setGraph({});

    // States and transitions from RFC 793
    var states = {
      CLOSED: {
        description: "represents no connection state at all.",
        style: "fill: #f77"
      },

      LISTEN: {
        description: "represents waiting for a connection request from any " +
                    "remote TCP and port."
      },

      "SYN SENT": {
        description: "represents waiting for a matching connection " +
                    "request after having sent a connection request."
      },

      "SYN RCVD": {
        description: "represents waiting for a confirming connection " +
                    "request acknowledgment after having both received and sent a " +
                    "connection request."
      },


      ESTAB: {
        description: "represents an open connection, data received " +
                    "can be delivered to the user.  The normal state for the data " +
                    "transfer phase of the connection.",
        style: "fill: #7f7"
      },

      "FINWAIT-1": {
        description: "represents waiting for a connection termination " +
                    "request from the remote TCP, or an acknowledgment of the " +
                    "connection termination request previously sent."

      },

      "FINWAIT-2": {
        description: "represents waiting for a connection termination " +
                    "request from the remote TCP."
      },


      "CLOSE WAIT": {
        description: "represents waiting for a connection termination " +
                    "request from the local user."
      },

      CLOSING: {
        description: "represents waiting for a connection termination " +
                    "request acknowledgment from the remote TCP."
      },

      "LAST-ACK": {
        description: "represents waiting for an acknowledgment of the " +
                    "connection termination request previously sent to the remote " +
                    "TCP (which includes an acknowledgment of its connection " +
                    "termination request)."
      },

      "TIME WAIT": {
        description: "represents waiting for enough time to pass to be " +
                    "sure the remote TCP received the acknowledgment of its " +
                    "connection termination request."
      }
    };

    // Add states to the graph, set labels, and style
    Object.keys(states).forEach(function(state) {
      var value = states[state];
      value.label = state;
      value.rx = value.ry = 5;
      g.setNode(state, value);
    });

    // Set up the edges
    g.setEdge("CLOSED",     "LISTEN",     { label: "open" });
    g.setEdge("LISTEN",     "SYN RCVD",   { label: "rcv SYN" });
    g.setEdge("LISTEN",     "SYN SENT",   { label: "send" });
    g.setEdge("LISTEN",     "CLOSED",     { label: "close" });
    g.setEdge("SYN RCVD",   "FINWAIT-1",  { label: "close" });
    g.setEdge("SYN RCVD",   "ESTAB",      { label: "rcv ACK of SYN" });
    g.setEdge("SYN SENT",   "SYN RCVD",   { label: "rcv SYN" });
    g.setEdge("SYN SENT",   "ESTAB",      { label: "rcv SYN, ACK" });
    g.setEdge("SYN SENT",   "CLOSED",     { label: "close" });
    g.setEdge("ESTAB",      "FINWAIT-1",  { label: "close" });
    g.setEdge("ESTAB",      "CLOSE WAIT", { label: "rcv FIN" });
    g.setEdge("FINWAIT-1",  "FINWAIT-2",  { label: "rcv ACK of FIN" });
    g.setEdge("FINWAIT-1",  "CLOSING",    { label: "rcv FIN" });
    g.setEdge("CLOSE WAIT", "LAST-ACK",   { label: "close" });
    g.setEdge("FINWAIT-2",  "TIME WAIT",  { label: "rcv FIN" });
    g.setEdge("CLOSING",    "TIME WAIT",  { label: "rcv ACK of FIN" });
    g.setEdge("LAST-ACK",   "CLOSED",     { label: "rcv ACK of FIN" });
    g.setEdge("TIME WAIT",  "CLOSED",     { label: "timeout=2MSL" });

    // Create the renderer
    var render = new dagreD3.render();
    var svg = d3v3.select(this.graphDiv),
        inner = svg.append("g");

    // Set up zoom support
    var zoom = d3v3.behavior.zoom().on("zoom", function() {
        inner.attr("transform", "translate(" + d3v3.event.translate + ")" +
                                    "scale(" + d3v3.event.scale + ")");
      });
    svg.call(zoom);

    // Simple function to style the tooltip for the given node.
    var styleTooltip = function(name, description) {
      return "<p class='name'>" + name + "</p><p class='description'>" + description + "</p>";
    };

    // Run the renderer. This is what draws the final graph.
    render(inner, g);

    inner.selectAll("g.node")
      .attr("title", function(v) { return styleTooltip(v, g.node(v).description) })
      .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

    // Center the graph
    var initialScale = 0.75;
    zoom
      .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
      .scale(initialScale)
      .event(svg);
    svg.attr('height', g.graph().height * initialScale + 40);
  }
  render() {
    return <div className="junk">
              <svg ref={div=>this.graphDiv=div} className="domain-map"
                  style={{width:960, height:600}}
              />
            </div>;
    //return <div>nothing yet</div>;
  }
}
