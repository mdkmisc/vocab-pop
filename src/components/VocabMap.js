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
//import CyViewer from 'cy-viewer';

import cytoscape from 'cytoscape';
//var cytoscape = require('cytoscape');
//var css_renderer = require('cytoscape-css-renderer');
//css_renderer( cytoscape ); // register extension
//import cytoscape from '../../cytoscape.js/src/index';

import * as AppState from '../AppState';
import {commify} from '../utils';

//var $ = require('jquery'); window.$ = $;

function graph(sg, domnode, w, h, boxw, boxh, msgDiv) {
  function selectNodes(nodeIds, nodeProps) {
      console.log('====== Custom node select function called! ========');
      console.log('Selected Node ID: ' + nodeIds)
      console.log(nodeProps)
    };
  function selectEdges(edgeIds, edgeProps) {
      console.log('====== Custom edge select function called! ========');
      console.log('Selected Edge ID: ' + edgeIds)
      console.log(edgeProps)
    };
  var cyConfig = {
    //boxSelectionEnabled: false,
    //autounselectify: true,
    //autoungrabify: true,
    //autolock: true,
    //selectionType: 'single',
    //renderer: { name: "css" }, 
    minZoom: .1,
    maxZoom: 3,
    "text-events": "yes",
    style: [
      {
        selector: '.multiline-manual',
        style: {
          'text-wrap': 'wrap',
        }
      },
      {
        "selector" : "node",
        "css" : {
          "font-family" : "sans-serif",
          "shape" : "roundrectangle",
          //"background-color" : "rgb(255,255,255)",
          //"background-color" : "beige",
          //"width" : 55.0,
          //"height" : 20.0,
          "width" : "label",
          "height" : "label",
          "padding": "6px 4px 0px 4px",
          "text-valign" : "center",
          "text-halign" : "center",
          //"text-margin-x": "50px",
          //"color" : "#666666",
          //"color" : "green",
          //"font-size" : '0.1em',
          "label" : "data(label)"
        }
      },
      {
        selector: ':parent',
        css: {
          //'background-opacity': .6,
          "content" : "data(label)",
          "events": 'no',
          //"background-color" : "burlywood",
          //'padding-top': '10px',
          //'padding-left': '10px',
          //'padding-bottom': '10px',
          //'padding-right': '10px',
          'text-valign': 'top',
          'text-halign': 'left',
          //"color" : "brown",
        },
      },
      /*
      {
        selector: '$node > node',
        css: {
          "label" : "data(label)",
        }
      },
      */
      {
        "selector" : "node:selected",
        "css" : {
          //"background-color" : "orange",
          //"color" : "white",
        }
      },
      {
        "selector" : "node.rc",
        style: {
          "background-color" : "#0070dd",
          "color" : "white"
        }
      },
      {
        "selector" : "node.drc",
        style: {
          "background-color" : "rgb(163, 53, 238)",
          "color" : "white",
        }
      },
      {
        "selector" : "node.src",
        style: {
          "background-color" : "pink",
          "color" : "blue"
        }
      },
      {
        selector: ':selected',
        css: {
          'background-color': 'purple',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black'
        }
      },
      {
        "selector" : "edge.not-self",
        "css" : {
          //"control-point-step-size": .5,
          //"curve-style": "bezier",
          /*
          'curve-style': 'unbundled-bezier',
          'control-point-distances': 
            function(edge) {
              return edge.data('waypoints').map(d=>d.distance).join(" ");
            },
          'control-point-weights':
            function(edge) {
              let points = edge.data('waypoints');
              let y = d3.scaleLinear()
                        .range([1 / (points.length + 2), 1 - 1 / (points.length + 2) ])
                        .domain([edge.source().data().row,edge.target().data().row]);
              edge.data().weights = points.map(d=>{
                return d.weight = y('wayRow' in d ? d.wayRow : .5)
              }).join(" ");
              return edge.data().weights;
            },
          */
          //'curve-style': 'unbundled-bezier',
          //'curve-style': 'segments',
          //http://js.cytoscape.org/#style/segments-edges
          'control-point-distances': 
          //'segment-distances': 
            function(edge) {
              return edge.data('waypoints').map(d=>d.distance).join(" ");
            },
          'control-point-weights':
          //'segment-weights':
            function(edge) {
              return edge.data('waypoints').map(d=>d.weight).join(" ");
            },
            /*
            function(edge) {
              let points = edge.data('waypoints');
              let y = d3.scaleLinear()
                        .range([1 / (points.length + 2), 1 - 1 / (points.length + 2) ])
                        .domain([edge.source().data().row,edge.target().data().row]);
              edge.data().weights = points.map(d=>{
                return d.weight = y('wayRow' in d ? d.wayRow : .5)
              }).join(" ");
              return edge.data().weights;
            },
            */
          //'control-point-distances': '5 10 20 5',
          //'control-point-distances': () => '5 10 20 5',
          //'control-point-weights': '0.1 0.2 0.6 0.8',
          //'control-point-weights': () => '0.1 0.2 0.6 0.8',
          "line-color" : "steelblue",
          "color" : "pink"
        }
      },
      {
        "selector" : "edge",
        "css" : {
          "line-color" : "steelblue",
          "color" : "pink",
          "shadow-color": "green",
        }
      },
      {
        "selector" : "edge:selected",
        "css" : {
          "line-color" : "red",
          "color" : "pink"
        }
      },
    ],
    layout: {
      name: 'grid',
      avoidOverlap: false,
      position: node => {
        return {row: node.data('row'), col: node.data('col')};
      },
    },
  };
  let nodeGroups = [
        { selectable: false, data: { isParent: true, id: 'Classification', label: 'Classification' }, position: { y: 10, } },
        { selectable: false, data: { isParent: true, id: 'Standard', label: 'Standard' }, position: { y: 300, } },
        { selectable: false, data: { isParent: true, id: 'Source', label: 'Source' }, position: { y: 600, } },
  ];
  let nodesInLayers = [0,0,0]; // counter for nodes in each layer
  let nodes = nodeGroups.concat(
                _.flatten(sg.map(sc=>sc.getChildren().map(voc=>{
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
                    node.data.info = info;
                    node.data.biggestCount = biggest;
                    node.classes = `${biggest} multiline-manual`;
                    return node;
                  }))));
  // split wide layers
  let maxNodesPerRow = 7;
  let rowsBetweenLayers = 0;
  let rowsInLayers = 
    nodesInLayers.map((nodesInLayer,i) => Math.ceil(nodesInLayer / maxNodesPerRow));
  
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
  window.colOffset = colOffset;
  let rowContents = {};
  nodes.filter(d=>!d.data.isParent).forEach((node) => {
    let nodesInRows = nodesInRowsByLayer[node.data.layer];
    let prevRows = _.sum(nodesInRowsByLayer.slice(0, node.data.layer).map(d=>d.length))
                      + node.data.layer * rowsBetweenLayers;
    nodesInRows.forEach(
            (nodesInRow,i) => {
              if (
                    node.data.layerIdx >= _.sum(nodesInRows.slice(0, i)) &&
                    node.data.layerIdx <  _.sum(nodesInRows.slice(0, i + 1))
                 ) {
                      node.data.rowInLayer = i;
                      node.data.row = node.data.rowInLayer + prevRows;

                      node.data.rowIdx = node.data.layerIdx -  // rowIdx == idx within the row
                                          _.sum(nodesInRows.slice(0, i));
                      node.data.col = node.data.rowIdx * 2
                                        + colOffset(node.data.rowInLayer,
                                                    nodesInRowsByLayer[node.data.layer]);
              }
            });
    let row = _.get(rowContents, [node.data.row, node.data.col]) || [];
    row.push(node);
    _.set(rowContents, [node.data.row, node.data.col], row);
    //if (node.data.layer === 2 && node.data.layerIdx > 3) debugger;
  });
  //cyConfig.layout.cols = _.max(nodes.map(d=>d.data.col));
  cyConfig.layout.rows = _.max(nodes.map(d=>d.data.row));
  cyConfig.layout.cols = _.max(nodes.map(d=>d.data.col));
  
  function makeNode(id, label, layer, parent) {
    let node = { data: { id, }, };
    if (typeof label !== 'undefined') node.data.label = label;
    if (typeof layer !== 'undefined') {
      node.data.layer = layer;
      node.data.layerIdx = nodesInLayers[layer]++;
    }
    if (typeof parent !== 'undefined') node.data.parent = parent;
    /*
    if (typeof stub !== 'undefined') {
      node.data.stub = stub;
      node.visible = !stub;
      node.selectable = false;
    } else {
      node.selectable = true;
    }
    */
    node.selectable = true;
    return node;
  }
  function findEmptyGridCol(row, fromCol, targetCol) {
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
  function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
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
  /*
  function dumbCoordRotate(x0,y0, x1,y1, xp,yp) {
    // get slope from source to target
    let m = (y1 - y0) / (x1 - x0);
    // then y == m*x + b, plug in a point: y0 == m*x0 + b
    let b = y0 - m * x0;
    let mp = -1 / m; // slope of perpendicular line
    let bp = yp - mp * xp;
  }
  function rotate(cx, cy, x, y) {
    var radians = Math.atan2(cy, cx),
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
  }
  */
  function edge(from, to) {
    return {
      classes: from.id() === to.id() ? 'self' : 'not-self',
      selectable: true,
      events: 'no',
      groups: 'edges',
      data: {
        id: `${from.id()}:${to.id()}`,
        source: from.id(),
        target: to.id(),
      }
    };
  }

  cyConfig.elements = { nodes};
  //console.log(JSON.stringify(cyConfig, null, 2));

  cyConfig.container = domnode;
    
  let cy = cytoscape(cyConfig);
  cy.on('tap', evt => {
    let el = evt.cyTarget;
    if (el === cy) {
      console.log("tapped background");
    } else {
      if (el.group() === 'edges')
        return false;
      if (el.data().isParent)
        return false;
      console.log('tapped', el.data && el.data() || 'no data', el.id && el.id() || 'no id');
    }
  });
  cy.on('mouseover', evt => {
    let el = evt.cyTarget;
    if (el === cy) {
    } else {
      if (el.data().isParent)
        return false;
      //el.select();
      el.activate();
      if (el.group() === 'edges') {
        console.log('edge mouseover', el.data && el.data() || 'no data', el.id && el.id() || 'no id');
        return false;
      }
      msgDiv.innerHTML = el.data().info;
      console.log(domnode);
      console.log('node mouseover', el.data && el.data() || 'no data', el.id && el.id() || 'no id');
    }
  });
  cy.on('mouseout', evt => {
    let el = evt.cyTarget;
    el.unactivate && el.unactivate();
  });
  /*
  let nodesByCol = _.sortBy(cy.nodes().toArray().filter(d=>d.data().col), d=>d.data().col),
      leftNode   = _.first(nodesByCol),
      rightNode  = _.last(nodesByCol),
      x          = d3.scaleLinear()
                      .domain([leftNode.data().col, rightNode.data().col])
                      .range([leftNode.position().x, rightNode.position().x]);
  let nodesByRow = _.sortBy(cy.nodes().toArray().filter(d=>d.data().row), d=>d.data().row),
      topNode    = _.first(nodesByRow),
      bottomNode = _.last(nodesByRow),
      y          = d3.scaleLinear()
                      .domain([topNode.data().col, bottomNode.data().col])
                      .range([topNode.position().y, bottomNode.position().y]);
  */
  let edges = 
    _.flatten(sg.leafNodes()
              .filter(d=>d.dim==='linknodes')
              .map(
                d => {
                  let from = cy.getElementById(d.toString()),
                      to = cy.getElementById(d.parent.namePath(',')),
                      points = waypoints(from, to);
                      /*
                      edgePath = _.range(nodePath.length - 1).map(
                        i => {
                          return edge(nodePath[i], nodePath[i+1]);
                        });
                      return edgePath;
                      */
                  let e = edge(from, to);
                  e.data.waypoints = points;
                  return e;
                }))
                //.filter(d=>d.classes==='not-self');

  function waypoints(from, to) {
    let stubPoint = { row: from.data().row, col: from.data().col, 
                      distance: 0, weight: .5, };
    if (from.data().layer === to.data().layer)
      return [stubPoint];
    let fromCol = from.data().col, 
        curCol = fromCol,
        toCol = to.data().col,
        fromRow = from.data().row,
        curRow = fromRow,
        toRow = to.data().row,
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
        let nextCol = findEmptyGridCol(nextRow, curCol, curCol + colsNow);
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
  window.cy = cy;
  window.sg = sg;
  window.waypoints = waypoints;
  window.edge = edge;
  window.edges = edges;
  window.rotateRad = rotateRad;
  window.perpendicular_coords = perpendicular_coords;

  //cy.nodes().forEach( ele => ele.css('content', '<span>blah</span>'));

  cy.add(edges);


  return cy;
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
      this.cy = graph(sg.getChildren(), this.graphDiv, width, height, 70, 40, this.msgDiv);
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
