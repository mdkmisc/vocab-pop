import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
let sigma = require('sigma');
export {sigma as default};
window.sigma = sigmaReactRenderer(sigma);
var neighborhoods = require('sigma/build/plugins/sigma.plugins.neighborhoods.min');
class FoContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {w:0, h:0, updates:0, styles: {}};
  }
  componentDidMount() {
    const {node, } = this.props;
    node.resizeFo = this.resizeFo.bind(this);
    this.setFont();
  }
  componentDidUpdate() {
    this.setFont();
  }
  setFont() {
    const {node, settings} = this.props;
    const {fontSize, fontColor, } = this.state.styles;
    let prefix = settings('prefix') || '',
        size = node[prefix + 'size'];
    let fs = (settings('labelSize') === 'fixed')
                      ? settings('defaultLabelSize')
                      //: settings('labelSizeRatio') * size;
                      : settings('fontFromSize')(size);
    console.log(`${node.id} size ${size}, fs ${fs}`);
    let fc = (settings('labelColor') === 'node')
                      ? (node.color || settings('defaultNodeColor'))
                      : settings('defaultLabelColor');
    let fontFamily = settings('font');
    if (fontSize !== fs || fontColor !== fc)
      this.setState({styles:{fontSize:fs, fontColor:fc, fontFamily}});
  }
  render() {
    const {w,h} = this.state;
    let fo =  <foreignObject className="sigma-react-fo" ref={d=>this.foRef=d}
                  style={this.state.styles} width={w} height={h}
              >
                {this.props.children}
              </foreignObject>
    if (this.props.needsRect) {
      return  <g><rect className="edge-cover" />{fo}</g>;
    }
    return fo;
  }
  resizeFo() {
    const {node, settings} = this.props;
    if (!this.foRef) {
      console.log('no foRef for resizing', node.id);
      return [0,0];
    }
    let prefix = settings('prefix') || '',
        size = node[prefix + 'size'];
    let styles = Object.assign({}, this.state.styles);
    let w,h;
    // Case when we don't want to display the label
    if (!settings('forceLabels') && 
          this.state.fontSize < settings('labelFontSizeThreshold')) {
      styles.display = 'none';
      [w,h] = [0,0];
    } else {
      [w,h] = getSize(this.foRef.childNodes[0]);
    }
    this.setState({styles, w, h});
    return [w,h];
    /*
    let fo = $(el).find('foreignObject')[0];
    if (fo) {
      fo.setAttributeNS(null, 'font-size', fontSize);
      fo.setAttributeNS(null, 'font-family', settings('font'));
      fo.setAttributeNS(null, 'fill', fontColor);
      fo.setAttributeNS(null, 'x',
        Math.round(node[prefix + 'x'] + size + 3));
      fo.setAttributeNS(null, 'y',
        Math.round(node[prefix + 'y'] + fontSize / 3));
    }
    */
  }
}
function getSize(dn) {
  let cbr = dn.getBoundingClientRect(), 
      rw = Math.round(cbr.width),
      rh = Math.round(cbr.height);
  return [rw,rh];
}
function sigmaReactRenderer(sigma) {
  sigma.utils.pkg('sigma.svg.nodes');
  sigma.svg.nodes.react = {
    create: function(node, settings) {
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-node-id', node.id);
      g.setAttributeNS(null, 'class', `${settings('classPrefix')}-node ${node.classes||''}`);
      let Component = node.ComponentClass;
      let comp = <Component sigmaNode={node} sigmaSettings={settings} />;
      render( <FoContainer needsRect={true} node={node} settings={settings}>
                {comp}
              </FoContainer>, g);
      return g;
    },
    update: function(node, el, settings) {
      el.style.display = '';
      let [w,h] = node.resizeFo();
      /*
      let ref = node.getContentRef();
      let [w,h] = getSize(ref);
      node.update(node, el, settings);
      $(el).find('rect.edge-cover').width(w).height(h);
      */

      let prefix = settings('prefix') || '';
      el.setAttributeNS(null, 'transform',
          `translate(${node[prefix+'x'] - w/2},${node[prefix+'y'] - h/2})`);
      return this;
    }
  };
  sigma.utils.pkg('sigma.svg.labels.html');
  sigma.svg.labels.html = {
    create: function(node, settings) {
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-label-target', node.id);
      g.setAttributeNS(null, 'class', `${settings('classPrefix')}-label ${node.classes||''}`);
      let Component = node.ComponentClass;
      let comp = <Component sigmaNode={node} sigmaSettings={settings} />;
      render(<circle r={10} fill="blue"/>, g);
      return g;
      render(<FoContainer needsRect={false}>{comp}</FoContainer>, g);
      return g;
    },
    update: function(node, el, settings) {
      let prefix = settings('prefix') || '',
          size = node[prefix + 'size'];

      var fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;
      let fontColor = (settings('labelColor') === 'node')
            ? (node.color || settings('defaultNodeColor'))
            : settings('defaultLabelColor');


      // Case when we don't want to display the label
      if (!settings('forceLabels') && size < settings('labelThreshold'))
        return;

      if (typeof node.label !== 'string')
        return;

      let fo = $(el).find('foreignObject')[0];
      if (fo) {
        fo.setAttributeNS(null, 'font-size', fontSize);
        fo.setAttributeNS(null, 'font-family', settings('font'));
        fo.setAttributeNS(null, 'fill', fontColor);
        fo.setAttributeNS(null, 'x',
          Math.round(node[prefix + 'x'] + size + 3));
        fo.setAttributeNS(null, 'y',
          Math.round(node[prefix + 'y'] + fontSize / 3));
      }
      let ref = node.getContentRef();
      let [w,h] = getSize(ref);
      $(fo).width(w).height(h);
      //node.update(node, el, settings);
      //if (node.htmlContent) $(el).find('rect.edge-cover').width(w).height(h);
      el.style.display = '';
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
                        (node.color || settings('defaultNodeColor')) :
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
export class SigmaReactGraph extends Component { // started making this, but not using yet...finish?
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
