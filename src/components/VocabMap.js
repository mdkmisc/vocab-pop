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
//var cytoscape = require('cytoscape');
import cytoscape from 'cytoscape';
import * as AppState from '../AppState';


function graph(sg, domnode, w, h, boxw, boxh) {
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
    minZoom: .1,
    maxZoom: 3,
    "text-events": "yes",
    
    /*
    style: {
      width: '100%',
      height: '100%',
      backgroundColor: '#404040',
      label: 'data(id)',
    },
    titleStyle: {
      height: '2em',
      margin: 0,
      fontWeight: 100,
      color: '#777777',
      paddingTop: '0.2em',
      paddingLeft: '0.8em',
    },
    */
    style: [
      {
        "selector" : "node",
        "css" : {
          "font-family" : "sans-serif",
          "shape" : "roundrectangle",
          //"background-color" : "rgb(255,255,255)",
          "background-color" : "beige",
          //"width" : 55.0,
          //"height" : 20.0,
          "width" : "label",
          "height" : "label",
          "padding": "6px 4px 0px 4px",
          "text-valign" : "center",
          "text-halign" : "center",
          //"text-margin-x": "50px",
          //"color" : "#666666",
          "color" : "green",
          //"font-size" : '0.1em',
          "label" : "data(label)"
        }
      },
      {
        selector: ':parent',
        css: {
          'background-opacity': .6,
          "content" : "data(label)",
          "events": 'no',
          "background-color" : "burlywood",
          //'padding-top': '10px',
          //'padding-left': '10px',
          //'padding-bottom': '10px',
          //'padding-right': '10px',
          'text-valign': 'top',
          'text-halign': 'left',
          "color" : "brown",
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
          "background-color" : "orange",
          "color" : "white",
        }
      },
      /*
      {
        selector: ':selected',
        css: {
          'background-color': 'purple',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black'
        }
      },
      */
      {
        "selector" : "edge.not-self",
        "css" : {
          //"curve-style": "bezier",
          //"control-point-step-size": .5,
          /*
          'curve-style': 'unbundled-bezier',
          'control-point-distances': 120,
          'control-point-weights': 0.1,
          */
          "line-color" : "steelblue",
          "color" : "pink"
        }
      },
      {
        "selector" : "edge",
        "css" : {
          "line-color" : "steelblue",
          "color" : "pink"
        }
      },
    ],
    /*
      {
        "selector" : "edge:selected",
        "css" : {
          "line-color" : "orange",
          "color" : "white"
        }
      },
    styles: [
      {
        selector: 'node',
        css: {
          'label': 'data(id)',
          'height': 20,
          'width': 20,
          //'text-valign': 'center',
          //'text-halign': 'center'
        }
      },
      {
        selector: '$node > node',
        css: {
          'padding-top': '10px',
          'padding-left': '10px',
          'padding-bottom': '10px',
          'padding-right': '10px',
          'text-valign': 'top',
          'text-halign': 'center',
          'background-color': '#bbb'
        }
      },
      {
        selector: 'edge',
        css: {
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      },
    ],
    */
    // Then use it as a custom handler
    /*
    eventHandler: {
      selectNodes: selectNodes,
      selectEdges: selectEdges
    },
    appStyle: {
      backgroundColor: '#eeeeee',
      color: '#EEEEEE',
      width: '100%',
      height: '100%',
    },
    elements: {
      nodes: [
        { data: { id: 'a', parent: 'b' }, position: { x: 215, y: 85 } },
        { data: { id: 'b' } },
        { data: { id: 'c', parent: 'b' }, position: { x: 300, y: 85 } },
        { data: { id: 'd' }, position: { x: 215, y: 175 } },
        { data: { id: 'e' } },
        { data: { id: 'f', parent: 'e' }, position: { x: 300, y: 175 } }
      ],
      edges: [
        { data: { id: 'ad', source: 'a', target: 'd' } },
        { data: { id: 'eb', source: 'e', target: 'b' } }
        
      ]
    },
    */
    layout: {
      name: 'grid',
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
  let nodes = nodeGroups.concat(sg.map(
                d => {
                  let layer = ({'C': 0, 'S': 1, null: 2})[d.toString().replace(/:.*/,'')];
                  let section = ['Classification','Standard','Source'][layer];
                  return {
                    data: {
                      layer,
                      layerIdx: nodesInLayers[layer]++,
                      parent: section,
                      id: d.toString(),
                      label: d.toString().replace(/.*:/,''),
                      //label: d.toString(),
                    },
                    selectable: true,
                    //selected: true,
                    position: { y: layer * 200, },
                  };
                }));

  // split wide layers
  let maxNodesPerRow = 7;
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
  console.log(nodesInRowsByLayer.join('\n'));
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
  nodes.filter(d=>!d.data.isParent).forEach((node) => {
    let nodesInRows = nodesInRowsByLayer[node.data.layer];
    let prevRows = _.sum(nodesInRowsByLayer.slice(0, node.data.layer).map(d=>d.length))
                      + node.data.layer * 2;
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
    //if (node.data.layer === 2 && node.data.layerIdx > 3) debugger;
  });
  //cyConfig.layout.cols = _.max(nodes.map(d=>d.data.col));
  cyConfig.layout.rows = _.max(nodes.map(d=>d.data.row));
  cyConfig.layout.cols = _.max(nodes.map(d=>d.data.col));
  

  let edges = sg.leafNodes().map(
                d => {
                  return {
                    classes: d.toString() === d.parent.toString() ? 'self' : 'not-self',
                    selectable: false,
                    events: 'no',
                    data: {
                      id: d.toString() + '/' + d.parent.toString(),
                      source: d.toString(),
                      target: d.parent.toString(),
                    }
                  };
                }).filter(d=>d.classes==='not-self');

  cyConfig.elements = { nodes, edges };
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
  window.cy = cy;
  return cy;
  return <div className="cydiv">
              <h5>cyviewer</h5>
              <CyViewer {...cyConfig} />
          </div>;
  


  let levelContents = [0,0,0]; // C, S, null for three standard concept levels
  sg.forEach( d => {
    d.ypos = ({'C': 0, 'S': 1, null: 2})[d.toString().replace(/:.*/,'')];
    d.xpos = levelContents[d.ypos] ++;
  });

  let x = d3.scaleLinear().range([0,w])
                .domain([-1, _.max(levelContents)])
  let y = d3.scaleLinear().range([0,h])
                .domain([-1, 4]);
  var c10 = d3.scaleLinear().range(d3.schemeCategory10);

  d3.select(domnode).select('svg').remove();
  var svg = d3.select(domnode)
    .append("svg")
    .attr("width", w)
    .attr("height", h);

    /*
  var drag = d3.drag()
    .on("drag", function(d, i) {
      d.x += d3.event.dx
      d.y += d3.event.dy
      d3.select(this).attr("cx", d.x).attr("cy", d.y);
      d.getChildren().each(function(l, li) {
        if (l.source === i) {
          d3.select(this).attr("x1", d.x).attr("y1", d.y);
        } else if (l.target === i) {
          d3.select(this).attr("x2", d.x).attr("y2", d.y);
        }
      });
    });
    */

  //var d3nodes = 
  svg.selectAll("node")
                .data(sg).enter()
                .append("rect")
                  .attr("class", "node")
                  .attr("x", function(d) {
                    return x(d.xpos) - boxw / 2;
                  })
                .attr("y", function(d) {
                  return y(d.ypos) - boxh / 2;
                })
                .attr("width", boxw)
                .attr("height", boxh)
                .attr("fill", function(d, i) {
                  return c10(i);
                })
                //.call(drag);
  //var labels = 
  svg.selectAll("foreighObject")
          .data(sg)
          .enter()
        .append('foreignObject')
          .attr("x", function(d) {
            return x(d.xpos) - boxw / 2;
          })
          .attr("y", function(d) {
            return y(d.ypos) - boxh / 2;
          })
          .attr('width', boxw)
          .attr('height', boxh)
        .append('xhtml:p')
          .html(d=>d.toString().replace(/.*:/,''))

  //var links = 
  svg.selectAll("link")
                .data(sg.leafNodes())
                .enter()
                .append("line")
                .attr("class", "link")
                .attr("x1", d=>x(d.parent.xpos))
                .attr("y1", d=>y(d.parent.ypos))
                .attr("x2", d=>{
                      return x(d.parent.parentList.lookup(d).xpos)
                })
                .attr("y2", d=>y(d.parent.parentList.lookup(d).ypos))
                .attr("fill", "none")
                .attr("stroke", "white");


}
function sgPrep(classRecs) {
  //let sg = _.supergroup(classRecs, 'domain_id'); // have to deal with two

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
      this.cy = graph(sg.getChildren(), this.graphDiv, width, height, 70, 40);
    }
  }
  render() {
    const {sg, width, height} = this.props;
    return (<div style={{
                        float: 'left', 
                        margin: 5,
                        border: '1px solid blue',
                    }} >
              <h4><a href="#" onClick={()=>AppState.saveState({domain_id:sg.toString()})}> {sg.toString()}</a></h4>
              <div ref={div=>this.graphDiv=div} 
                   style={{ width: `${width}px`, height: `${height}px`, }}
              />
            </div>);
  }
}
