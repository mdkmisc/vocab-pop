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
var d3 = require('d3');
import _ from 'supergroup'; // in global space anyway

import * as AppState from '../AppState';
import {commify} from '../utils';

var sigma = require('sigma');
window.sigma = sigma;
var neighborhoods = require('sigma/build/plugins/sigma.plugins.neighborhoods.min');

import nodeRenderer from './sigmaSvgNodeRenderer';
nodeRenderer(sigma);

var $ = require('jquery'); window.$ = $;

let maxNodesPerRow = 4;
let rowsBetweenLayers = 1;

function sigmaGraph(sg, domnode, w, h, boxw, boxh, msgDiv) {
  function makeNode(id, label, layer, parent) {
    let node = { id, size: 1, color: 'orange', };
    if (typeof label !== 'undefined') node.label = label;
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
                        label = voc.toString() + ' ' + biggest,
                        info =
                          [voc.toString()].concat(_.map(counts,
                            (cnt,fld) => `<span class="${fld}">${fld}: ${commify(cnt)}</span>`
                                        )).join('<br/>'),
                        layer = ({'C': 0, 'S': 1, 'X': 2})[sc.toString()],
                        parent = ['Classification','Standard','Source'][layer];
                    let node = makeNode(id, label,layer, parent);
                    node.info = info;
                    node.biggestCount = biggest;
                    node.classes = `${biggest} fo-node`;
                    node.sgVal = voc;
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
  window.colOffset = colOffset;
  let rowContents = {};
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
    let row = _.get(rowContents, [node.row, node.col]) || [];
    row.push(node);
    _.set(rowContents, [node.row, node.col], row);
    //if (node.layer === 2 && node.layerIdx > 3) debugger;
  });
  let x = d3.scaleLinear().domain([0,d3.max(nodes.map(d=>d.col))]);
  let y = d3.scaleLinear().domain(d3.extent(nodes.map(d=>d.row)));
  window.x = x; window.y = y;
  nodes.forEach(node => {
    node.x = x(node.col);
    node.y = y(node.row);
  });
  let nodeGroups = [
        { isParent: true, id: 'Classification', label: 'Classification', x:x(0), y:y(layerStartRows[0]), size:2 },
        { isParent: true, id: 'Standard', label: 'Standard', x:x(0), y:y(layerStartRows[1]), size:2 },
        { isParent: true, id: 'Source', label: 'Source', x:x(0), y:y(layerStartRows[2]), size:2 },
  ];
  nodes = nodes.concat(nodeGroups);
  
  let edges = 
    _.flatten(sg.leafNodes()
              .filter(d=>d.dim==='linknodes')
              .map(
                d => {
                  /*
                  let from = s.nodes(d.toString()),
                      to = s.nodes(d.parent.namePath(',')),
                      points = waypoints(from, to, rowContents);
                  */
                  let e = edge(d.toString(), d.parent.namePath(','));
                  //e.waypoints = points;
                  return e;
                }))
                //.filter(d=>d.classes==='not-self');
  // Instantiate sigma:
  let neigh = new sigma.plugins.neighborhoods();
  let s = new sigma({
    graph: { nodes, edges },
    settings: {
      labelSize: 'proportional',
      labelThreshold: 6,
      //enableHovering: false,
    }
  });

  s.addRenderer({
    id: 'main',
    type: 'svg',
    container: domnode,
    freeStyle: true
  });
  s.camera.ratio = 1.4;
  s.refresh();

  // Binding silly interactions
  function mute(node) {
    if (!~node.getAttribute('class').search(/muted/))
      node.setAttributeNS(null, 'class', node.getAttribute('class') + ' muted');
  }

  function unmute(node) {
    node.setAttributeNS(null, 'class', node.getAttribute('class').replace(/(\s|^)muted(\s|$)/g, '$2'));
  }

  $('.sigma-node').click(function() {

    // Muting
    $('.sigma-node, .sigma-edge').each(function() {
      mute(this);
    });

    // Unmuting neighbors
    var neighbors = s.graph.neighborhood($(this).attr('data-node-id'));
    neighbors.nodes.forEach(function(node) {
      unmute($('[data-node-id="' + node.id + '"]')[0]);
    });

    neighbors.edges.forEach(function(edge) {
      unmute($('[data-edge-id="' + edge.id + '"]')[0]);
    });
  });

  s.bind('clickStage', function() {
    $('.sigma-node, .sigma-edge').each(function() {
      unmute(this);
    });
  });
  /*
  cy.on('tap', evt => {
    let el = evt.cyTarget;
    if (el === cy) {
      //console.log("tapped background");
    } else {
      if (el.group() === 'edges')
        return false;
      if (el().isParent)
        return false;
      //console.log('tapped', (el && el()) || 'no data', (el.id && el.id()) || 'no id');
    }
  });
  cy.on('mouseover', evt => {
    let el = evt.cyTarget;
    if (el === cy) {
    } else {
      if (el().isParent)
        return false;
      //el.select();
      el.activate();
      el.neighborhood().forEach(e => e.activate());
      if (el.group() === 'edges') {
        //console.log('edge mouseover', el && el() || 'no data', el.id && el.id() || 'no id');
        return false;
      }
      msgDiv.innerHTML = el().info;
      console.log(domnode);
      //console.log('node mouseover', el && el() || 'no data', el.id && el.id() || 'no id');
    }
  });
  cy.on('mouseout', evt => {
    let el = evt.cyTarget;
    el.unactivate && el.unactivate();
    el.neighborhood().forEach(e => e.unactivate && e.unactivate());
  });
  */

  window.s = s;
  window.sg = sg;
  window.waypoints = waypoints;
  window.edge = edge;
  window.edges = edges;
  window.rotateRad = rotateRad;
  window.perpendicular_coords = perpendicular_coords;
  return s;
}
function sgPrep(classRecs) {
  if (!classRecs.length) throw new Error("no classRecs");
  let grpsets = _.uniq(classRecs.map(d=>d.grpset.join(',')));
  if (grpsets.length !== 1) throw new Error("expected 1 grpset");

  let sg = _.supergroup(classRecs, classRecs[0].grpset);
  sg.addLevel('linknodes',{multiValuedGroup:true});
  return sg;

  /*
  let sg = _.supergroup(classRecs, 'domain_id'); // have to deal with two
  let sg = _.supergroup(classRecs, d=>_.uniq([d.domain_id_1, d.domain_id_2]),
                    {dimName: 'domain_id', multiValuedGroup:true});

  // have to make sure I get a node for each box whether it's in _1 or _2
  // but I don't want two nodes for the same sc/vocab combo
  sg.addLevel( d=>[`${d.sc_1}:${d.vocab_1}`, `${d.sc_2}:${d.vocab_2}`],
                    {dimName: 'linkFrom', multiValuedGroup:true});

  sg.addLevel(
    d => {
      if (d.toString() === `${d.sc_1}:${d.vocab_1}`) {
        return `${d.sc_2}:${d.vocab_2}`;
      } else {
        return `${d.sc_1}:${d.vocab_1}`;
      }
    },
    {dimName: 'linkTo'});

  return sg;
  */
}
export class VocabMapByDomain extends Component {
  render() {
    const {classes, width, height} = this.props;

    if (classes && classes.length) {
      //let ignoreForNow = _.filter(classes, {sc_1:'C', sc_2:null}) .concat( _.filter(classes, {sc_2:'C', sc_1:null}));
      //let recs = _.difference(classes, ignoreForNow);
      let div = this.graphDiv;
      let sg = sgPrep(classes);
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
      //this.cy = cytoGraph(sg.getChildren(), this.graphDiv, width, height, 70, 40, this.msgDiv);
      this.cy = sigmaGraph(sg.getChildren(), this.graphDiv, width, height, 70, 40, this.msgDiv);
    }
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
function findEmptyGridCol(row, fromCol, targetCol, rowContents) {
  // for now just leave these empty and don't try to spread waypoints
  let targetGridLocation = _.get(rowContents, [row, targetCol]);
  if (!targetGridLocation) return targetCol;
  let newTarget = targetCol > fromCol ? targetCol - 1 : targetCol + 1;
  targetGridLocation = _.get(rowContents, [row, newTarget]);
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
function edge(from, to) {
  return {
    //classes: from.id() === to.id() ? 'self' : 'not-self',
    //selectable: true,
    //events: 'no',
    //groups: 'edges',
    id: `${from}:${to}`,
    source: from,
    target: to,
  };
}
function waypoints(from, to, rowContents) {
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
      let nextCol = findEmptyGridCol(nextRow, curCol, curCol + colsNow, rowContents);
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
