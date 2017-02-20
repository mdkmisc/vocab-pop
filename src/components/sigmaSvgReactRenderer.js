import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
let sigma = require('sigma');
export {sigma as default};
window.sigma = sigma;
var neighborhoods = require('sigma/build/plugins/sigma.plugins.neighborhoods.min');
sigmaReactRenderer(sigma);
function sigmaReactRenderer(sigma) {
  sigma.utils.pkg('sigma.svg.nodes');
  //labelRenderer(sigma);

  sigma.svg.nodes.react = {
    /**
     * SVG Element creation.
     * @param  {object}                   node     The node object.
     * @param  {configurable}             settings The settings function.
     */
    create: function(node, settings) {
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-node-id', node.id);
      g.setAttributeNS(null, 'class', 
              settings('classPrefix') + '-node'
              + ' sigma-react ' + (node.classes||''));
      //g.setAttributeNS(null, 'fill', node.color || settings('defaultNodeColor'));
      let Component = node.ComponentClass;
      let comp = <Component sigmaNode={node} sigmaSettings={settings} />;
      let NewNode = node.htmlContent 
          ? <g>
              <rect className="edge-cover" />    
              <foreignObject className="voc-node-fo">
                {comp}
              </foreignObject>
            </g>
          : comp;
      render(NewNode, g);
      return g;
    },
    /**
     * SVG Element update.
     * @param  {object}                   node     The node object.
     * @param  {DOMElement}               fo       The node DOM element.
     * @param  {configurable}             settings The settings function.
     */
    update: function(node, el, settings) {
      el.style.display = '';
      let ref = node.getContentRef();
      let [w,h] = getSize(ref);
      node.update(node, el, settings);
      let prefix = settings('prefix') || '';
      el.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x'] - w/2},${node[prefix+'y'] - h/2})`);
      if (node.htmlContent)
        $(el).find('rect.edge-cover').width(w).height(h);
      return this;
    }
  };

  function getSize(dn) {
    let cbr = dn.getBoundingClientRect(), 
        rw = Math.round(cbr.width),
        rh = Math.round(cbr.height);
    return [rw,rh];
  }

  sigma.utils.pkg('sigma.svg.edges');
  sigma.svg.edges.react = {
    /**
     * SVG Element creation.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     */
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
                          + ' sigma-react ' + (edge.classes||''));

      let Component = edge.ComponentClass;
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
     */
    update: function(edge, el, source, target, settings) {
      el.style.display = '';
      edge.update(edge, el, source, target, settings);
      return this;
    }
  };
}

import Rx from 'rxjs/Rx';
export function firstLastEvt(rxSubj, ms) {
  return Rx.Observable.merge(rxSubj.debounceTime(ms), rxSubj.throttleTime(ms)).distinctUntilChanged()
}
export class SigmaReactGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {updates:0};
    this.nodeEventStream = new Rx.Subject();
    this.msgInfoStream = new Rx.Subject();
  }
  componentDidMount() {
    this.setState({updates: this.state.updates+1}); // force a rerender after div ref available
    let self = this;
    firstLastEvt(this.msgInfoStream,50).subscribe(
      function(msgInfo) {
        //console.log(msgInfo);
        self.setState({msgInfo});
      });
  }
  componentDidUpdate() {
    const {NodeClass, nodes, edges, width, height} = this.props;
    let self = this;
    if (this.graphDiv && nodes && nodes.length) {
      /*
      nodes.forEach(
        d => {
          //d.ComponentClass = d.ComponentClass || (d.isParent ? VocGroupNode : VocNode);
          d.nodeEventStream = this.nodeEventStream;
          d.msgInfoStream = this.msgInfoStream;
        });
      elements.edges.forEach(
        d => {
          d.ComponentClass = VocEdge;
          d.nodeEventStream = this.nodeEventStream;
        });
      */
      let nodeClassFunc = node=>NodeClass;
      this.sigmaInstance = this.sigmaInstance || 
        sigmaGraph(this.graphDiv, {nodes,edges}, nodeClassFunc);
      this.sigmaInstance.graph.nodes().forEach(n => n.sigmaInstance = this.sigmaInstance);
      this.sigmaInstance.graph.edges().forEach(e => e.sigmaInstance = this.sigmaInstance);
      this.setState({graphDrawn:true, updates:this.state.updates+1});
      $('g.voc-node-container')
        .on('click mouseover mouseout drag',
            function(e) {
              self.nodeEventStream.next({jqEvt:e, domNode:this, });
            });
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !this.state.graphDrawn || 
            this.props.nodes !== nextProps.nodes ||
            this.props.edges !== nextProps.edges ||
            this.state.msgInfo !== nextState.msgInfo;
  }
  render() {
    const {width, height} = this.props;
    const {msgInfo} = this.state;
    return (<div className="vocab-map"
                 style={{
                        float: 'left', 
                        margin: 5,
                        border: '1px solid blue',
                        position: 'relative',
                    }} >
              <MsgInfo info={msgInfo} />
              <div ref={div=>this.graphDiv=div} 
                   style={{ width: `${width}px`, height: `${height}px`, }}
              />
            </div>);
  }
}
function sigmaGraph(domnode, elements, nodeClassFunc) {
  // Instantiate sigma:
  let neigh = new sigma.plugins.neighborhoods();
  let s = new sigma({
    graph: { ...elements }, // should contain nodes and edges
    settings: {
      nodeClassFunc,
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
