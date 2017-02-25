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

export class ListenerNode extends Component {
  constructor(props) {
    super(props);
    // react events to handle -- https://facebook.github.io/react/docs/events.html#mouse-events
    let eventsToHandle = props.eventsToHandle || [ 'onClick', 'onMouseEnter', 'onMouseLeave',];
    this.state = {
      eventsToHandle,
    };
  }
  reactCompListener(e) {
    const {sigmaNode, sigmaSettings, rerender, sigmaDomEl, evtHandler} = this.props;
    evtHandler(e, this.props);
    //rerender(sigmaNode, sigmaDomEl, sigmaSettings, e);
  }
  render() {
    const {wrapperTag='g', children } = this.props;
    let eventsToHandle = this.props.eventsToHandle || 
          [ 'onClick', 'onMouseEnter', 'onMouseLeave',];
    const listeners = 
      _.fromPairs(eventsToHandle.map(
          evtType=>[evtType,this.reactCompListener.bind(this)]));
    //{...listeners}
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
    return  <Tag className="listener-node" >
              {children}
            </Tag>;
  }
}
class FoHover extends Component {
}
class FoLabel extends Component {
}
class FoNode extends Component {
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
    /*
    return super.render([
              <Icons key="Icons" hover={hover} />,
              <div key="chunks" className="info-chunks">
                {chunks || <p>nothing yet</p>}
                {children}
              </div>,
              zoomContent ]);
              */
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
  //neighborhoodPlugin(sigma);
  sigma.utils.pkg('sigma.svg.nodes');
  sigma.utils.pkg('sigma.svg.labels');
  sigma.utils.pkg('sigma.svg.hovers');

  sigma.svg.nodes.XXXcircle_label_drill = {
    create: function(node, settings) {
      const prefix = settings('prefix');
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      let className = settings('classPrefix') + '-label';
      g.setAttributeNS(null, 'data-node-id', node.id);
      g.setAttributeNS(null, 'class', className);
      //g.setAttributeNS(null, 'class', `${settings('classPrefix')}-node ${node.classes||''}`);
      return g;
    },
    update: function(node, g, settings, evt) {
      let thisUpdate = sigma.svg.labels.circle_label_drill.update;
      let prefix = settings('prefix') || '';
      let NodeClass = node.NodeClass || settings('DefaultNodeClass');
      let fill = node.color || settings('defaultNodeColor');
      let r = node[prefix + 'size'];
      let className = settings('classPrefix') + '-label',
          evtHandler = settings('reactCompEventHandler');

      g.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x']},${node[prefix+'y']})`);
      /*
      const circleSizeRange = [3,10];
      const size = d3.scaleLinear().domain(settings('sizeDomain'))
                                   .range(circleSizeRange);
      const scaleFactor = node[`${prefix}size`] / node.size;
      */

      g.style.display = '';
      render(<NodeClass sigmaNode={node} sigmaSettings={settings}
                rerender={thisUpdate} sigmaDomEl={g} evt={evt} evtHandler={evtHandler} >
                <circle {...{r, fill, className}} data-node-id={node.id} />
             </NodeClass>, g);
      return this;
    }
  };
  sigma.svg.labels.circle_label_drill = {
    create: function(node, settings) {
      console.log('label create', node.id);
      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          g = document.createElementNS(d3.namespaces.svg, 'g'),
          className = settings('classPrefix') + '-label';
      g.setAttributeNS(null, 'data-label-target', node.id);
      g.setAttributeNS(null, 'class', className);
      return g;
    },

    update: function(node, g, settings, evt) {
      console.log('label update', node.id);
      let thisUpdate = sigma.svg.labels.circle_label_drill.update;

      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          className = settings('classPrefix') + '-label',
          evtHandler = settings('reactCompEventHandler');
      var fontSize = (settings('labelSize') === 'fixed') ?
            settings('defaultLabelSize') :
            settings('labelSizeRatio') * size;

      let LabelClass = node.LabelClass || settings('DefaultLabelClass');

      var fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      var fill = (settings('labelColor') === 'node') ?
                        (node.color || settings('defaultNodeColor')) :
                        settings('defaultLabelColor');
      let fontFamily = settings('font');

      // Case when we don't want to display the label
      if (!settings('forceLabels') && size < settings('labelThreshold'))
        return;
      if (typeof node.label !== 'string')
        return;
      g.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x'] + size + 3},${node[prefix+'y'] + fontSize / 3})`);
      g.style.display = '';

      render(<LabelClass sigmaNode={node} sigmaSettings={settings} 
                rerender={thisUpdate} sigmaDomEl={g} evt={evt} evtHandler={evtHandler}
              >
                <text {...{fontSize, fill, fontFamily, className}} data-label-target={node.id} >
                  {node.label}
                </text>
             </LabelClass>, g);
      return this;
    }
  };


  sigma.svg.hovers.XXXcircle_label_drill = {
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
  componentDidUpdate(prevProps, prevState) {
    const {width, height, nodes, edges} = this.props;
    const {w, h, sigmaInstance, cam, renderer, sizeDomain} = this.state;
    if (!nodes || !nodes.length) {
      if (prevProps.nodes && prevProps.nodes.length)
        throw new Error("what happened to the nodes?");
      return;
    }
    if (w !== width || h !== height) {
      $(this.graphDiv).width(width);
      $(this.graphDiv).height(height);
      this.setState({w:width, h:height});
      return;
    }
    if (!sigmaInstance) {
      let { sigmaInstance, cam, renderer } = this.makeGraph();
      this.setState({sigmaInstance, cam, renderer});
      return;
    }
    if (!_.isEqual(nodes, prevProps.nodes)) {
      sigmaInstance.graph.clear();
      sigmaInstance.graph.read({nodes,edges});
    }
    if (cam && !sizeDomain) {
      let sizeDomain = d3.extent(nodes.map(d=>d.size));
      renderer.settings('sizeDomain', sizeDomain);
      this.setState({ sizeDomain });
      /*
      let nodeSizeScale = d3.scaleLinear()
                            .domain(sizeDomain)
                            .range([1,2.5]);  
      let zoomFontScale = d3.scaleLinear() // i think the largest zoomratio (or whatever sigma is doing) is 2 right now
                            .domain([2,0])
                            .range([6,20]);
      let fontFromSize = function(size) {
                            return nodeSizeScale(size) * zoomFontScale(this.cam.ratio);
                          };
      this.renderer.settings('nodeSizeScale', nodeSizeScale);
      this.renderer.settings('zoomFontScale', zoomFontScale);
      this.renderer.settings('fontFromSize', fontFromSize);
      */
    }
    sigmaInstance && sigmaInstance.refresh();
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.nodes &&
        $(this.graphDiv).find('.sigma-node').length 
          > this.props.nodes.length * 1.5)
      debugger; // too many nodes!  (had a memory leak with this for a while)
    return $(this.graphDiv).find('.sigma-node').length < 100;
  }
  makeGraph() {
    let {nodes=[], edges=[], 
          DefaultNodeClass, 
          DefaultLabelClass,
          DefaultHoverClass,
          DefaultEdgeClass,
          defaultNodeType, defaultEdgeType,
          defaultNodeColor='darkkhaki',
          defaultLabelColor='darkred',
          defaultEdgeColor='darkslateblue',
          defaultLabelSize=16,
          labelSize='proportional',
          labelThreshold=2,
          //labelFontSizeThreshold=2,
          labelSizeRatio=3,
        } = this.props;
    console.log('making graph');
    if (!nodes.length) return;
    if (defaultNodeType)
      nodes.forEach(node=>node.type=node.type||defaultNodeType);
    if (defaultEdgeType)
      edges.forEach(edge=>edge.type=edge.type||defaultEdgeType);
    let sigma = sigmaReactRenderer();
    let sigmaInstance = new sigma({graph:{nodes,edges}});
    let cam = sigmaInstance.addCamera();
    let renderer = sigmaInstance.addRenderer({
      container: this.graphDiv,
      type: 'svg',
      camera: cam,
      //freeStyle: true
      settings: {
        reactCompEventHandler: this.reactCompEventHandler.bind(this),
        DefaultNodeClass,
        DefaultLabelClass,
        DefaultHoverClass,
        DefaultEdgeClass,
        drawLabels: false,
        drawEdgeLabels: false,
        id: 'main',
        edgeColor: 'target',
        hideEdgesOnMove: true,
        defaultLabelColor,
        defaultNodeColor,
        defaultEdgeColor,
        labelSize,
        //labelFontSizeThreshold: 2,
        labelThreshold,
        defaultLabelSize,
        labelSizeRatio,
      }
    });
    //https://github.com/jacomyal/sigma.js/wiki/Events-API
    sigmaInstance.bind('clickNode clickEdge clickStage overNode overEdge outNode outEdge',
           this.sigmaEventHandler.bind(this));
    sigmaInstance.camera.ratio = .7;
    return { sigmaInstance, cam, renderer };
  }
  render() {
    let {cssClass='', style={}} = this.props;
    const {w,h} = this.state;
    //console.log(this.props.nodes);
    //const {msgInfo=''} = this.state;
    //<MsgInfo info={msgInfo} />
    style = Object.assign({}, style, { width: `${w}px`, height: `${h}px`, });
    return <div className={cssClass} style={style} 
                  ref={div=>this.graphDiv=div} 
              />;
  }
  sigmaEventHandler(e) {
    this.commonEventHandler(e, 'sigma');
  }
  reactCompEventHandler(e, props) {
    let {sigmaDomEl, sigmaNode, rerender} = props;
    this.commonEventHandler(e, 'react', sigmaDomEl, sigmaNode, rerender, props);
  }
  commonEventHandler(e, source, el, node, rerender, props) {
    console.log(source, e.type, node?node.id:'nonode');
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
