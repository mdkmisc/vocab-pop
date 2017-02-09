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
import React, { Component } from 'react';
import { Glyphicon
          //Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, FormGroup, Radio Panel, Accordion, Label
       } from 'react-bootstrap';
var d3 = require('d3');
import _ from 'supergroup'; // in global space anyway
var $ = require('jquery'); window.$ = $;

import * as AppState from '../AppState';
import {commify} from '../utils';

var sigma = require('sigma');
window.sigma = sigma;
var neighborhoods = require('sigma/build/plugins/sigma.plugins.neighborhoods.min');

import sigmaReactRenderer from './sigmaSvgReactRenderer';
sigmaReactRenderer(sigma);

function eventPerspective(me, evt, neighbors) {
  if (me === evt) return 'self';
  if (_.includes(neighbors, me)) return 'neighbor';
  return 'other';
}
export class VocNode extends Component {
  // these get made by sigmaSvgReactRenderer
  constructor(props) {
    super(props);
    this.state = {w:0, h:0};
  }
  componentDidMount() {
    const {sigmaNode, sigmaSettings} = this.props;
    sigmaNode.update = this.update.bind(this);
    let self = this;
    AppState.ephemeralEventStream.subscribe(
      e => {
        let eventNodeId = e.jqEvt.target.closest('foreignObject').getAttribute('data-node-id');
        var neighbors = sigmaNode.sigmaInstance.graph.neighborhood(eventNodeId);
        switch (eventPerspective(sigmaNode.id, eventNodeId, neighbors.nodes.map(d=>d.id))) {
          case 'self':
            switch (e.jqEvt.type) {
              case 'mouseover':
                self.setState({hover:true});
                break;
              case 'mouseout':
                self.setState({hover:false});
                break;
              case 'click':
                if (_.includes(e.jqEvt.target.classList,'glyphicon-zoom-in')) {
                  self.setState({zoom:true});
                } else if (_.includes(e.jqEvt.target.classList,'glyphicon-list')) {
                  self.setState({list:true});
                }
                break;
              default:
                console.log('unhandled', e.jqEvt.type, 'node event on', sigmaNode.id);
            }
            break;
          case 'neighbor':
            switch (e.jqEvt.type) {
              case 'mouseover':
                self.setState({neighborHover:true});
                break;
              case 'mouseout':
                self.setState({neighborHover:false});
                break;
              case 'click':
                if (_.includes(e.jqEvt.target.classList,'glyphicon-zoom-in')) {
                  self.setState({zoom:false});
                } else if (_.includes(e.jqEvt.target.classList,'glyphicon-list')) {
                  self.setState({list:false});
                }
                break;
              default:
                console.log('unhandled', e.jqEvt.type, 'node event on', sigmaNode.id);
            }
            break;
          case 'other':
            switch (e.jqEvt.type) {
              case 'mouseover':
                self.setState({mute:true});
                break;
              case 'mouseout':
                self.setState({mute:false});
                break;
              case 'click':
                if (_.includes(e.jqEvt.target.classList,'glyphicon-zoom-in')) {
                  self.setState({zoom:false});
                } else if (_.includes(e.jqEvt.target.classList,'glyphicon-list')) {
                  self.setState({list:false});
                }
                break;
              default:
                console.log('unhandled', e.jqEvt.type, 'node event on', sigmaNode.id);
            }
            break;
          default:
            console.log('weird perspective in node event from', sigmaNode.id);
        }
      });
  }
  update(node, el, settings) {
    const {sigmaNode, sigmaSettings} = this.props;
    let w=0,h=0;
    if (this.content) {
      this.content.style.position = 'absolute';
      let cbr = this.content.getBoundingClientRect(); 
      this.content.style.position = '';
      w = cbr.width; 
      h = cbr.height;
    }
    this.setState({node, el, settings, w, h});
  }
  nodeEvent(e) {
    console.log('react event', this, e);
    debugger;
  }
  render() {
    const {sigmaNode, sigmaSettings} = this.props;
    const {node, el, settings, w, h, hover, mute, zoom, list} = this.state;
    let prefix = sigmaSettings('prefix') || '';

    if (sigmaNode.sgVal.records.length !== 1) throw new Error("expected one record");
    let rec = sigmaNode.sgVal.records[0];
    let classVal = rec.drill.lookup('class_concept_id');
    let conceptClasses = classVal ? classVal.getChildren() : [];
    //console.log(conceptClasses.join('\n'));

    let zoomContent = '';
    if (zoom) {
      zoomContent = <div>ZOOM!</div>;
    }
    
    let icons = '';
    icons = <span className="icons" // sigma chokes on events for elements without classes
              style={{display:this.state.hover ? 'inline' : 'none',}}
            >
              <Glyphicon glyph="zoom-in" style={{pointerEvents:'auto'}}
                onClick={this.nodeEvent.bind(this)}
                title="Drill down to concept classes"
                //onMouseOver={this.nodeEvent.bind(this)}
                //onMouseOut={this.nodeEvent.bind(this)}
              />
              <Glyphicon glyph="list" style={{pointerEvents:'auto'}} 
                title="Show sample records"
              />
            </span>;
                  
    return (<foreignObject r="6"
              data-node-id={sigmaNode.id}
              className={ (sigmaNode.classes || '')
                          + (mute ? ' muted' : '')}
              x={sigmaNode[`${prefix}x`] - w/2}
              y={sigmaNode[`${prefix}y`] - h/2}
              width={w}
              height={h}
              onClick={this.nodeEvent.bind(this)}
              //onMouseOver={this.nodeEvent.bind(this)}
              //onMouseOut={this.nodeEvent.bind(this)}
            >
              <div  className="voc-div" ref={d=>this.content=d} >
                <div className="caption" >
                  {sigmaNode.caption}
                  {conceptClasses.length === 1 && conceptClasses[0]+'' !== sigmaNode.caption
                    ? conceptClasses.map(d=>' ' + d) : ''}
                  {icons}
                </div>
                { sigmaNode.counts 
                  ?  _.map(sigmaNode.counts,
                          (v,k)=> <div className={"info " + k} key={k}>
                                    {k}:&nbsp;{commify(v)}
                                  </div>)
                  : ''}
                {zoomContent}
              </div>
            </foreignObject>);
  }
}

export class VocEdge extends Component {
  // these get made by sigmaSvgReactRenderer
  constructor(props) {
    super(props);
    this.state = {w:0, h:0};
  }
  componentDidMount() {
    const {sigmaEdge, sigmaSource, sigmaTarget, sigmaSettings} = this.props;
    sigmaEdge.update = this.update.bind(this);
    let self = this;
    AppState.ephemeralEventStream.subscribe(
      e => {
        // these (so far) are just node events
        let nodeId = e.jqEvt.target.closest('foreignObject').getAttribute('data-node-id');
        if (sigmaSource.id === nodeId || sigmaTarget.id === nodeId) {
          // event on this edge
          switch (e.jqEvt.type) {
            case 'mouseover':
              self.setState({hover:true});
              break;
            case 'mouseout':
              self.setState({hover:false});
              break;
            case 'click':
              break;
            default:
              console.log('unhandled', e.jqEvt.type, 'edge event on', sigmaEdge.id);
          }
        } else {
          // event on another edge
          switch (e.jqEvt.type) {
            case 'mouseover':
              self.setState({mute:true});
              break;
            case 'mouseout':
              self.setState({mute:false});
              break;
            case 'click':
              break;
            default:
              console.log('unhandled', e.jqEvt.type, 'edge event on', sigmaEdge.id);
          }
        }
      });
    this.setState({mounted:true}); // force a rerender after div ref available
  }
  update(edge, el, source, target, settings) {
    const {sigmaEdge, sigmaSource, sigmaTarget, sigmaSettings} = this.props;
    let w=0,h=0;
    if (!this.path) return;
    let path = this.path;
    var prefix = settings('prefix') || '';
    path.setAttributeNS(null, 'stroke-width', edge[prefix + 'size'] || 1);

    // Control point
    var cx = (source[prefix + 'x'] + target[prefix + 'x']) / 2 +
      (target[prefix + 'y'] - source[prefix + 'y']) / 4,
        cy = (source[prefix + 'y'] + target[prefix + 'y']) / 2 +
      (source[prefix + 'x'] - target[prefix + 'x']) / 4;

    // Path
    var p = 'M' + source[prefix + 'x'] + ',' + source[prefix + 'y'] + ' ' +
            'Q' + cx + ',' + cy + ' ' +
            target[prefix + 'x'] + ',' + target[prefix + 'y'];

    // Updating attributes
    path.setAttributeNS(null, 'd', p);
    path.setAttributeNS(null, 'fill', 'none');

    // Showing
    path.style.display = '';
    this.setState({edge, el, settings, w, h});
  }
  render() {
    const {sigmaEdge, sigmaSource, sigmaTarget, sigmaSettings, classes} = this.props;
    const {hover, mute} = this.state;
    let prefix = sigmaSettings('prefix') || '';
    return <path ref={p=>this.path=p} 
            data-edge-id={sigmaEdge.id}
            className={classes}
            className={ (classes || '') + (mute ? ' muted' : '')}
            />;
  }
}

let maxNodesPerRow = 5; // actual rows will have twice this to make room for stubs
                        // though not using stubs right now (they're for wayppoints,
                        // which are for drawing edges between nodes)
let rowsBetweenLayers = 1;
function sigmaGraph(sg, domnode, w, h, boxw, boxh, msgDiv) {
  function makeNode(id, label, layer, parent) {
    let node = { id, size: 1, type: 'react', };
    if (typeof label !== 'undefined') node.caption = label;
    if (typeof layer !== 'undefined') {
      node.layer = layer;
      node.layerIdx = nodesInLayers[layer]++;
    }
    if (typeof parent !== 'undefined') node.parent = parent;
    return node;
  }
  let nodesInLayers = [0,0,0]; // counter for nodes in each layer
  let nodes = _.flatten(sg.map(sc=>sc.getChildren().map(voc=>{
                    let counts = {};
                    ['rc','src','drc','dsrc']
                          .filter(fld=>voc.aggregate(_.sum,fld))
                          .forEach(fld=>counts[fld] = voc.aggregate(_.sum,fld));
                    let biggest = _.isEmpty(counts) ?
                          '' : _.last(_.sortBy(_.toPairs(counts), 1))[0];
                    let id = voc.namePath(','),
                        label = voc.toString(), // + ' ' + biggest,
                          /*
                        info =
                          [voc.toString()].concat(_.map(counts,
                            (cnt,fld) => `<div class="${fld}">${fld}:&nbsp;${commify(cnt)}</div>`
                                        )).join('\n'),
                          */
                        layer = ({'C': 0, 'S': 1, 'X': 2})[sc.toString()],
                        parent = ['Classification','Standard','Source'][layer];
                    let node = makeNode(id, label,layer, parent);
                    //node.info = info;
                    node.biggestCount = biggest;
                    node.classes = `${biggest} voc-node sigma-node`;
                    node.sgVal = voc;
                    node.counts = counts;
                    return node;
                  })));
  // split wide layers
  //let rowsInLayers = nodesInLayers.map((nodesInLayer,i) => Math.ceil(nodesInLayer / maxNodesPerRow));
  
  let nodesInRowsByLayer = 
        _.map(nodesInLayers, 
              nodesInLayer => {
                let remainingNodes = nodesInLayer, rowInLayerIdx = 0, rows = [];
                while (remainingNodes) {
                  let nodesInRow = remainingNodes > maxNodesPerRow
                                    ? maxNodesPerRow - rowInLayerIdx % 2
                                    : remainingNodes;
                  remainingNodes -= nodesInRow;
                  rows.push(nodesInRow);
                  rowInLayerIdx++;
                }
                return rows;
              });
  //console.log(nodesInRowsByLayer.join('\n'));
  let layerStartRows = 
        nodesInRowsByLayer
          .map(d=>d.length)
          .map((d,i,a) => _.sum(a.slice(0,i)) + i * rowsBetweenLayers + i * 1);
  window.colOffset = colOffset; // need console access to function while testing
  //let rowContentsForWayPoints = {}; // was working for waypoints, but not using waypoints now
                                      // and need rowContents for re-adjusting pos after size available
                                      // which is going to mess up waypoints anyway
  nodes.filter(d=>!d.isParent).forEach((node) => {
    let nodesInRows = nodesInRowsByLayer[node.layer];
    nodesInRows.forEach(
            (nodesInRow,i) => {
              if (
                    node.layerIdx >= _.sum(nodesInRows.slice(0, i)) &&
                    node.layerIdx <  _.sum(nodesInRows.slice(0, i + 1))
                 ) {
                      node.rowInLayer = i;
                      node.row = node.rowInLayer + layerStartRows[node.layer] + 1;

                      node.rowIdx = node.layerIdx -  // rowIdx == idx within the row
                                          _.sum(nodesInRows.slice(0, i));
                      node.col = node.rowIdx * 2
                                        + colOffset(node.rowInLayer,
                                                    nodesInRowsByLayer[node.layer]);
              }
            });
    // replacing waypoints stuff because not using, but might need again sometime
    //let row = _.get(rowContentsForWayPoints, [node.row, node.col]) || [];
    //row.push(node);
    //_.set(rowContentsForWayPoints, [node.row, node.col], row);
  });
  let x = d3.scaleLinear().domain([-2,d3.max(nodes.map(d=>d.col))]);
  let y = d3.scaleLinear().domain(d3.extent(nodes.map(d=>d.row))).range([.2,.8]);
  window.x = x; window.y = y;
  nodes.forEach(node => {
    node.x = x(node.col);
    node.y = y(node.row);
  });
  let lowestX = _.min(nodes.map(d=>d.x));
  let nodeGroups = [
        { classes: 'sigma-node parent', isParent: true, id: 'Classification', caption: 'Classification', x:x(-2), y:y(layerStartRows[0]), size:2 },
        { classes: 'sigma-node parent', isParent: true, id: 'Standard', caption: 'Standard', x:x(-2), y:y(layerStartRows[1]), size:2 },
        { classes: 'sigma-node parent', isParent: true, id: 'Source', caption: 'Source', x:x(-2), y:y(layerStartRows[2]), size:2 },
  ];
  nodes = nodes.concat(nodeGroups);
  
  let edges = 
    _.flatten(sg.leafNodes()
              .filter(d=>d.dim==='linknodes')
              .filter(d=>_.includes(nodes.map(n=>n.id),d.toString()))
              .map(
                d => {
                  /*
                  let from = s.nodes(d.toString()),
                      to = s.nodes(d.parent.namePath(',')),
                      points = waypoints(from, to, rowContentsForWayPoints);
                  */
                  let e = makeEdge(d.toString(), d.parent.namePath(','));
                  //e.waypoints = points;
                  return e;
                }))
                //.filter(d=>d.classes==='not-self');
  // Instantiate sigma:
  let neigh = new sigma.plugins.neighborhoods();
  let s = new sigma({
    graph: { nodes, edges },
    settings: {
      drawLabels: false,
      drawEdgeLabels: false,
      //enableHovering: false,
      //mouseEnabled: false,
      //eventsEnabled: false,
      //labelSize: 'proportional',
      //labelThreshold: 6,
    }
  });

  s.addRenderer({
    id: 'main',
    type: 'svg',
    container: domnode,
    edgeColor: 'target',
    //defaultNodeType: 'react', // doesn't seem to do anything, have to add it to nodes explicitly
    //freeStyle: true
  });
  s.camera.ratio = .9;
  s.refresh();
  $('foreignObject.voc-node')
    .on('click mouseover mouseout drag',
        function(e) {
          //console.log(e.type, this);
          AppState.ephemeralEventStream.next({jqEvt:e, domNode:this});
        });
  window.s = s;
  window.sg = sg;
  return s;
  /*
  let rows = _.groupBy(s.graph.nodes(), d=>d.row);
  _.each(rows, nodes => {
    if (nodes && nodes.length && nodes[0].isParent) return;
    let prevPositions = nodes.map(d=>d.x);
    let widths = nodes.map(d=>parseInt(d.fo.style.width));
    let centers = widths.map((w,i,a) => _.sum(a.slice(0,i)) + w/2);
    let s = d3.scaleLinear().range([lowestX,1]).domain([0,_.sum(widths)]);
    nodes.forEach((node,i) => node.x = s(centers[i]));
  });
  s.refresh();
  window.s = s;
  window.sg = sg;
  window.waypoints = waypoints;
  window.edge = edge;
  window.edges = edges;
  window.rotateRad = rotateRad;
  window.perpendicular_coords = perpendicular_coords;
  return s;
  */
}
function sgPrep(concept_groups) {
  if (!concept_groups.length) throw new Error("no concept_groups");
  let cg = concept_groups.filter(
    d=>d.grpset.join(',') === 'standard_concept,domain_id,vocabulary_id');
  if (!cg.length) throw new Error("no cg");
  //let grpsets = _.uniq(concept_groups.map(d=>d.grpset.join(',')));
  //if (grpsets.length !== 1) throw new Error("expected 1 grpset");

  let sg = _.supergroup(cg, ['domain_id','standard_concept','vocabulary_id']);
  sg.addLevel('linknodes',{multiValuedGroup:true});
  return sg;
}
export default class VocabMap extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    this.setState({mounted:true}); // force a rerender after div ref available
  }
  componentDidUpdate() {
    const {sg, width, height} = this.props;
    if (this.graphDiv && sg && sg.length) {
      this.sigmaInstance = sigmaGraph(sg.getChildren(), this.graphDiv, width, height, 
                           70, 40, this.msgDiv);
      this.sigmaInstance.graph.nodes().forEach(n => n.sigmaInstance = this.sigmaInstance);
      this.sigmaInstance.graph.edges().forEach(e => e.sigmaInstance = this.sigmaInstance);
      this.setState({graphDrawn:true});
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.graphDrawn || this.props.sg !== nextProps.sg;
  }
  render() {
    const {sg, width, height} = this.props;
    return (<div style={{
                        float: 'left', 
                        margin: 5,
                        border: '1px solid blue',
                        position: 'relative',
                    }} >
              <h4><a href="#" onClick={()=>AppState.saveState({domain_id:sg.toString()})}> {sg.toString()}</a></h4>
              <div style={{ position: 'absolute', right: '10px',}} ref={div=>this.msgDiv=div} />
              <div ref={div=>this.graphDiv=div} 
                   style={{ width: `${width}px`, height: `${height}px`, }}
              />
            </div>);
  }
}
export class VocabMapByDomain extends Component {
  constructor(props) { super(props); this.state = {}; }
  componentDidMount() {
    const {concept_groups, width, height} = this.props;
    if (concept_groups && concept_groups.length)
      this.setState({sg: sgPrep(concept_groups)});
  }
  componentDidUpdate(prevProps, prevState) {
    const {concept_groups, width, height} = this.props;
    if (concept_groups && concept_groups.length && 
        !_.isEqual(concept_groups, prevProps.concept_groups))
      this.setState({sg: sgPrep(concept_groups)});
  }

  render() {
    const {concept_groups, width, height} = this.props;
    const {sg} = this.state;

    if (sg && sg.length) {
      //let ignoreForNow = _.filter(concept_groups, {sc_1:'C', sc_2:null}) .concat( _.filter(concept_groups, {sc_2:'C', sc_1:null}));
      //let recs = _.difference(concept_groups, ignoreForNow);
      let div = this.graphDiv;
      let mapWidth = Math.max(250, width / Math.ceil(Math.sqrt(sg.length)));
      let mapHeight = Math.max(250, height / Math.ceil(Math.sqrt(sg.length)));
      let maps = sg.map(domain => <VocabMap sg={domain} 
                                            key={domain.toString()}
                                            width={mapWidth}
                                            height={mapHeight} 
                                   />);
      return <div>{maps}</div>;
    } else {
      return <div/>;
    }
  }
}
function colOffset(row, nodesInRows, max=maxNodesPerRow) {
  // even rows (except last) have maxNodes
  let nodesInRow = nodesInRows[row];
  let offset = 0;
  if (row % 2) { // odd row
    if (nodesInRow < max - 1) // short row, adjust to center
      offset = max - nodesInRow;
    else
      offset = 1;
    if (row === nodesInRows.length - 1 &&
        nodesInRow === max) // last row, full length, don't adjust
      offset = 0;
  } else { // even row
    if (nodesInRow < max) // short row
      offset = max - nodesInRow;
  }
  return offset;
}
function findEmptyGridCol(row, fromCol, targetCol, rowContentsForWayPoints) {
  // for now just leave these empty and don't try to spread waypoints
  let targetGridLocation = _.get(rowContentsForWayPoints, [row, targetCol]);
  if (!targetGridLocation) return targetCol;
  let newTarget = targetCol > fromCol ? targetCol - 1 : targetCol + 1;
  targetGridLocation = _.get(rowContentsForWayPoints, [row, newTarget]);
  if (!targetGridLocation) return newTarget;
  throw new Error("can't find an empty grid col");
}
function rotateRad(cx, cy, x, y, radians) {
  var cos = Math.cos(radians),
      sin = Math.sin(radians),
      nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
      ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
  return [nx, ny];
}
function perpendicular_coords(x1, y1, x2, y2, xp, yp) {
  var dx = x2 - x1,
      dy = y2 - y1;

  //find intersection point    
  var k = (dy * (xp-x1) - dx * (yp-y1)) / (dy*dy + dx*dx);
  var x4 = xp - k * dy;
  var y4 = yp + k * dx;

  var ypt = Math.sqrt((y4-y1)*(y4-y1)+(x4-x1)*(x4-x1));
  var xpt = pointToLineDist(x1, y1, x2, y2, xp, yp);
  return [xpt, ypt];
}

function pointToLineDist(x1, y1, x2, y2, xp, yp) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.abs(dy*xp - dx*yp + x2*y1 - y2*x1) / Math.sqrt(dy*dy + dx*dx);
}
function pointToPointDist(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
function makeEdge(from, to) {
  return {
    //classes: from.id() === to.id() ? 'self' : 'not-self',
    //selectable: true,
    //events: 'no',
    //groups: 'edges',
    id: `${from}:${to}`,
    source: from,
    target: to,
    type: 'react',
    //color: function(e) { console.log(e); return 'green'; } // doesn't seem to work
    color: 'steelblue',
    classes: `voc-edge sigma-edge`,
  };
}
function waypoints(from, to, rowContentsForWayPoints) {
  let stubPoint = { row: from().row, col: from().col, 
                    distance: 0, weight: .5, };
  if (from().layer === to().layer)
    return [stubPoint];
  let fromCol = from().col, 
      curCol = fromCol,
      toCol = to().col,
      fromRow = from().row,
      curRow = fromRow,
      toRow = to().row,
      fromX = from.position().x,
      fromY = from.position().y,
      toX = to.position().x,
      toY = to.position().y,
      x = d3.scaleLinear().domain([fromCol,toCol]).range([fromX,toX]),
      y = d3.scaleLinear().domain([fromRow,toRow]).range([fromY,toY]);
  let rowsBetween = _.range(fromRow, toRow).slice(1);
  let edgeLength = pointToPointDist(x(fromCol),y(fromRow),x(toCol),y(toRow));
  let points = rowsBetween.map(
    (nextRow,i) => {
      let colsRemaining = toCol - curCol;
      let colsNow = Math.ceil(colsRemaining / Math.abs(toRow - curRow));
      let nextCol = findEmptyGridCol(nextRow, curCol, curCol + colsNow, rowContentsForWayPoints);
      let curX = x(curCol), curY = y(curRow),
          nextX = x(nextCol), nextY = y(nextRow);
      let [distanceFromEdge, distanceOnEdge] = 
            perpendicular_coords(curX, curY, toX, toY, nextX, nextY);

      let point = {curCol, curRow, 
                    toCol, toRow,
                    nextCol, nextRow,
                    curX, curY, toX, toY, nextX, nextY,
                    edgeLength,
                    colsNow,
                    //wayCol, wayRow,
                    distance:-distanceFromEdge * 2, 
                    weight:distanceOnEdge / edgeLength,
                  };
      curCol = nextCol;
      curRow = nextRow;
      return point;
    });
  if (points.length === 0)
      return [stubPoint];
  return points;
}
