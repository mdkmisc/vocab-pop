// @ flow // flow breaking on new.target, so not using right now

const DEBUG = true;
import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
import _ from 'supergroup'; // just for lodash
import Rx from 'rxjs/Rx';
import {sigmaReactRenderer, elType, neighborhoodPlugin} from './sigma-react/sigma.renderers.react';
import { getRefsFunc, sendRefsToParent, updateReason} from '../utils';
//export {default} from './sigma-react/sigma.renderers.react';

export default class SigmaReactGraph extends Component {
  constructor(props) {
    super(props);
    this.sigma = sigmaReactRenderer();
    !this.sigma.classes.graph.hasMethod('neighborhood') && 
      neighborhoodPlugin(this.sigma);
    //this.sigmaInstance = new this.sigma({graph:{nodes,edges}});
    this.sigmaInstance = new this.sigma();
    this.cam = this.sigmaInstance.addCamera();
    /*
    this.renderer.settings = 
      this.renderer.settings.embedObjects(options, {
          prefix: this.renderer.saveParams.options.prefix,
          forceLabels: this.renderer.saveParams.options.forceLabels
        });
    */
    this.state = {hoverNode:null, hoverNeighbors:[],
                  eventHandlers:
                    (props.eventHandlers||[]).concat(
                      this.setHoverNode.bind(this)),
    };
    DEBUG && (window.srg = this);
  }
  options(sOpts) {
    let rendererOpts = Object.assign(
      { id:'main',
        /*
        DefaultNodeClass: SigmaNode, 
        DefaultLabelClass:VocLabel,
        DefaultEdgeClass:VocEdge,
        DefaultHoverClass:VocHover,
        */
        //defaultNodeType: 'react', 
        //defaultEdgeType: 'react',
        // FIX ALL THIS
        defaultNodeColor:'darkkhaki',
        defaultNodeHoverColor:'crimson',
        defaultNodeHoverStrokeColor:'green',
        defaultNodeMuteColor:'#AAA',
        defaultLabelColor:'darkred',
        defaultLabelNeighborColor:'crimson',
        defaultEdgeColor:'darkslateblue',

        defaultLabelSize:16,
        labelSize:'proportional',
        labelThreshold:2,
        //labelFontSizeThreshold:2,
        labelSizeRatio:3,
        cameraRatio:.7,
        drawLabels:false,
        drawEdgeLabels:false,
        edgeColor:'target',
        hideEdgesOnMove:true, 
        srg: this, 
      }, this.props);
    let opts = Object.assign({  //container: this.graphDiv,
                  type: 'react',
                  camera: this.cam,
                  //freeStyle: true
                  settings: rendererOpts,
                }, sOpts);
    return opts;
  }
  componentDidMount() {
    const {width, height, nodes} = this.props;
    if (width && height && nodes) {
      this.setState({forceUpdate:true});
    }
    sendRefsToParent(this, {graphDiv:this.graphDiv});
  }
  componentDidUpdate(prevProps, prevState) {
    // too many updates, need to fix
    let {nodes=[], edges=[], className='',style='',
          width, height} = this.props;
    let opts = this.options({
                  width, height, 
                  domRefs: {
                    div: this.graphDiv, svg:this.graphSvg,
                    width, height,
                  }});
    if (!this.renderer) {
      if (nodes.length && width && height) {
        this.renderer = 
          this.sigmaInstance.addRenderer(opts);
        console.log("created renderer. shouldn't be back here");
      } else {
        return;
      }
      this.renderer.bind('render',(e=>this.setState({renderEvt:e})).bind(this));
    }
    if (!_.isEqual(prevProps.nodes, nodes)) {
      if (this.cam /*&& !sizeDomain*/) {
        let sizeDomain = d3.extent(nodes.map(d=>d.size));
        this.renderer.settings('sizeDomain', sizeDomain);
        //this.setState({ sizeDomain });
        let nodeSizeScale = d3.scaleLinear()
                              .domain(sizeDomain)
                              .range([1,2.5]);  
        let zoomFontScale = d3.scaleLinear() // i think the largest zoomratio (or whatever sigma is doing) is 2 right now
                              .domain([2,0])
                              .range([6,20]);
        let fontFromSize = size => nodeSizeScale(size) * zoomFontScale(this.cam.ratio);
        this.renderer.settings('nodeSizeScale', nodeSizeScale);
        this.renderer.settings('zoomFontScale', zoomFontScale);
        this.renderer.settings('fontFromSize', fontFromSize);
        //console.log('prefix', this.renderer.settings('prefix'));
      }
      this.renderer.graph.clear();
      this.renderer.graph.read({nodes,edges});
      this.sigmaInstance.camera.ratio = opts.settings.cameraRatio;
      this.setState({needToRefresh:true});
      //this.setState({nodes:nodes});
    }
    if (this.state.needToRefresh) {
      //debugger;
      this.sigmaInstance.refresh();
      this.setState({needToRefresh:false});
    }
    sendRefsToParent(this, {graphDiv:this.graphDiv});
  }
  setHoverNode(e, node, listenerProps) {
    let {settings} = this;
    let {hoverNode, hoverNeighbors} = this.state;
    if (hoverNode !== node) {
      //if (node) { node.hideLabel = true; }
      //this.hoverNode && renderer.dispatchEvent( 'outNode', { renderToSigma, node: this.hoverNode, renderer, isRedispatched: true });
      //node && renderer.dispatchEvent( 'overNode', { renderToSigma, node, isRedispatched: true });
      hoverNode = node;
      hoverNeighbors = this.sigmaInstance.graph.neighborhood(node&&node.id||'');
      //console.log('hoverNode', hoverNode && hoverNode.id, hoverNeighbors.nodes.map(d=>d.id).join(' / '), hoverNeighbors.edges.map(d=>d.id).join(' / '),);
      this.setState({hoverNode, hoverNeighbors});
      this.sigmaInstance.refresh();
    }
  }
  getNodeState(node) {
    let {hoverNode, hoverNeighbors} = this.state;
    return {
      hover: hoverNode && hoverNode.id === node.id,
      hoverNeighbor: _.includes(hoverNeighbors.nodes, node),
      muted: hoverNode && hoverNode.id !== node.id,
    };
  }
  getEdgeState(edge) {
    let {hoverNode, hoverNeighbors} = this.state;
    return {
      targetHover: hoverNode && hoverNode.id === edge.target,
      sourceHover: hoverNode && hoverNode.id === edge.source,
      muted: hoverNode && hoverNode.id !== edge.source.id && hoverNode.id !== edge.target,
    };
  }
  elClass(node, whichEl) {
    let settings = (this.renderer || this.sigmaInstance).settings;
    let ElClass;
    switch (whichEl) {
      case "node":
        ElClass = node.NodeClass || settings('DefaultNodeClass');
        break;
      case "label":
        ElClass = node.LabelClass || settings('DefaultLabelClass');
        break;
      case "hover":
        ElClass = node.HoverClass || settings('DefaultHoverClass');
        break;
      case "edge":
        ElClass = node.EdgeClass || settings('DefaultEdgeClass');
        break;
    }
    return ElClass;
  }
  render() {
    const {eventHandlers, hoverNode, hoverNeighbors } = this.state;
    let settings = (this.renderer || this.sigmaInstance).settings;
    let graph = (this.renderer || this.sigmaInstance).graph;
    let props = Object.assign({},this.props, this.state);
    let {nodes=[], edges=[], className='',style='',
          width, height} = props;
    //console.log(`rendering SigmaReactGraph with ${nodes.length} nodes`);
    let svg = '';
    if (nodes.length && width && height) {
      svg = <SrgSvg 
              srg={this}
              sendRefsToParent={getRefsFunc(this,'graphSvg', true)}
              getNodeState={this.getNodeState.bind(this)}
              getEdgeState={this.getEdgeState.bind(this)}
              {...{graph, settings, width, height, nodes,
                    edges, style, className,
                    hoverNode, hoverNeighbors, }} />;
    }
    //let children = React.cloneElement( this.props.children, props);
                  //renderer={renderer}
                  //refFunc={(div=>{ this.graphDiv=div; if (refFunc) refFunc(div); }).bind(this)} 
    return  <ListenerNode wrapperTag="div" className={className} style={style} 
                  renderer={this.renderer}
                  eventsToHandle={['onMouseMove']}
                  sendRefsToParent={getRefsFunc(this,'graphDiv')}
                  eventHandlers={eventHandlers}
                  >
              {svg}
            </ListenerNode>;
  }
}
SigmaReactGraph.propTypes = {
  nodes: React.PropTypes.array.isRequired,
};
class SrgSvg extends Component {
  constructor(props) {
    super(props);
  }
  componentDidUpdate() {
    sendRefsToParent(this);
  }
  render() {
    let {srg, graph, settings, width, height, nodes,
          edges, style, sendRefsToParent, className, hoverNode,
          getNodeState, getEdgeState,
        } = this.props;
    if (!(graph && settings && nodes.length && width && height)) {
      console.log("don't have all props for svg");
      return null;
    }
    //console.log(`rendering SrgSvg with ${nodes.length} nodes, hover: ${hoverNode&&hoverNode.id}`);
    let c = settings('classPrefix');
                //ref={parentWantsRef}
    return <svg {...{width, height}} 
                ref="svg"
                className={c+'-svg'}>

              <g ref="node-group" id={`${c}-group-nodes`} 
                  className={`${c}-group`} >
                {graph.nodes().map(
                  node => <SigmaNode srg={srg}
                              key={node.id} node={node} settings={settings} 
                              getNodeState={()=>getNodeState(node)}
                            />)}
              </g>
              <g ref="label-group" id={`${c}-group-labels`} 
                  className={`${c}-group`} >
                {graph.nodes().map(
                  node => <SigmaLabel srg={srg}
                              key={node.id} node={node} settings={settings} 
                              getNodeState={()=>getNodeState(node)}
                            />)}
              </g>
              <g ref="edge-group" id={`${c}-group-edges`} 
                  className={`${c}-group`} >
                {graph.edges().map(
                  edge => <SigmaEdge srg={srg}
                              key={edge.id} edge={edge} settings={settings} 
                              source={graph.nodes(edge.source)}
                              target={graph.nodes(edge.target)}
                              getEdgeState={()=>getEdgeState(edge)}
                            />)}
              </g>
              <g ref="hover-group" id={`${c}-group-hovers`} 
                  className={`${c}-group`} >
                { hoverNode &&
                    <SigmaHover srg={srg}
                        node={hoverNode} settings={settings} 
                        getNodeState={()=>getNodeState(hoverNode)}
                    /> || ''}
              </g>
              <canvas className={c+'-measurement-canvas'} />
            </svg>
  }
}
export function firstLastEvent(rxSubj, ms) {
  return (Rx.Observable.merge(rxSubj.debounceTime(ms), rxSubj.throttleTime(ms))
          .distinctUntilChanged());
}
/*
    confusing, but here's what I think is happening:

    - data is composed into plain js node/edge objects
      - nodes generally have 
        - a nodeData property containing the actual data the node represents
        - id, x, y, label, and stuff nodes need for rendering
        - optionally, a NodeClass property with the react component class
          to be rendered inside the dom element sigma creates for that node;
          NodeClass should subclass MacroNode
        - optionally, a type property; IF the node/edge type has a definition
          in sigmaReactRenderer, it will be rendered with the NodeClass (or EdgeClass);
          if not, it will just be a regular sigma node/edge
      - edges have a source node id and target node id

    - a SigmaReactGraph is made with properties:
      - nodes/edges described above


    and then inside that will be a ReactInsideSigmaNode component
*/

class SigmaNodeEl extends Component { // for nodes, labels, hovers
  componentDidMount() {
    this.props.node.ref = this.refs.g;
  }
  componentDidUpdate() {
    this.props.node.ref = this.refs.g;
  }
  render() {
    const {srg, whichEl, node, settings, eventProps, getNodeState,
              wrapperProps={}, style={},
              eventHandlers=[]} = this.props;
    if (node.hidden_for_render) return null;
    let prefix = settings('prefix') || '';
    if (prefix && !node[prefix+'x']) {
      prefix = '';
    }
    let gClass = settings('classPrefix') + '-' + whichEl;
                  //+ (node.classes ? ' ' + node.classes : '');
    //if (node.classes) throw new Error("ignoring node.classes for now");
    let nodeState = getNodeState(node);
    let size = node[prefix + 'size'];
    let x = node[prefix+'x'];
    let y = node[prefix+'y'];
    if (typeof x === 'undefined') throw new Error('no x');

    let nodeType = elType(node, settings, 'node');
    let ElClass = srg.elClass(node, whichEl);;
    let fill, stroke, strokeWidth, content, fontSize, fontFamily, contentClass;
    if (!ElClass) { // right now just using nodeType (defaultNodeType)
                                // for node circles or label texts
      switch (whichEl) {
        case "node":
          // FIX COLOR STUFF!  css?
          fill = nodeState.hover && settings('defaultNodeHoverColor') 
                      || nodeState.hoverNeighbor && 'pink' 
                      || nodeState.muted && settings('defaultNodeMuteColor')
                      || node.color || settings('defaultNodeColor');
          strokeWidth = nodeState.hover || nodeState.hoverNeighbor ? 4 : 0;
          stroke = nodeState.hover && settings('defaultNodeHoverStrokeColor') 
                      || nodeState.hoverNeighbor && 'purple';
          contentClass = gClass + '-circle';
          content = <ListenerTarget wrapperTag="circle" 
                          wrapperProps={
                            Object.assign({},wrapperProps, {
                              fill, stroke, strokeWidth,
                              r:size,
                              style:style,
                              ['data-node-id']:node.id, 
                            })}
                          className={contentClass}
                          />;
          break;
        case "label":
          contentClass = gClass = '-text';
          if (nodeState.hover) return null;
          if (!settings('forceLabels') && size < settings('labelThreshold'))
            return null;
          fontSize = (settings('labelSize') === 'fixed') ?
                settings('defaultLabelSize') :
                settings('labelSizeRatio') * size;
          fontSize = fontSize * (nodeState.hoverNeighbor && 1.2 
                                  || nodeState.muted && 0.8
                                  || 1);
          fontFamily = settings('font');
          var normalLabelColor = (settings('labelColor') === 'node') ?
                                    (node.color || settings('defaultNodeColor')) :
                                    settings('defaultLabelColor');
          // FIX COLOR STUFF!  css?
          fill =  nodeState.hoverNeighbor && settings('defaultLabelNeighborColor')
                      || nodeState.muted && settings('defaultNodeMuteColor')
                      || normalLabelColor;
          //console.log(node.id, nodeState);
          x = x + size + 3;
          y = y + fontSize / 3;
          content = <ListenerTarget wrapperTag="text" 
                          wrapperProps={
                            Object.assign({},wrapperProps,
                              {fontSize, fill, fontFamily,})} 
                          className={contentClass} 
                          data-label-target={node.id} 
                          data-node-id={node.id} 
                          style={style}
                      >{node.label}</ListenerTarget>;
          break;
        case "hover":
          contentClass = gClass = '-text';
          if (!nodeState.hover) return null;
          fontSize = (settings('labelSize') === 'fixed') ?
                settings('defaultLabelSize') :
                settings('labelSizeRatio') * size;
          fontSize = fontSize * 1.6;
          fontFamily = settings('font');
          var normalLabelColor = (settings('labelColor') === 'node') ?
                                    (node.color || settings('defaultNodeColor')) :
                                    settings('defaultLabelColor');
          // FIX COLOR STUFF!  css?
          fill =  nodeState.hoverNeighbor && settings('defaultLabelNeighborColor')
                      || nodeState.muted && settings('defaultNodeMuteColor')
                      || normalLabelColor;
          //console.log(node.id, nodeState);
          x = x + size + 3;
          y = y + fontSize / 3;
          content = <ListenerTarget wrapperTag="text" 
                          wrapperProps={
                            Object.assign({},wrapperProps,
                              {fontSize, fill, fontFamily,})} 
                          className={contentClass} 
                          data-label-target={node.id} 
                          data-node-id={node.id} 
                          style={style}
                      >{node.label}</ListenerTarget>;
          break;
      }
    } else {
      content = <ElClass {...this.props} size={size} >
                  {this.props.children}
                </ElClass>
      // wrap in listener and fo
      let divClass = settings('classPrefix') + '-fo-div'
      content = <ForeignObject node={node} settings={settings} 
                      eventHandlers={eventHandlers} 
                >
                  {content}
              </ForeignObject>
    }
    // maybe want options for not wrapping in g/foreignobj/listener
    return  <g transform={`translate(${x},${y})`} ref="g"
                className={gClass + ' ' + (node.classes||'')}
            >
              {content}
            </g>;
  }
}
export class SigmaNode extends Component {
  render() {
    return <SigmaNodeEl whichEl="node" {...this.props} />;
  }
}
export class SigmaLabel extends Component {
  render() {
    return <SigmaNodeEl whichEl="label" {...this.props} />;
  }
}
export class SigmaHover extends Component {
  render() {
    return <SigmaNodeEl whichEl="hover" {...this.props} />;
  }
}
export class SigmaEdge extends Component {
  componentDidMount() {
    this.props.edge.ref = this.refs.g;
  }
  componentDidUpdate() {
    this.props.edge.ref = this.refs.g;
  }
  render() {
    const {edge, source, target, settings, eventProps, getEdgeState, } = this.props;
    if (edge.hidden_for_render) return null;
    var color = edge.color,
        prefix = settings('prefix') || '',
        edgeColor = settings('edgeColor'),
        defaultNodeColor = settings('defaultNodeColor'),
        defaultEdgeColor = settings('defaultEdgeColor');
    let gClass = settings('classPrefix') + '-edge';
    let lClass = gClass + '-line';

    let edgeState = getEdgeState(edge);
    let strokeWidth = (edge[`${prefix}size`] || 1) / (edgeState.muted ? 2 : 1);
    let stroke = edgeState.sourceHover && settings('defaultNodeHoverColor') 
                || edgeState.targetHover && 'pink' 
                || edgeState.muted && settings('defaultNodeMuteColor')
                || edge.color || settings('defaultEdgeColor');

    let EdgeClass = edge.EdgeClass || ListenerTarget;

    let content =  
            <EdgeClass {...this.props} wrapperTag='g' className={gClass} data-edge-id={edge.id} >
              <line   {...{stroke, strokeWidth}}
                      className={lClass} data-edge-id={edge.id} 
                      x1={source[prefix + 'x']}
                      y1={source[prefix + 'y']}
                      x2={target[prefix + 'x']}
                      y2={target[prefix + 'y']}
              />
            </EdgeClass>;
    return  <g ref="g" className={gClass + ' ' + (edge.classes||'')} >
              {content}
            </g>;
              
      /*
        line.style.display = '';
      const circleSizeRange = [3,10];
      const size = d3.scaleLinear().domain(settings('sizeDomain'))
                                   .range(circleSizeRange);
      const scaleFactor = node[`${prefix}size`] / node.size;
      */
  }
}
export class SigmaGroup extends Component {
  render() {
    const {grp, settings, children} = this.props;
    let c = settings('classPrefix');
    return (<g id={`${c}-group-${grp}`} className={`${c}-group`} >
              {children}
            </g>);
  }
}
export class FoLabel extends Component {
  render() {
    return <ForeignObject {...this.props} />;
  }
}
export class FoNode extends Component {
  render() {
    return <ForeignObject {...this.props} />;
  }
}
export class FoHover extends Component {
  render() {
    return <ForeignObject {...this.props} />;
  }
}
export class ForeignObject extends Component {
  constructor(props) {
    super(props);
    this.state = {w:0, h:0, updates:0, styles: {}};
  }
  componentDidMount() {
    const {node, } = this.props;
    this.resizeFo();
    //node.resizeFo = this.resizeFo.bind(this);
  }
  resizeFo() {
    const {node, settings} = this.props;
    let {w, h, styles} = this.state;
    styles = _.cloneDeep(styles); // not to mutate existing state...probably doesn't matter
    //const {fontSize, fontColor, fontFamily} = styles;
    if (!this.foDiv) {
      console.log('no foDiv for resizing', node.id);
      return {w:0,h:0};
    }
    const fontStyles = this.fontStyles();
    Object.assign(styles, fontStyles);
    const {fontSize, fontColor, fontFamily} = fontStyles;
    // Case when we don't want to display the fo
    if (!settings('forceLabels') && 
          fontSize < settings('labelFontSizeThreshold')) {
      styles.display = 'none';
      [w,h] = [0,0];
    } else {
      [w,h] = getSize(this.foDiv);
    }
    //console.log(w,h);
    this.setState({styles, w, h});
    return {w,h, styles};
  }
  fontStyles() {
    const {node, settings} = this.props;
    const {fontSize, fontColor, } = this.state.styles;
    let size = node.size;
    let fs = (settings('labelSize') === 'fixed')
                      ? settings('defaultLabelSize')
                      : settings('fontFromSize')(size);
    let fc = (settings('labelColor') === 'node')
                      ? (node.color || settings('defaultNodeColor'))
                      : settings('defaultLabelColor');
    let fontFamily = settings('font');
    return {fontSize:fs, fontColor:fc, fontFamily};
  }
  render() {
    const {eventHandlers=[], settings, node, wrapperProps={} } = this.props;
    let {w, h, styles} = this.state;
    const {fontSize, fontColor, } = styles;
    const foClass = settings('classPrefix') + '-fo';
    const divClass = settings('classPrefix') + '-fo-div';
    let prefix = settings('prefix') || '';
    let size = node[prefix + 'size'];
    //console.log("rendering fo", node.id)
    /*
    return <g data-node-id={node.id} data-el={this}>
              <foreignObject className={className} width={w} height={h} >
                <div className={className + '-div'}
                      ref={d=>this.foDiv=d} style={this.state.styles} >
                  {children}
                </div>
              </foreignObject>
           </g>;
    */
    let x = node[prefix+'x'] - w / 2;
    let y = node[prefix+'y'] - h / 2;
    if (typeof x === 'undefined') throw new Error('no x');
    /*
    let children = 
      React.Children.map(this.props.children,
        child => {
          console.log(child);
          return (child.type instanceof Component
            ?  React.cloneElement(child, {
                    eventHandlers: eventHandlers.concat(this.resizeFo.bind(this)),
                    ...wrapperProps
                  })
            : React.cloneElement(child, wrapperProps ));
        });
    */
    return  <foreignObject className={foClass} width={w} height={h} >
              <ListenerTarget wrapperTag="div" 
                    wrapperProps={wrapperProps /*div props*/}
                    data-node-id={node.id}
                    className={divClass} 
                    sendRefsToParent={getRefsFunc(this,'foDiv', false, false)}
              >
                {this.props.children}
              </ListenerTarget>
            </foreignObject>
    //<div className={className + '-div'} ref={d=>this.foDiv=d} style={styles} > </div>
    if (this.props.needsRect) {
      throw new Error("fix this");
      //return  <g><rect className="edge-cover" />{fo}</g>;
    }
  }
}
function getSize(dn) {
  let cbr = dn.getBoundingClientRect(), 
      rw = Math.round(cbr.width),
      rh = Math.round(cbr.height);
  return [rw,rh];
}
export class ListenerTarget extends Component {
  constructor(props) {
    super();
    this.targetId = ListenerTarget.nextId++;
    ListenerTarget.targets[this.targetId] = this;
  }
  componentDidMount() {
    sendRefsToParent(this);
    this.props.listener && this.props.listener();
  }
  componentDidUpdate() {
    sendRefsToParent(this);
    this.props.listener && this.props.listener();
  }
  render() {
    //const {wrapperTag='g', wrapperProps, children, refFunc=d=>this.elRef=d, className } = this.props;
    const {wrapperTag='g', wrapperProps, children, 
            className } = this.props;
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
              //{React.cloneElement(this.props.children, this.props)}
    return  <Tag className={(className||'')+" listener-target"} 
                  ref="listenerTarget"
                  data-target-id={this.targetId} {...wrapperProps}>
              {children}
            </Tag>;
  }
}
ListenerTarget.nextId = 0;
ListenerTarget.targets = [];
function findTarget(el) {
  if (el.classList.contains('listener-target'))
    return [ListenerTarget.targets[el.getAttribute('data-target-id')], el];
  if (el.classList.contains('listener-node'))
    return [null,null];
  if (el.parentNode)
    return findTarget(el.parentNode);
  console.log("can't find target for", el);
}
export class ListenerNode extends Component {
  constructor(props) {
    super(props);
    this.state = { eventListeners:{}, };
  }
  eventListeners() {
    const {eventsToHandle=[ 'onClick', 'onMouseMove'], 
           eventHandlers=[]} = this.props;
    //console.log('binding ListenerNode to', eventsToHandle);
    const eventListeners = _.fromPairs(
      eventsToHandle.map(
        eventType=> [eventType,this.dispatch.bind(this)]));
    this.setState({eventListeners});
  }
  componentDidMount() {
    this.eventListeners();
    sendRefsToParent(this);
  }
  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevProps.eventsToHandle, this.props.eventsToHandle) ||
        !_.isEqual(prevProps.eventHandlers, this.props.eventHandlers)) {
      this.eventListeners();
    }
    sendRefsToParent(this);
  }
  dispatch(e) {
    //console.log("BROKEN -- shouldn't need a renderer");
    const {eventHandlers=[], renderer } = this.props;
    let [target,targetEl] = findTarget(e.target);
    let node;
    if (target && target.props.node) {
      node = target.props.node;
      if (target.props.listener)
        target.props.listener(e, node, this.props);
    } else if (target && target.props["data-node-id"]) {
      //console.log("FIX?");
      node = renderer.graph.nodes(target.props["data-node-id"]);
    } else if (targetEl && targetEl.getAttribute('data-node-id')) {
      node = renderer.graph.nodes(targetEl.getAttribute('data-node-id'));
    }
    //console.log('node', target||'none',);
    //e.target.tagName !== 'svg' && console.log('dispatching', e.type, 'from', node&&node.id, 'to', target||'nothing');
    eventHandlers.forEach( l => l(e, node, this.props));
    /*
    if (!sigmaDomEl || document.body.contains(sigmaDomEl)) {
      eventHandlers.forEach( l => l(e, this.props));
    } else {
      console.log(`can't handle ${e.type} because ListenerNode no longer on page`);
    }
    */
  }
  render() {
    const {wrapperTag='g', children, className } = this.props;
    const {eventListeners} = this.state;
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
                //ref={parentWantsRef}>
    return  <Tag className={'listener-node ' + (className||'') } 
                {...eventListeners} 
                ref="listenerNode" >
              {children}
            </Tag>;
  }
}
/*
export class GNode extends Object {
  constructor(props) {
    super();
    let cls = new.target.name;
    console.log(this.propsRequired);
    console.log(this.propsRequired());
    _.extend(this, props);
    console.log(this.propsRequired);
    console.log(this.propsRequired());
    _.each(this.propsRequired(),
      (v,k) => {
        if (typeof v === 'string') {
          if (typeof this[k] !== v) 
            throw new Error(`${cls} requires ${k} ${v} prop`);
        } else if (typeof v === 'function') {
          if (!(this[k] instanceof v)) 
            throw new Error(`${cls} requires ${k.name} prop`);
        } else {
          throw new Error("weird requirement");
        }
    });
  }
  propsRequired() {
    return {
      id: 'string',
    }
  }
  toString() {
    return this.id;
  }
}
export class Edge extends Node {
  constructor(props) {
    super(props);
    this.id = this.id || `${this.source}->${this.target}`;
  }
  propsRequired() {
    return {
      source: Node,
      target: Node,
    }
  }
}
*/

