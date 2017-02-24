// @ flow // flow breaking on new.target, so not using right now

import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
import _ from 'supergroup'; // just for lodash
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

export class MacroNode extends Component { // abstract class
  constructor(props) {
    // $FlowIssue: https://github.com/facebook/flow/issues/1152
    if (new.target === MacroNode) {
      throw new TypeError("Cannot construct MacroNode instances directly");
    }
    super(props);
    // react events to handle -- https://facebook.github.io/react/docs/events.html#mouse-events
    let eventsToHandle = props.eventsToHandle || [ 'onClick', 'onMouseEnter', 'onMouseLeave',];

    this.state = {
      eventsToHandle,
    };
  }
  render(content) {
    const {sigmaNode, sigmaSettings, sigmaEventHandler} = this.props;
    const {eventsToHandle} = this.state;
    return <div className="macronode" ref={d=>this.contentRef=d}
                {..._.fromPairs(eventsToHandle.map(type=>[type,sigmaEventHandler]))}
            >{content}</div>;
  }
}

class ReactEl extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  externalReactComponent() {
    const {node, settings} = this.props;
    let Component = node.NodeClass || settings('DefaultNodeClass');
    return <Component sigmaNode={node} sigmaSettings={settings} 
                      sigmaEventHandler={this.reactComponentEventHandler.bind(this)}/>;
  }
  reactComponentEventHandler(e) {
    console.log(e);
    /*
    let nodeId = $(jqEvt.target).closest('g.sigma-node').attr('data-node-id');
    if (sigmaSource.id === nodeId || sigmaTarget.id === nodeId) {}
    let eventNodeId = $(target).closest('g.sigma-node').attr('data-node-id');
    let neighbors = sigmaNode.sigmaInstance.graph.neighborhood(eventNodeId);
    let perspective = // self, neighbor, other
      eventPerspective(sigmaNode.id, eventNodeId, neighbors.nodes.map(d=>d.id));
    */
  }
}
class ReactNode extends ReactEl {
  constructor(props) {
    super(props);
  }
}
class ReactEdge extends ReactEl {
  constructor(props) {
    super(props);
  }
}
class FoNode extends ReactNode {
  constructor(props) {
    super(props);
    this.state = Object.assign(this.state, {w:0, h:0, updates:0, styles: {}});
  }
  componentDidMount() {
    const {node, } = this.props;
    node.resizeFo = this.resizeFo.bind(this);
  }
  resizeFo() {
    const {node, settings} = this.props;
    let {w, h, styles} = this.state;
    styles = _.cloneDeep(styles); // not to mutate existing state...probably doesn't matter
    //const {fontSize, fontColor, fontFamily} = styles;
    if (!this.foRef) {
      console.log('no foRef for resizing', node.id);
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
      [w,h] = getSize(this.foRef.childNodes[0]);
    }
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
    const {w,h} = this.state;
    let fo =  <foreignObject className="sigma-react-fo" ref={d=>this.foRef=d}
                  style={this.state.styles} width={w} height={h}
              >
                {this.externalReactComponent()}
              </foreignObject>
    if (this.props.needsRect) {
      return  <g><rect className="edge-cover" />{fo}</g>;
    }
    return fo;
  }
}
function getSize(dn) {
  let cbr = dn.getBoundingClientRect(), 
      rw = Math.round(cbr.width),
      rh = Math.round(cbr.height);
  return [rw,rh];
}


function sigmaReactRenderer() {
  var sigma = require('sigma');
  neighborhoodPlugin(sigma);
  sigma.utils.pkg('sigma.svg.nodes');
  sigma.utils.pkg('sigma.svg.labels');
  sigma.utils.pkg('sigma.svg.hovers');

  sigma.svg.nodes.react = { // works, but not using at moment
    create: function(node, settings) {
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-node-id', node.id);
      g.setAttributeNS(null, 'class', `${settings('classPrefix')}-node ${node.classes||''}`);
      render(<FoNode needsRect={true} node={node} settings={settings}/>, g);
      return g;
    },
    update: function(node, el, settings) {
      let prefix = settings('prefix') || '';
      el.style.display = '';  // must do this before calling resizeFo
      const {w,h,styles} = node.resizeFo();
      // this should center the fo on the node location
      el.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x'] - w/2},${node[prefix+'y'] - h/2})`);
      return this;
    }
  };
  sigma.svg.labels.def_react_react = {
    // node.type of def_react_react should mean 
    //    node renderer=def, label renderer is this one, hover renderer...
    create: function(node, settings) {
      const prefix = settings('prefix') || '';
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-label-target', node.id);
      g.setAttributeNS(null, 'class', `${settings('classPrefix')}-label ${node.classes||''}`);
      render(<FoNode needsRect={false} node={node} settings={settings}/>, g);
      return g;
    },
    update: function(node, el, settings) {
      const prefix = settings('prefix') || '';
      const size = node[prefix + 'size'];
      el.style.display = '';  // must do this before calling resizeFo
      const {w,h,styles} = node.resizeFo();
      const {fontSize, fontColor, fontFamily} = styles;
      el.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x'] + size + 3},${node[prefix+'y'] + fontSize / 3})`);
      return this;
    }
  };
  sigma.svg.hovers.html = {
    create: function(node, nodeCircle, measurementCanvas, settings) {
      // Defining visual properties
      var x, y, w, h, e, d,
          fontStyle = settings('hoverFontStyle') || settings('fontStyle'),
          prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          fontSize = (settings('labelSize') === 'fixed') ?
            settings('defaultLabelSize') :
            settings('labelSizeRatio') * size,
          fontColor = (settings('labelHoverColor') === 'node') ?
                        (node.color || settings('DefaultNodeColor')) :
                        settings('defaultLabelHoverColor');
      var group = document.createElementNS(settings('xmlns'), 'g'),
          rectangle = document.createElementNS(settings('xmlns'), 'rect'),
          circle = document.createElementNS(settings('xmlns'), 'circle'),
          text = document.createElementNS(settings('xmlns'), 'text');
      group.setAttributeNS(null, 'class', settings('classPrefix') + '-hover');
      //g.setAttributeNS(null, 'class', `${settings('classPrefix')}-node ${node.classes||''}`);
      group.setAttributeNS(null, 'data-node-id', node.id);

      if (typeof node.label === 'string') {
        text.innerHTML = node.label;
        text.textContent = node.label;
        text.setAttributeNS(
            null,
            'class',
            settings('classPrefix') + '-hover-label');
        text.setAttributeNS(null, 'font-size', fontSize);
        text.setAttributeNS(null, 'font-family', settings('font'));
        text.setAttributeNS(null, 'fill', fontColor);
        text.setAttributeNS(null, 'x',
          Math.round(node[prefix + 'x'] + size + 3));
        text.setAttributeNS(null, 'y',
          Math.round(node[prefix + 'y'] + fontSize / 3));

        // Measures
        // OPTIMIZE: Find a better way than a measurement canvas
        x = Math.round(node[prefix + 'x'] - fontSize / 2 - 2);
        y = Math.round(node[prefix + 'y'] - fontSize / 2 - 2);
        w = Math.round(
          measurementCanvas.measureText(node.label).width +
            fontSize / 2 + size + 9
        );
        h = Math.round(fontSize + 4);
        e = Math.round(fontSize / 2 + 2);

        // Circle
        circle.setAttributeNS(
            null,
            'class',
            settings('classPrefix') + '-hover-area');
        circle.setAttributeNS(null, 'fill', '#fff');
        circle.setAttributeNS(null, 'cx', node[prefix + 'x']);
        circle.setAttributeNS(null, 'cy', node[prefix + 'y']);
        circle.setAttributeNS(null, 'r', e);

        // Rectangle
        rectangle.setAttributeNS(
            null,
            'class',
            settings('classPrefix') + '-hover-area');
        rectangle.setAttributeNS(null, 'fill', '#fff');
        rectangle.setAttributeNS(null, 'x', node[prefix + 'x'] + e / 4);
        rectangle.setAttributeNS(null, 'y', node[prefix + 'y'] - e);
        rectangle.setAttributeNS(null, 'width', w);
        rectangle.setAttributeNS(null, 'height', h);
      }

      // Appending childs
      group.appendChild(circle);
      group.appendChild(rectangle);
      group.appendChild(text);
      group.appendChild(nodeCircle);

      return group;
    }
  };
  return sigma;
  /*   not using at the moment
  sigma.utils.pkg('sigma.svg.edges');
  sigma.svg.edges.react = {
    /**
     * SVG Element creation.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     * /
    create: function(edge, source, target, settings) {
      let g = document.createElementNS(d3.namespaces.svg, 'g');

      var color = edge.color,
          prefix = settings('prefix') || '',
          edgeColor = settings('edgeColor'),
          defaultNodeColor = settings('defaultNodeColor'),
          defaultEdgeColor = settings('defaultEdgeColor');

      if (!color)
        switch (edgeColor) {
          case 'source':
            color = source.color || defaultNodeColor;
            break;
          case 'target':
            color = target.color || defaultNodeColor;
            break;
          default:
            color = defaultEdgeColor;
            break;
        }
      g.setAttributeNS(null, 'stroke', color);
      g.setAttributeNS(null, 'data-edge-id', edge.id);
      g.setAttributeNS(null, 'class', 
              settings('classPrefix') + '-edge'
                          + (edge.classes||''));

      let Component = edge.EdgeClass || settings('DefaultEdgeClass');
      render(<Component sigmaEdge={edge} sigmaSource={source} 
              sigmaTarget={target} sigmaSettings={settings} />, g);
      return g;
    },

    /**
     * SVG Element update.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {DOMElement}               line       The line DOM Element.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     * /  
    update: function(edge, el, source, target, settings) {
      el.style.display = '';
      edge.update(edge, el, source, target, settings);
      return this;
    }
  };
  */
}

import Rx from 'rxjs/Rx';
export function firstLastEvt(rxSubj, ms) {
  return Rx.Observable.merge(rxSubj.debounceTime(ms), rxSubj.throttleTime(ms)).distinctUntilChanged()
}
export default class SigmaReactGraph extends Component { // started making this, but not using yet...finish?
  constructor(props) {
    super(props);
    this.state = {updates:0};
    this.nodeEventStream = new Rx.Subject();
    //this.msgInfoStream = new Rx.Subject();
  }
  componentDidMount() {
    this.setState({forceUpdate: true});
    //firstLastEvt(this.msgInfoStream,50).subscribe( function(msgInfo) { //console.log(msgInfo); self.setState({msgInfo}); });
  }
  componentDidUpdate() {
    const {width, height} = this.props;
    const {w, h} = this.state;
    if (w !== width || h !== height) {
      $(this.graphDiv).width(width);
      $(this.graphDiv).height(height);
      console.log('setting dims');
      this.setState({w:width, h:height});
    }
    if (!this.sigmaInstance)
      this.makeGraph();
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.nodes &&
        $(this.graphDiv).find('.sigma-node').length 
          > this.props.nodes.length * 1.5)
      debugger; // too many nodes!  (had a memory leak with this for a while)
    return $(this.graphDiv).find('.sigma-node').length < 100;
  }
  makeGraph() {
    let {nodes=[], edges=[], DefaultNodeClass, 
          defaultNodeType, defaultEdgeType} = this.props;
    console.log('making graph');
    if (!nodes.length) return;
    if (defaultNodeType)
      nodes.forEach(node=>node.type=node.type||defaultNodeType);
    if (defaultEdgeType)
      edges.forEach(edge=>edge.type=edge.type||defaultEdgeType);
    let sigma = sigmaReactRenderer();
    let s = new sigma({graph:{nodes,edges}});
    let cam = s.addCamera();
    // biggest node will be 2.5 times bigger than smallest on this scale:
    let nodeSizeScale = d3.scaleLinear()
                          .domain(d3.extent(nodes.map(d=>d.size)))
                          .range([1,2.5]);  
    let zoomFontScale = d3.scaleLinear() // i think the largest zoomratio (or whatever sigma is doing) is 2 right now
                          .domain([2,0])
                          .range([6,20]);
    let fontFromSize = function(size) {
                          return nodeSizeScale(size) * zoomFontScale(cam.ratio);
                        };
    s.addRenderer({
      container: this.graphDiv,
      type: 'svg',
      camera: cam,
      //freeStyle: true
      settings: {
        DefaultNodeClass,
        //defaultNodeType,
        drawLabels: false,
        drawEdgeLabels: false,
        id: 'main',
        edgeColor: 'target',
        hideEdgesOnMove: true,
        defaultLabelColor: '#fff',
        defaultNodeColor: '#999',
        defaultEdgeColor: '#333',
        edgeColor: 'default',
        labelSize: 'proportional',
        labelFontSizeThreshold: 7,
        //labelThreshold: 7,
        fontFromSize,
        //defaultLabelSize: 22,
        //labelSizeRatio: 4,
      }
    });
    //https://github.com/jacomyal/sigma.js/wiki/Events-API
    s.bind('clickNode clickEdge clickStage overNode overEdge outNode outEdge',
           this.sigmaEventHandler.bind(this));
    s.camera.ratio = .7;
    s.refresh();
    this.setState({graphDrawn:true, });
    window.s = this.sigmaInstance = s;
  }
  render() {
    const {cssClass='', style={}} = this.props;
    const {w,h} = this.state;
    //const {msgInfo=''} = this.state;
    //<MsgInfo info={msgInfo} />
    return <div className={cssClass} style={style} 
                  ref={div=>this.graphDiv=div} 
                   style={{ width: `${w}px`, height: `${h}px`, }}
              />;
  }
  sigmaEventHandler(e) {
    console.log('sigmaEventHandler',e);
  }
}
SigmaReactGraph.propTypes = {
  nodes: React.PropTypes.array.isRequired,
};
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

/* sigma.plugins.neighborhoods constructor.
   from https://github.com/jacomyal/sigma.js/tree/master/plugins/sigma.plugins.neighborhoods
   but that version required a global sigma, which i didn't want to have necessarily
*/
function neighborhoodPlugin(sigma) {
  sigma.classes.graph.addMethod(
    'neighborhood',
    function(centerId) {
      var k1,
          k2,
          k3,
          node,
          center,
          // Those two local indexes are here just to avoid duplicates:
          localNodesIndex = {},
          localEdgesIndex = {},
          // And here is the resulted graph, empty at the moment:
          graph = {
            nodes: [],
            edges: []
          };

      // Check that the exists:
      if (!this.nodes(centerId))
        return graph;

      // Add center. It has to be cloned to add it the "center" attribute
      // without altering the current graph:
      node = this.nodes(centerId);
      center = {};
      center.center = true;
      for (k1 in node)
        center[k1] = node[k1];

      localNodesIndex[centerId] = true;
      graph.nodes.push(center);

      // Add neighbors and edges between the center and the neighbors:
      for (k1 in this.allNeighborsIndex[centerId]) {
        if (!localNodesIndex[k1]) {
          localNodesIndex[k1] = true;
          graph.nodes.push(this.nodesIndex[k1]);
        }

        for (k2 in this.allNeighborsIndex[centerId][k1])
          if (!localEdgesIndex[k2]) {
            localEdgesIndex[k2] = true;
            graph.edges.push(this.edgesIndex[k2]);
          }
      }

      // Add edges connecting two neighbors:
      for (k1 in localNodesIndex)
        if (k1 !== centerId)
          for (k2 in localNodesIndex)
            if (
              k2 !== centerId &&
              k1 !== k2 &&
              this.allNeighborsIndex[k1][k2]
            )
              for (k3 in this.allNeighborsIndex[k1][k2])
                if (!localEdgesIndex[k3]) {
                  localEdgesIndex[k3] = true;
                  graph.edges.push(this.edgesIndex[k3]);
                }

      // Finally, let's return the final graph:
      return graph;
    }
  );
}
