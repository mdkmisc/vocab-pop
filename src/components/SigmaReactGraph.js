// @ flow // flow breaking on new.target, so not using right now

const DEBUG = true;
import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
import _ from 'supergroup'; // just for lodash
import Rx from 'rxjs/Rx';
export function firstLastEvt(rxSubj, ms) {
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
    const {children, evtHandlers=[], sigmaSettings, sigmaNode} = this.props;
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
              evtHandlers={evtHandlers.concat(this.resizeFo.bind(this))}
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


function sigmaReactRenderer() {
  console.log('loading sigmaReactRenderer!!!!');
  var sigma = require('sigma');
  neighborhoodPlugin(sigma);
  sigma.utils.pkg('sigma.svg.nodes');
  sigma.utils.pkg('sigma.svg.labels');
  sigma.utils.pkg('sigma.svg.hovers');

  sigma.svg.nodes.circle_label_drill = {
    create: function(node, settings) {
      const prefix = settings('prefix');
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      let className = settings('classPrefix') + '-node';
      g.setAttributeNS(null, 'data-node-id', node.id);
      g.setAttributeNS(null, 'class', className);
      //g.setAttributeNS(null, 'class', `${settings('classPrefix')}-node ${node.classes||''}`);
      return g;
    },
    update: function(node, g, settings, evt) {
      let prefix = settings('prefix') || '';
      let NodeClass = node.NodeClass || settings('DefaultNodeClass');
      let fill = node.color || settings('defaultNodeColor');
      let r = node[prefix + 'size'];
      let className = settings('classPrefix') + '-node-circle';

      g.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x']},${node[prefix+'y']})`);
      /*
      const circleSizeRange = [3,10];
      const size = d3.scaleLinear().domain(settings('sizeDomain'))
                                   .range(circleSizeRange);
      const scaleFactor = node[`${prefix}size`] / node.size;
      */

      g.style.display = '';
      function renderToSigma(evtProps) {
        render(<NodeClass sigmaNode={node} sigmaSettings={settings}
                    evtProps={evtProps} 
                  sigmaDomEl={g} evt={evt}  >
                  <circle {...{r, fill, className}} data-node-id={node.id} />
              </NodeClass>, g);
      }
      renderToSigma();
      return this;
    }
  };
  sigma.svg.labels.circle_label_drill = {
    create: function(node, settings) {
      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          g = document.createElementNS(d3.namespaces.svg, 'g'),
          className = settings('classPrefix') + '-label';
      g.setAttributeNS(null, 'data-label-target', node.id);
      g.setAttributeNS(null, 'class', className);
      return g;
    },

    update: function(node, g, settings, evt) {
      if (node.hideLabel) return;

      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          className = settings('classPrefix') + '-label';
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

      function renderToSigma(evtProps) {
        render(<LabelClass sigmaNode={node} sigmaSettings={settings} 
                    sigmaDomEl={g} evt={evt} evtProps={evtProps} >
                  <text {...{fontSize, fill, fontFamily, className}} 
                      data-label-target={node.id} 
                      data-node-id={node.id} 
                  >
                    {node.label}
                  </text>
              </LabelClass>, g);
      }
      renderToSigma();
      return this;
    }
  };
  sigma.svg.hovers.groupLabel = sigma.svg.hovers.circle_label_drill = {
    create: function(node, el, measurementCanvas, settings) {
      console.log('in hover create');
      let thisUpdate = sigma.svg.hovers.circle_label_drill.create;
      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          g = document.createElementNS(d3.namespaces.svg, 'g'),
          className = settings('classPrefix') + '-hover';
      g.setAttributeNS(null, 'data-node-id', node.id);
      g.setAttributeNS(null, 'class', className);

      let HoverClass = node.HoverClass || settings('DefaultHoverClass');

      g.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x'] + size + 3},${node[prefix+'y'] + size / 3})`);
      g.style.display = '';

      function renderToSigma(evtProps) {
        render(<HoverClass sigmaNode={node} sigmaSettings={settings} 
                  renderToSigma={renderToSigma} sigmaDomEl={g} evtProps={evtProps}
                />, g);
      }
      renderToSigma();
      return g;
    }
  };
  return sigma;
}

export default class SigmaReactGraph extends Component { // started making this, but not using yet...finish?
  constructor(props) {
    super(props);
    this.state = {updates:0};
    //this.reactNodeEvtStream = new Rx.Subject();
    //this.sigmaNodeEvtStream = new Rx.Subject();
    //this.msgInfoStream = new Rx.Subject();
  }
  componentDidMount() {
    this.setState({forceUpdate: true});
    //firstLastEvt(this.reactNodeEvtStream,50).subscribe(this.reactNodeEvt.bind(this));
    //firstLastEvt(this.sigmaNodeEvtStream,50).subscribe(this.sigmaNodeEvt.bind(this));
  }
  componentDidUpdate(prevProps, prevState) {
    const {width, height, nodes, edges} = this.props;
    const {w, h, sigmaInstance, cam, renderer, sizeDomain} = this.state;
    DEBUG && (window.srgState = this.state);
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
      let nodeSizeScale = d3.scaleLinear()
                            .domain(sizeDomain)
                            .range([1,2.5]);  
      let zoomFontScale = d3.scaleLinear() // i think the largest zoomratio (or whatever sigma is doing) is 2 right now
                            .domain([2,0])
                            .range([6,20]);
      let fontFromSize = function(size) {
                            return nodeSizeScale(size) * zoomFontScale(cam.ratio);
                          };
      renderer.settings('nodeSizeScale', nodeSizeScale);
      renderer.settings('zoomFontScale', zoomFontScale);
      renderer.settings('fontFromSize', fontFromSize);
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
          cameraRatio=.7,
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
    //sigmaInstance.bind('clickNode clickEdge clickStage overNode overEdge outNode outEdge', this.srgSigmaEvtCb.bind(this));
    sigmaInstance.camera.ratio = cameraRatio;
    return { sigmaInstance, cam, renderer };
  }
  render() {
    let {cssClass='', style={}} = this.props;
    const {w,h} = this.state;
    //console.log(this.props.nodes);
    //const {msgInfo=''} = this.state;
    //<MsgInfo info={msgInfo} />
    style = Object.assign({}, style, { width: `${w}px`, height: `${h}px`, });
    return  <ListenerNode wrapperTag="div" className={cssClass} style={style} 
                  eventsToHandle={['onMouseMove']}
                  refFunc={(div=>this.graphDiv=div).bind(this)}  />;
    return <div className={cssClass} style={style} 
                  ref={div=>this.graphDiv=div} 
              />;
  }
  setHoverNode(node, source, renderToSigma) {
    const {renderer, sigmaInstance} = this.state;
    if (this.hoverNode !== node) {
      if (node) node.hideLabel = true;
      //this.hoverNode && renderer.dispatchEvent( 'outNode', { renderToSigma, node: this.hoverNode, renderer, isRedispatched: true });
      //node && renderer.dispatchEvent( 'overNode', { renderToSigma, node, isRedispatched: true });
      this.hoverNode = node;
      console.log('hoverNode', node && node.id);
      sigmaInstance.refresh();
    }
  }
}
export class ListenerTarget extends Component {
  constructor(props) {
    super();
    this.targetId = ListenerTarget.nextId++;
    ListenerTarget.targets[this.targetId] = this;
  }
  render() {
    const {wrapperTag='g', children, refFunc=d=>this.elRef=d, className } = this.props;
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
              //{React.cloneElement(this.props.children, this.props)}
    return  <Tag className={(className||'')+" listener-target"} ref={refFunc} 
                  data-target-id={this.targetId} >
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
    const {evtHandlers=[], } = this.props;
      //sigmaNode, sigmaSettings, renderToSigma, sigmaDomEl, 
    let target = findTarget(e.target);
    console.log('node', target||'none',);
    /*
    if (!sigmaDomEl || document.body.contains(sigmaDomEl)) {
      evtHandlers.forEach( l => l(e, this.props));
    } else {
      console.log(`can't handle ${e.type} because ListenerNode no longer on page`);
    }
    */
  }
  render() {
    const {wrapperTag='g', children, refFunc=d=>d } = this.props;
    let eventsToHandle = this.props.eventsToHandle || this.state.eventsToHandle;
    const reactEvtTypes = _.fromPairs(
      eventsToHandle.map(evtType=> [evtType,this.dispatch.bind(this)]));
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
    return  <Tag className="listener-node" {...reactEvtTypes} ref={refFunc}>
              {children}
            </Tag>;
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
