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
import makeElements from './ThreeLayerVocGraphElements';
require('./stylesheets/Vocab.css');

var sigma = require('sigma');
window.sigma = sigma;
var neighborhoods = require('sigma/build/plugins/sigma.plugins.neighborhoods.min');

import sigmaReactRenderer from './sigmaSvgReactRenderer';
sigmaReactRenderer(sigma);

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
      return <div className="vocab-map-by-domain">{maps}</div>;
    } else {
      return <div/>;
    }
  }
}
export default class VocabMap extends Component {
  constructor(props) {
    super(props);
    this.state = {updates:0};
  }
  componentDidMount() {
    this.setState({updates: this.state.updates+1}); // force a rerender after div ref available
  }
  componentDidUpdate() {
    const {sg, width, height} = this.props;
    if (this.graphDiv && sg && sg.length) {
      let elements = makeElements(sg.getChildren());
      elements.nodes.forEach(
        e => e.ComponentClass = e.isParent ? VocGroupNode : VocNode);
      elements.edges.forEach(e => e.ComponentClass = VocEdge);
      this.sigmaInstance = this.sigmaInstance || sigmaGraph(this.graphDiv, elements);
      this.sigmaInstance.graph.nodes().forEach(n => n.sigmaInstance = this.sigmaInstance);
      this.sigmaInstance.graph.edges().forEach(e => e.sigmaInstance = this.sigmaInstance);
      this.setState({graphDrawn:true, updates:this.state.updates+1});
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.graphDrawn || this.props.sg !== nextProps.sg;
  }
  render() {
    const {sg, width, height} = this.props;
    return (<div className="vocab-map"
                 style={{
                        float: 'left', 
                        margin: 5,
                        border: '1px solid blue',
                        position: 'relative',
                    }} >
              <h4><a href="#" onClick={()=>AppState.saveState({domain_id:sg.toString()})}> {sg.toString()}</a></h4>
              <div className="vocab-map-msg-div" style={{ position: 'absolute', right: '10px',}} ref={div=>this.msgDiv=div} />
              <div ref={div=>this.graphDiv=div} 
                   style={{ width: `${width}px`, height: `${height}px`, }}
              />
            </div>);
  }
}
function eventPerspective(me, evt, neighbors) {
  if (me === evt) return 'self';
  if (_.includes(neighbors, me)) return 'neighbor';
  return 'other';
}
export class VocNode extends Component {
  // these get made by sigmaSvgReactRenderer
  constructor(props) {
    super(props);
    this.state = {w:0, h:0, updates:0};
  }
  content() {
    return <VocNodeContent {...this.props} {...this.state} />;
  }
  componentDidMount() {
    const {sigmaNode, sigmaSettings} = this.props;
    sigmaNode.update = this.update.bind(this);
    let self = this;
    AppState.ephemeralEventStream.subscribe(
      e => {
        let eventNodeId = e.jqEvt.target.closest('g.sigma-node').getAttribute('data-node-id');
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
    if (node !== sigmaNode) throw new Error('is this right?');
    if (!_.isEqual(settings(), sigmaSettings())) throw new Error('is this right?');
    let w=0,h=0;
    if (this.contentDiv) {
      this.contentDiv.style.position = 'absolute';
      let cbr = this.contentDiv.getBoundingClientRect(); 
      this.contentDiv.style.position = '';
      w = cbr.width; 
      h = cbr.height;
      console.log(cbr,w,h);
    }
    this.setState({w, h, updates: this.state.updates+1});
    //$('g.sigma-node').css('display','');
  }
  render() {
    const {sigmaNode, sigmaSettings} = this.props;
    const {w, h, hover, mute, zoom, list} = this.state;
    let prefix = sigmaSettings('prefix') || '';

    return (
            <g className={"voc-node-container " 
                            + sigmaNode.classes
                            + (mute ? ' muted' : '')}
              transform={`translate(${sigmaNode[prefix+'x'] - w/2},${sigmaNode[prefix+'y'] - h/2})`}
            >
              <rect className="edge-cover"
                width={w}
                height={h}
              />    
              <foreignObject
                className="voc-node-fo"
                width={w}
                height={h}
              >
                <div  className={"voc-div"}
                ref={d=>this.contentDiv=d} >
                  {this.content()}
                </div>
              </foreignObject>
            </g>
           );

  }
}
export class VocGroupNode extends VocNode {
  componentDidMount() {
    const {sigmaNode, sigmaSettings} = this.props;
    sigmaNode.update = this.update.bind(this);
  }
  content() {
    return <h3 className="sigma-fix">{this.props.sigmaNode.caption}</h3>;
  }
}
function Icons(props) {
  const {hover, } = props;
  return <span className="icons" // sigma chokes on events for elements without classes
                style={{display:hover ? 'inline' : 'none',}} >
            <Glyphicon glyph="zoom-in" style={{pointerEvents:'auto'}}
              title="Drill down to concept classes"
            />
            <Glyphicon glyph="list" style={{pointerEvents:'auto'}} 
              title="Show sample records"
            />
         </span>;
}
export class VocNodeContent extends Component {
  render() {
    const {sigmaNode, sigmaSettings, settings, w, h, hover, mute, zoom, list, } = this.props;

    if (sigmaNode.sgVal.records.length !== 1) throw new Error("expected one record");
    let rec = sigmaNode.sgVal.records[0];
    let classVal = rec.drill.lookup('class_concept_id');
    let conceptClasses = classVal ? classVal.getChildren() : [];
    //console.log(conceptClasses.join('\n'));

    let zoomContent = '';
    if (zoom) {
      zoomContent = <div>ZOOM!</div>;
    }

    let chunks = [
      <InfoChunk key="Voc" k="Voc" v={sigmaNode.caption} />
    ]
    if (conceptClasses.length === 1 && conceptClasses[0]+'' !== sigmaNode.caption)
      chunks.push(<InfoChunk key="Class" k="Class" v={conceptClasses[0]+''} />);
    chunks = chunks.concat(
      _.map(sigmaNode.counts||{},
        (v,k) => <InfoChunk key={k} cls={k} k={k} v={v} vfmt={commify} />
      )
    );
    return <div className="voc-node-content">
              <Icons hover={hover} />
              {chunks}
              {zoomContent}
            </div>;
  }
}
function InfoChunk(props) {
  let {cls='', kcls, vcls, k, v, kfmt=d=>d, vfmt=d=>d} = props;
  kcls = kcls || cls;
  vcls = vcls || cls;
  return <div className={cls + ' info'}>
            <span className={kcls + ' key'}>{kfmt(k)}</span>
            <span className={vcls + ' val'}>{vfmt(v)}</span>
         </div>;
}

export class VocEdge extends Component {
  // these get made by sigmaSvgReactRenderer
  constructor(props) {
    super(props);
    this.state = {updates:0};
  }
  componentDidMount() {
    const {sigmaEdge, sigmaSource, sigmaTarget, sigmaSettings} = this.props;
    sigmaEdge.update = this.update.bind(this);
    let self = this;
    AppState.ephemeralEventStream.subscribe(
      e => {
        // these (so far) are just node events
        let nodeId = e.jqEvt.target.closest('g.sigma-node').getAttribute('data-node-id');
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
    this.setState({updates: this.state.updates+1}); // force a rerender after div ref available
  }
  update(edge, el, source, target, settings) { 
    const {sigmaEdge, sigmaSource, sigmaTarget, sigmaSettings} = this.props;
    if (edge !== sigmaEdge) throw new Error('is this right?');
    if (!_.isEqual(settings(), sigmaSettings())) throw new Error('is this right?');
    if (source !== sigmaSource) throw new Error('is this right?');
    if (target !== sigmaTarget) throw new Error('is this right?');
    if (!this.path) return;
    let path = this.path;
    var prefix = sigmaSettings('prefix') || '';
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
    //path.style.display = '';
    this.setState({updates: this.state.updates+1}); // force a rerender
  }
  render() {
    const {sigmaEdge, sigmaSource, sigmaTarget, sigmaSettings, } = this.props;
    const {hover, mute} = this.state;
    let prefix = sigmaSettings('prefix') || '';
    return <path ref={p=>this.path=p} 
            data-edge-id={sigmaEdge.id}
            className={ (sigmaEdge.classes || '') + (mute ? ' muted' : '')}
            />;
  }
}

function sigmaGraph(domnode, elements) {
  // Instantiate sigma:
  let neigh = new sigma.plugins.neighborhoods();
  let s = new sigma({
    graph: { ...elements }, // should contain nodes and edges
    settings: {
      //enableHovering: false,
      //mouseEnabled: false,
      //eventsEnabled: false,
      //labelSize: 'proportional',
      //labelThreshold: 6,
    }
  });

  s.addRenderer({
    drawLabels: false,
    drawEdgeLabels: false,
    id: 'main',
    type: 'svg',
    container: domnode,
    edgeColor: 'target',
    //defaultNodeType: 'react', // doesn't seem to do anything, have to add it to nodes explicitly
    //freeStyle: true
  });
  s.camera.ratio = .9;
  s.refresh();
  $('g.voc-node-container')
    .on('click mouseover mouseout drag',
        function(e) {
          //console.log(e.type, this);
          AppState.ephemeralEventStream.next({jqEvt:e, domNode:this});
        });
  window.s = s;
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
