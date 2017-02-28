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
import { Glyphicon, //Row, Col,
          //Button, Panel, Modal, Checkbox, OverlayTrigger, Tooltip, FormGroup, Radio Panel, Accordion, Label
       } from 'react-bootstrap';
var d3 = require('d3');
import _ from 'supergroup'; // in global space anyway
var $ = require('jquery'); window.$ = $;
//import Rx from 'rxjs/Rx';

//import * as AppState from '../AppState';
import {commify} from '../utils';
import makeElements from './ThreeLayerVocGraphElements';
require('./stylesheets/Vocab.css');
import SigmaReactGraph from './sigma-react/sigma.renderers.react';
import { ListenerTarget, FoHover, ListenerNode } from './SigmaReactGraph';

export class VocabMapByDomain extends Component {
  // this was giving one VocabMap is domain_id was specified
  // and a grid of VocabMaps, one for each domain, if domain_id wasn't specified
  // but now it's only going to get called for specific domains
  // so having two levels might no longer be necessary
  constructor(props) { super(props); this.state = {}; }
  componentDidMount() {
    const {concept_groups_d, } = this.props;
    if (concept_groups_d && concept_groups_d.length)
      this.setState({forceUpdate:true});
  }
  componentDidUpdate(prevProps, prevState) {
    const {w, h, } = this.props;
    const {width, height} = this.state;
    if (w !== width || h !== height) {
      this.setState({width:w,height:h});
    }
    this.dataPrep(prevProps, prevState);
  }
  dataPrep(prevProps, prevState) {
    const {concept_groups_d, domain_id, } = this.props;
    const oldSg = this.state.sg;
    if (!domain_id) throw new Error("everything for all domains is probably still working except the check here for whether data needs to be refreshed. But all domains is going to DomainMap for now.");
    if (!concept_groups_d || !concept_groups_d.length)
      return;
    if (oldSg) {
      if (oldSg.toString() === domain_id &&
          _.isEqual(concept_groups_d, prevProps.concept_groups_d)) 
        return;
    }
    let cg = concept_groups_d
              .filter(d=>d.grpset.join(',') === 'domain_id,standard_concept,vocabulary_id');
    if (domain_id)
      cg = cg.filter(d=>d.domain_id === domain_id);
    if (!cg.length) throw new Error("no cg");
    let sg = _.supergroup(cg, ['domain_id','standard_concept','vocabulary_id']);
    sg.addLevel('linknodes',{multiValuedGroup:true});
    this.setState({sg});
  }

  render() {
    const {width, height} = this.state;
    const {sg} = this.state;
    let maps;

    if (sg && sg.length) {
      //let ignoreForNow = _.filter(concept_groups_d, {sc_1:'C', sc_2:null}) .concat( _.filter(concept_groups_d, {sc_2:'C', sc_1:null}));
      //let recs = _.difference(concept_groups_d, ignoreForNow);
      let mapWidth = Math.max(250, width / Math.ceil(Math.sqrt(sg.length)));
      let mapHeight = Math.max(250, height / Math.ceil(Math.sqrt(sg.length)));
      maps = sg.map(domain => <VocabMap sg={domain} 
                                            key={domain.toString()}
                                            width={mapWidth}
                                            height={mapHeight} 
                                   />);
    }
    return  <div className="vocab-map-by-domain" ref={d=>this.graphDiv=d}>
              {maps}
            </div>;
  }
}
export default class VocabMap extends Component {
  constructor(props) {
    super(props);
    this.state = {  
                    /*
                    DefaultNodeClass: VocNode, 
                    DefaultLabelClass:VocLabel,
                    DefaultHoverClass:VocHover,
                    DefaultEdgeClass:VocEdge,
                    */
                    className: 'vocab-map',
                    //defaultNodeType: 'circle_label_drill',
                    cameraRatio: 1.4,
                    nodes:[], edges: [],
                    //style: { float: 'left', margin: 5, border: '1px solid blue', position: 'relative', },
    };
  }
  componentDidMount() {
    this.dataPrep();
  }
  dataPrep() {
    const {sg} = this.props;
    let self = this;
    if (sg && sg.length) {
      console.log('dataprep in vocabmap');
      let elements = makeElements(sg.getChildren());
      elements.nodes.forEach(
        d => {
          if (d.isParent) {
            d.hideNode = true;
            /*
            d.NodeClass = VocGroupNode; // otherwise default
            d.LabelClass = VocGroupLabel;
            d.HoverClass = VocGroupHover;
            //d.EdgeClass:VocGroupEdge,
            //d.type = 'groupLabel';
            */
          } else {
            d.HoverClass = VocHover;
          }
        });
      this.setState({
        nodes: elements.nodes,//.map(n=>new VocabMapNode(n)),
        edges: elements.edges,//.map(e=>new VocabMapEdge(e)),
      });
    }
  }
  componentDidUpdate() {
    if (!this.state.nodes)
      this.dataPrep();
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.nodes !== nextState.nodes)
      return true;
    return  !nextState.nodes ||
            this.props.sg !== nextProps.sg ||
            !_.isEqual(this.state.msgInfo, nextState.msgInfo)
  }
  render() {
    let props = Object.assign({}, this.props, this.state);
    return  <SigmaReactGraph {...props} />;
  }
}
/*
class VocabMapNode {
  constructor(props) {
    Object.assign(this, props);
  }
}
*/
class VocHover extends Component {
  // these get made by sigmaSvgReactRenderer
  constructor(props) {
    super(props);
    this.state = {updates:0};
  }
  /*
  componentDidMount() {
    const {node, notInGraph} = this.props;
    node.update = this.update.bind(this);
  }
  */
  render() {
    const {node, children, notInGraph,
            hover, mute, zoom, list, infoHover, } = this.props;

    if (node.nodeData.records.length !== 1) throw new Error("expected one record");
    let rec = node.nodeData.records[0];
    let classVal = rec.drill.lookup('class_concept_id');
    let conceptClasses = classVal ? classVal.getChildren() : [];
    //console.log(conceptClasses.join('\n'));

    let zoomContent = '';
    if (zoom) {
      zoomContent = <div key="zoomContent" className="zoom">ZOOM!</div>;
    }

    let chunkStyle = {};
    let chunks = [
      <InfoChunk key="Voc" k="Voc" v={node.label} />
    ]
    if (conceptClasses.length === 1 && conceptClasses[0]+'' !== node.label)
      chunks.push(<InfoChunk key="Class" k="Class" v={conceptClasses[0]+''} />);

    //chunkStyle.display = hover ? 'flex' : 'none';
    chunkStyle.display = 'flex';
    chunks = chunks.concat(
      _.map(node.counts||{},
        (v,k) => {
          let trigger = d=>d;
          let style = _.clone(chunkStyle);
          let cls = k;
          if (infoHover && infoHover.key === k) {
            // put specific infoTriggers on each InfoChunk for more
            // detailed information
            trigger = ()=>this.infoTrigger(k,v);
            style.fontSize = 'large';
            cls += ' info-hover';
          }
          return <InfoChunk key={k} cls={cls} k={k} v={v} node={node}
                  vfmt={commify} style={chunkStyle} />
        }
      ));
    return <FoHover {...this.props} >
              <Icons key="Icons" hover={hover} />,
              <div key="chunks" className="info-chunks">
                {chunks || <p>nothing yet</p>}
              </div>
              {zoomContent}
           </FoHover>;
  }
  infoTrigger(k,v,e,out=false) {
    let {node, notInGraph, srgSigmaEvtCb} = this.props;
    
    console.log('FIX THIS    infoTrigger', e.type, k);
  }
}
export class DomainMap extends Component {
  constructor(props) {
    super(props);
    this.state = {  //DefaultNodeClass: DomainMapNode, 
                    className: 'domain-map',
                    cameraRatio: 1.4,
                    nodes:[], edges: [],
                    //style: { float: 'left', margin: 5, border: '1px solid blue', position: 'relative', },
    };
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.nodes !== nextState.nodes)
      return true;
    return  !nextState.nodes || !nextState.nodes.length ||
              this.props.sg !== nextProps.sg ||
              !_.isEqual(this.state.msgInfo, nextState.msgInfo)
  }
  componentDidUpdate() {
    const { vocgroups, w, h } = this.props;
    const {width, height} = this.state;
    if (w !== width || h !== height) {
      this.setState({width:w,height:h});
    }
    if (_.isEmpty(vocgroups)) return;
    let sg = _.supergroup(vocgroups, "domain_id");
    sg.addLevel(d=>_.uniq(d.dcgs.map(e=>e.vals[0])).sort(),
                {dimName:'ddom',multiValuedGroup:true});
    let y = d3.scaleQuantize().domain(d3.extent(sg.map(d=>d.getChildren(true).length)))
                              .range(_.range(1,6).reverse());

    let nodes = sg.map((d,i)=>{return {
                id:d.toString(), 
                size:d.records.length,
                label:d.toString(),
                x: i % 5,
                y: y(d.getChildren(true).length),
                val: d,
              }});
    let edges = sg.leafNodes().filter(d=>d.parent).map(d=>{return {
                  id: d.namePath(),
                  type: 'curve',
                  source: d.parent.toString(),
                  target: d.toString(),
                  sval: d.parent,
                  tval: d,
              }});
    this.setState({nodes, edges});
  }
  render() {
    let props = Object.assign({}, this.props, this.state);
    return  <SigmaReactGraph {...props} />;
  }
}
export class MsgInfo extends Component {
  render() {
    const {info = {}} = this.props;
    const {node, k, v} = info;
    if (!info || !node) return <div/>;
      //info ? <pre>{JSON.stringify(info)}</pre> : <div/>;
    return <div className="vocab-map-msg-div" 
                  style={{ position: 'absolute', right: '10px',}} 
                  ref={div=>this.msgDiv=div}>
              {node.id} {' '}
              {k ? `${k}: ${v}` : ''}
            </div>;
  }
  /*
              <VocNode node={node} notInGraph={true} hover={true}>
                <NodeInfo node={node} request='cols' />
              </VocNode>
  */
}
function tblCols(rec) {
  let colDrill = rec.drill.lookup("tbl,col,coltype");
  if (!colDrill) return [];
  return _.fromPairs(
            colDrill.getChildren().map(
              drillGroup => {
                let k = drillGroup.toString();
                let v = drillGroup.records[0].rc;
                return [k, v];
                //return <InfoChunk key={k} cls={'tblcol'} k={k} v={v} vfmt={commify} />
              }));
}
function nodeInfo(props) {
  const {node, request} = props;
  const sg = node.nodeData;
  if (sg.records.length !== 1) throw new Error('confused');
  const rec = sg.records[0];
  switch (request) {
    case 'rc':
      return tblCols(rec);
    default:
      throw new Error(`unknown nodeInfo request ${request}`);
  }
}
function eventPerspective(me, event, neighbors) {
  if (me === event) return 'self';
  if (_.includes(neighbors, me)) return 'neighbor';
  return 'other';
}
/*
class VocGroupLabel extends VocNode {
  render() {
    const {node, settings, children} = this.props;
    return <ListenerTarget wrapperTag="g" rNode={this} >{children}</ListenerTarget>;
  }
}
class VocGroupHover extends VocNode {
  render() {
    const {node, settings, children} = this.props;
    return <ListenerTarget wrapperTag="g" >{children}</ListenerTarget>;
  }
}
*/
function Icons(props) {
  const {hover, } = props;
                //style={{display:hover ? 'inline' : 'none',}} >
                // sigma chokes on events for elements without classes
  return <span className="icons"> 
            <Glyphicon glyph="zoom-in" style={{pointerEvents:'auto'}}
              title="Drill down to concept classes"
            />
            <Glyphicon glyph="list" style={{pointerEvents:'auto'}} 
              title="Show sample records"
            />
         </span>;
}
class InfoChunk extends Component {
  constructor(props) { super(props); this.state = {}; }
  render() {
    let {cls='', kcls, vcls, k, v, kfmt=d=>d, vfmt=d=>d, 
          style, node, nodeData} = this.props;
    const {hover} = this.state;
    kcls = kcls || cls;
    vcls = vcls || cls;
    let moreInfo = '';
    let infoChunkListeners = {};
    if (node && k === 'rc') {
      infoChunkListeners.onMouseEnter = (()=>this.setState({hover:true})).bind(this);
      infoChunkListeners.onMouseLeave = (()=>this.setState({hover:false})).bind(this);
      if (hover) {
        moreInfo = _.toPairs(nodeInfo({node,request:k}))
                    .map(([k2,v2]=[])=>
                          <InfoChunk key={k2} cls={k} k={k2} v={v2} 
                            vfmt={commify} style={{display:'flex'}} />
                        );
      }
    }
            //onMouseOver={mouse}
    return  <div className="info-chunk-wrapper" {...infoChunkListeners} >
              <div className={cls + ' info'} style={style} 
                data-is-info={true} data-key={k} data-val={v} 
              >
                <span className={kcls + ' key'}>{kfmt(k)}</span>
                <span className={vcls + ' val'}>{vfmt(v)}</span>
              </div>
              {moreInfo}
            </div>;
  }
}

class VocEdge extends Component {
  // these get made by sigmaSvgReactRenderer
  constructor(props) {
    super(props);
    this.state = {updates:0};
  }
  /*
  eventHandler(e) {
    let {jqEvt, isInfo, key, val, domNode} = e;
    const {edge, sigmaSource, sigmaTarget, settings} = this.props;
    const {target, type} = jqEvt;
    console.log( jqEvt, isInfo, key, val, domNode);
    let states = {};
    if (isInfo) {
      states.infoHover = {key, val};
    }

    let nodeId = $(jqEvt.target).closest('g.sigma-node').attr('data-node-id');
    if (sigmaSource.id === nodeId || sigmaTarget.id === nodeId) {
      // event on this edge
      switch (e.jqEvt.type) {
        case 'mouseover':
          states.hover = true;
          break;
        case 'mouseout':
          states.hover = false;
          break;
        case 'click':
          break;
        default:
          console.log('unhandled', e.jqEvt.type, 'edge event on', edge.id);
      }
    } else {
      // event on another edge
      switch (e.jqEvt.type) {
        case 'mouseover':
          states.mute = true;
          break;
        case 'mouseout':
          states.mute = false;
          break;
        case 'click':
          break;
        default:
          console.log('unhandled', e.jqEvt.type, 'edge event on', edge.id);
      }
    }
    self.setState(states);
  }
  */
  componentDidMount() {
    //const {edge, sigmaSource, sigmaTarget, settings} = this.props;
    //edge.update = this.update.bind(this);
    this.setState({updates: this.state.updates+1}); // force a rerender after div ref available
  }
  /*
  update(edge, el, source, target, settings) {
    const {edge, sigmaSource, sigmaTarget, settings} = this.props;
    //if (edge !== edge) throw new Error('is this right?');
    //if (!_.isEqual(settings(), settings())) throw new Error('is this right?');
    //if (source !== sigmaSource) throw new Error('is this right?');
    //if (target !== sigmaTarget) throw new Error('is this right?');
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
    //path.style.display = '';
    this.setState({updates: this.state.updates+1}); // force a rerender
  }
  */
  render() {
    const {edge, sigmaSource, sigmaTarget, settings, } = this.props;
    const {hover, mute} = this.state;
    let prefix = settings('prefix') || '';
    return <path ref={p=>this.path=p} 
            data-edge-id={edge.id}
            className={ (edge.classes || '') + (mute ? ' muted' : '')}
            />;
  }
}

