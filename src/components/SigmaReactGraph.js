// @ flow // flow breaking on new.target, so not using right now

const DEBUG = true;
import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
import _ from 'supergroup'; // just for lodash
import Rx from 'rxjs/Rx';

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

export class SigmaNode extends Component {
  //constructor(props) { super(props); this.state = {}; }
  render() {
    const {node, settings, eventProps, getNodeState} = this.props;
    let prefix = settings('prefix');
    let gClass = settings('classPrefix') + '-node'
                  + (node.classes ? ' ' + node.classes : '');
    let circleClass = settings('classPrefix') + '-node-circle';

    let nodeState = getNodeState(node);
    // FIX COLOR STUFF!  css?
    let fill = nodeState.hover && settings('defaultNodeHoverColor') 
                || nodeState.hoverNeighbor && 'pink' 
                || nodeState.muted && settings('defaultNodeMuteColor')
                || node.color || settings('defaultNodeColor');
    let strokeWidth = nodeState.hover || nodeState.hoverNeighbor ? 4 : 0;
    let stroke = nodeState.hover && settings('defaultNodeHoverStrokeColor') 
                || nodeState.hoverNeighbor && 'purple';
    //console.log(node.id, nodeState);
    let r = node[prefix + 'size'];
    let NodeClass = node.NodeClass || ListenerTarget;
    let x = node[prefix+'x'];
    let y = node[prefix+'y'];
    if (typeof x === 'undefined') throw new Error('no x');

    return  <NodeClass {...this.props}  className={gClass} 
                wrapperProps={{ ['data-node-id']:node.id,
                                transform:`translate(${x},${y})`, }}
                  eventProps={eventProps} wrapperTag='g'>
                <circle {...{r, fill, stroke, strokeWidth}} className={circleClass} data-node-id={node.id} />
            </NodeClass>;
      /*
      const circleSizeRange = [3,10];
      const size = d3.scaleLinear().domain(settings('sizeDomain'))
                                   .range(circleSizeRange);
      const scaleFactor = node[`${prefix}size`] / node.size;
      */
  }
}
export class SigmaEdge extends Component {
  render() {
    const {edge, source, target, settings, eventProps, getEdgeState, } = this.props;
    //let circleClass = settings('classPrefix') + '-node-circle';
    var color = edge.color,
        prefix = settings('prefix') || '',
        edgeColor = settings('edgeColor'),
        defaultNodeColor = settings('defaultNodeColor'),
        defaultEdgeColor = settings('defaultEdgeColor');
    let gClass = settings('classPrefix') + '-edge';
    let lClass = settings('classPrefix') + '-edge-line';

    let edgeState = getEdgeState(edge);
    let strokeWidth = (edge[`${prefix}size`] || 1) / (edgeState.muted ? 2 : 1);
    let stroke = edgeState.sourceHover && settings('defaultNodeHoverColor') 
                || edgeState.targetHover && 'pink' 
                || edgeState.muted && settings('defaultNodeMuteColor')
                || edge.color || settings('defaultEdgeColor');

    let EdgeClass = edge.EdgeClass || ListenerTarget;

    return  <EdgeClass {...this.props} wrapperTag='g' className={gClass} data-edge-id={edge.id} >
              <line   {...{stroke, strokeWidth}}
                      className={lClass} data-node-id={edge.id} 
                      x1={source[prefix + 'x']}
                      y1={source[prefix + 'y']}
                      x2={target[prefix + 'x']}
                      y2={target[prefix + 'y']}
              />
            </EdgeClass>;
              
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
export class FoNode extends Component {
}
export class FoLabel extends Component {
}
export class FoHover extends Component {
  constructor(props) {
    super(props);
    this.state = {w:0, h:0, updates:0, styles: {}};
  }
  componentDidMount() {
    const {node, } = this.props;
    //this.resizeFo();
    //node.resizeFo = this.resizeFo.bind(this);
  }
  resizeFo() {
    const {sigmaNode, sigmaSettings} = this.props;
    let {w, h, styles} = this.state;
    styles = _.cloneDeep(styles); // not to mutate existing state...probably doesn't matter
    //const {fontSize, fontColor, fontFamily} = styles;
    if (!this.foDiv) {
      console.log('no foDiv for resizing', sigmaNode.id);
      return {w:0,h:0};
    }
    const fontStyles = this.fontStyles();
    Object.assign(styles, fontStyles);
    const {fontSize, fontColor, fontFamily} = fontStyles;
    // Case when we don't want to display the fo
    if (!sigmaSettings('forceLabels') && 
          fontSize < sigmaSettings('labelFontSizeThreshold')) {
      styles.display = 'none';
      [w,h] = [0,0];
    } else {
      [w,h] = getSize(this.foDiv);
    }
    this.setState({styles, w, h});
    return {w,h, styles};
  }
  fontStyles() {
    const {sigmaNode, sigmaSettings} = this.props;
    const {fontSize, fontColor, } = this.state.styles;
    let size = sigmaNode.size;
    let fs = (sigmaSettings('labelSize') === 'fixed')
                      ? sigmaSettings('defaultLabelSize')
                      : sigmaSettings('fontFromSize')(size);
    let fc = (sigmaSettings('labelColor') === 'node')
                      ? (sigmaNode.color || sigmaSettings('defaultNodeColor'))
                      : sigmaSettings('defaultLabelColor');
    let fontFamily = sigmaSettings('font');
    return {fontSize:fs, fontColor:fc, fontFamily};
  }
  render() {
    const {children, eventHandlers=[], sigmaSettings, sigmaNode} = this.props;
    const {w,h} = this.state;
    const className = sigmaSettings('classPrefix') + '-fo';
    /*
    return <g data-node-id={sigmaNode.id} data-el={this}>
              <foreignObject className={className} width={w} height={h} >
                <div className={className + '-div'}
                      ref={d=>this.foDiv=d} style={this.state.styles} >
                  {children}
                </div>
              </foreignObject>
           </g>;
    */
    return <ListenerTarget wrapperTag="g" 
              eventHandlers={eventHandlers.concat(this.resizeFo.bind(this))}
            >
              <foreignObject className={className} width={w} height={h} >
                <div className={className + '-div'}
                      ref={d=>this.foDiv=d} style={this.state.styles} >
                  {children}
                </div>
              </foreignObject>
           </ListenerTarget>;
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
  render() {
    const {wrapperTag='g', wrapperProps, children, refFunc=d=>this.elRef=d, className } = this.props;
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
              //{React.cloneElement(this.props.children, this.props)}
    return  <Tag className={(className||'')+" listener-target"} ref={refFunc} 
                  data-target-id={this.targetId} {...wrapperProps}>
              {children}
            </Tag>;
  }
}
ListenerTarget.nextId = 0;
ListenerTarget.targets = [];
function findTarget(el) {
  if (el.classList.contains('listener-target'))
    return ListenerTarget.targets[el.getAttribute('data-target-id')];
  if (el.classList.contains('listener-node'))
    return null;
  if (el.parentNode)
    return findTarget(el.parentNode);
}

export class ListenerNode extends Component {
  constructor(props) {
    super(props);
    // react events to handle -- https://facebook.github.io/react/docs/events.html#mouse-events
    let eventsToHandle = props.eventsToHandle || 
      [ 'onClick', 'onMouseEnter', 'onMouseLeave', 'onMouseMove'];
    this.state = {
      eventsToHandle,
    };
  }
  dispatch(e) {
    const {eventHandlers=[], } = this.props;
      //sigmaNode, sigmaSettings, renderToSigma, sigmaDomEl, 
    let target = findTarget(e.target);
    let node = target && target.props.node || null;
    //console.log('node', target||'none',);
    eventHandlers.forEach( l => l(e, node, target, this.props));
    /*
    if (!sigmaDomEl || document.body.contains(sigmaDomEl)) {
      eventHandlers.forEach( l => l(e, this.props));
    } else {
      console.log(`can't handle ${e.type} because ListenerNode no longer on page`);
    }
    */
  }
  render() {
    const {wrapperTag='g', children, refFunc=d=>d } = this.props;
    let eventsToHandle = this.props.eventsToHandle || this.state.eventsToHandle;
    const reactEventypes = _.fromPairs(
      eventsToHandle.map(eventType=> [eventType,this.dispatch.bind(this)]));
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
    return  <Tag className="listener-node" {...reactEventypes} ref={refFunc}>
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

