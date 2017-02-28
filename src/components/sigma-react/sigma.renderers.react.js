// @ flow // flow breaking on new.target, so not using right now

const DEBUG = true;
import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
import _ from 'supergroup'; // just for lodash
import { ListenerTarget, ListenerNode, SigmaNode, SigmaGroup,
          SigmaEdge, SigmaLabel, SigmaHover, } from '../SigmaReactGraph';

export default class SigmaReactGraph extends Component {
  // refactor things into reasonable places
  constructor(props) {
    super(props);

    //https://github.com/jacomyal/sigma.js/wiki/Events-API
    //sigmaInstance.bind('clickNode clickEdge clickStage overNode overEdge outNode outEdge', this.srgSigmaEvtCb.bind(this));
    this.state = {
      updates:0, hoverNode: null, hoverNeighbors: [],
    };
  }
  makeSigmaInstance() {
    if (this.sigmaInstance) return true;
    let {nodes=[], edges=[], } = this.props;
    if (!nodes.length) return false;
    this.sigma = sigmaReactRenderer();
    this.sigmaInstance = new this.sigma({graph:{nodes,edges}});
    this.cam = this.sigmaInstance.addCamera();
    console.log('making graph');
    //if (!nodes.length) return;
    return true;
  }
  makeRenderer() {
    if (this.renderer) return true;
    let {nodes=[], edges=[], 
          /*
          DefaultNodeClass, 
          DefaultLabelClass,
          DefaultHoverClass,
          DefaultEdgeClass,
          */
          defaultNodeType, defaultEdgeType,

          // FIX ALL THIS
          defaultNodeColor='darkkhaki',
          defaultNodeHoverColor='crimson',
          defaultNodeHoverStrokeColor='green',
          defaultNodeMuteColor='#AAA',
          defaultLabelColor='darkred',
          defaultLabelNeighborColor='crimson',
          defaultEdgeColor='darkslateblue',

          defaultLabelSize=16,
          labelSize='proportional',
          labelThreshold=2,
          //labelFontSizeThreshold=2,
          labelSizeRatio=3,
          cameraRatio=.7,
        } = this.props;
    if (!this.sigmaInstance || !this.graphDiv) return false;
    let options = { container: this.graphDiv,
                    type: 'react',
                    camera: this.cam,
                    //freeStyle: true
                    settings: {
                      /*
                      DefaultNodeClass,
                      DefaultLabelClass,
                      DefaultHoverClass,
                      DefaultEdgeClass,
                      */
                      drawLabels: false,
                      drawEdgeLabels: false,
                      id: 'main',
                      edgeColor: 'target',
                      hideEdgesOnMove: true,

                      defaultNodeColor,
                      defaultNodeHoverColor,
                      defaultNodeHoverStrokeColor,
                      defaultNodeMuteColor,
                      defaultLabelColor,
                      defaultLabelNeighborColor,
                      defaultEdgeColor,

                      labelSize,
                      //labelFontSizeThreshold: 2,
                      labelThreshold,
                      defaultLabelSize,
                      labelSizeRatio,
                    }
                  };
    this.renderer = this.sigmaInstance.addRenderer(options);
    this.renderer.settings = this.renderer.settings.embedObjects(options, {
          prefix: this.renderer.saveParams.options.prefix,
          forceLabels: this.renderer.saveParams.options.forceLabels
        });

    if (defaultNodeType)
      nodes.forEach(node=>node.type=node.type||defaultNodeType);
    if (defaultEdgeType)
      edges.forEach(edge=>edge.type=edge.type||defaultEdgeType);

    this.renderer.domElements.graph = this.graphDiv;
    this.sigma.renderers.react.finishAdding.call(
      this.renderer, this.renderer.saveParams);
    this.settings = this.renderer.settings;
    let c = this.settings('classPrefix');

    this.sigmaInstance.camera.ratio = cameraRatio;
    return true;
  }
  componentDidMount() {
    this.setState({updates: this.state.updates + 1});
  }
  componentDidUpdate(prevProps, prevState) {
    const {width, height, nodes, edges} = this.props;
    const {w, h, sizeDomain} = this.state;
    DEBUG && (window.srg = this);
    if (!nodes || !nodes.length) {
      if (prevProps.nodes && prevProps.nodes.length)
        throw new Error("what happened to the nodes?");
      return;
    }
    if (w !== width || h !== height || typeof w === 'undefined') {
      $(this.graphDiv).width(width);
      $(this.graphDiv).height(height);
      this.setState({w:width, h:height});
      this.sigmaInstance && this.sigmaInstance.refresh();
      return;
    }
    if (!this.makeSigmaInstance()) {
      this.setState({updates: this.state.updates + 1});
      return;
    }
    if (!this.makeRenderer()) {
      this.setState({updates: this.state.updates + 1});
      return;
    }
    if (!_.isEqual(nodes, prevProps.nodes)) {
      this.sigmaInstance.graph.clear();
      this.sigmaInstance.graph.read({nodes,edges});
      this.sigmaInstance.refresh();
    }
    if (this.cam && !sizeDomain) {
      let sizeDomain = d3.extent(nodes.map(d=>d.size));
      this.renderer.settings('sizeDomain', sizeDomain);
      this.setState({ sizeDomain });
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
    }
    if (this.renderer && !this.finishedRendering) {
      this.sigmaInstance.refresh();
      this.finishSigmaRender(this.renderer);
      this.finishedRendering = true;
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.nodes &&
        $(this.graphDiv).find('.sigma-node').length 
          > this.props.nodes.length * 1.5)
      debugger; // too many nodes!  (had a memory leak with this for a while)
    return $(this.graphDiv).find('.sigma-node').length < 100;
  }
  setHoverNode(e, node, target, listenerProps) {
    let {settings} = this;
    let {hoverNode, hoverNeighbors} = this.state;
    if (hoverNode !== node) {
      //if (node) { node.hideLabel = true; }
      //this.hoverNode && renderer.dispatchEvent( 'outNode', { renderToSigma, node: this.hoverNode, renderer, isRedispatched: true });
      //node && renderer.dispatchEvent( 'overNode', { renderToSigma, node, isRedispatched: true });
      hoverNode = node;
      hoverNeighbors = this.sigmaInstance.graph.neighborhood(node&&node.id||'');
      console.log('hoverNode', hoverNode && hoverNode.id, 
                    hoverNeighbors.nodes.map(d=>d.id).join(' / '),
                    hoverNeighbors.edges.map(d=>d.id).join(' / '),
                 );
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
  finishSigmaRender(renderer, options={}) { // need to figure out how to get options from refresh/render/whatever
    // don't need any of this?
    let a,
        i,
        k,
        e,
        l,
        o,
        source,
        target,
        start,
        edges,
        renderers,
        subrenderers,
        index = {},
        graph = renderer.graph,
        nodes = renderer.graph.nodes,
        prefix = this.settings('prefix') || '',
        drawEdges = this.settings(options, 'drawEdges'),
        drawNodes = this.settings(options, 'drawNodes'),
        drawLabels = this.settings(options, 'drawLabels'),
        embedSettings = this.settings.embedObjects(options, {
          prefix, 
          forceLabels: this.settings('forceLabels'),
        });

    // Display nodes
    //---------------
    renderers = this.sigma.react.nodes;
    subrenderers = this.sigma.react.labels;

    //-- First we create the nodes which are not already created
    console.log('already creating nodes');
    /*
    if (drawNodes)
      for (a = renderer.nodesOnScreen, i = 0, l = a.length; i < l; i++) {
        if (!a[i].hidden && !renderer.domElements.nodes[a[i].id]) {

          // Node
          e = (renderers[a[i].type] || renderers.def).create(
            a[i],
            embedSettings
          );

          renderer.domElements.nodes[a[i].id] = e;
          renderer.domElements.groups.nodes.appendChild(e);

          // Label
          e = (subrenderers[a[i].type] || subrenderers.def).create(
            a[i],
            embedSettings
          );

          renderer.domElements.labels[a[i].id] = e;
          renderer.domElements.groups.labels.appendChild(e);
        }
      }
      */

    //-- Second we update the nodes
    console.log('already rendering nodes');
    /*
    if (drawNodes)
      for (a = renderer.nodesOnScreen, i = 0, l = a.length; i < l; i++) {

        if (a[i].hidden)
          continue;

        // Node
        (renderers[a[i].type] || renderers.def).update(
          a[i],
          renderer.domElements.nodes[a[i].id],
          embedSettings
        );

        // Label
        (subrenderers[a[i].type] || subrenderers.def).update(
          a[i],
          renderer.domElements.labels[a[i].id],
          embedSettings
        );
      }
      */

      /*
    // Display edges
    //---------------
    renderers = this.sigma.react.edges;

    //-- First we create the edges which are not already created
    console.log('not yet creating edges');
    if (drawEdges)
      for (a = renderer.edgesOnScreen, i = 0, l = a.length; i < l; i++) {
        if (!renderer.domElements.edges[a[i].id]) {
          source = nodes(a[i].source);
          target = nodes(a[i].target);

          e = (renderers[a[i].type] || renderers.def).create(
            a[i],
            source,
            target,
            embedSettings
          );

          renderer.domElements.edges[a[i].id] = e;
          renderer.domElements.groups.edges.appendChild(e);
        }
       }

    //-- Second we update the edges
    if (drawEdges)
      for (a = renderer.edgesOnScreen, i = 0, l = a.length; i < l; i++) {
        source = nodes(a[i].source);
        target = nodes(a[i].target);

        (renderers[a[i].type] || renderers.def).update(
          a[i],
          renderer.domElements.edges[a[i].id],
          source,
          target,
          embedSettings
        );
       }
       */

    renderer.dispatchEvent('render');

    return renderer;
  };
  render() {
    let {renderer, settings, sigma} = this;
    let {className='', style={}, } = this.props;
    const {w,h, hoverNode, hoverNeighbors} = this.state;
    let svg = '';

    if (renderer) {
      let c = settings('classPrefix');
      className += ` ${c}-react`;
      /*
      // Setting SVG namespace
      dom.setAttribute('xmlns', this.settings('xmlns'));
      dom.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      dom.setAttribute('version', '1.1');
      */

      // Creating the measurement canvas
      var canvas = <canvas className={c + '-measurement-canvas'} />;

      //this.measurementCanvas = canvas.getContext('2d');
      //this.groups = ['edges', 'nodes', 'labels', 'hovers'].map(
      svg =   <svg ref={d=>this.svgRef} width={w} height={h} className={settings('classPrefix')+'-svg'}>
                <SigmaGroup grp='nodes' settings={settings} >
                  {renderer.graph.nodes().map(
                    node => <SigmaNode key={node.id} node={node} settings={settings} 
                                       getNodeState={this.getNodeState.bind(this)}
                              />)}
                </SigmaGroup>
                <SigmaGroup grp='edges' settings={settings} >
                  {renderer.graph.edges().map(
                    edge => <SigmaEdge key={edge.id} edge={edge} settings={settings} 
                                source={renderer.graph.nodes(edge.source)}
                                target={renderer.graph.nodes(edge.target)}
                                getEdgeState={this.getEdgeState.bind(this)}
                              />)}
                </SigmaGroup>
                <SigmaGroup grp='labels' settings={settings} >
                  {renderer.graph.nodes().map(
                    node => <SigmaLabel key={node.id} node={node} settings={settings} 
                                       getNodeState={this.getNodeState.bind(this)}
                              />)}
                </SigmaGroup>
                <SigmaGroup grp='hovers' settings={settings} >
                  <text>hi</text>
                  { hoverNode &&
                      <SigmaHover node={hoverNode} settings={settings} 
                          getNodeState={this.getNodeState.bind(this)}
                      /> || ''}
                </SigmaGroup>
                {canvas}
              </svg>
    }
    /*
                  { hoverNeighbors && hoverNeighbors.nodes &&
                    hoverNeighbors.nodes.map(
                      node => <SigmaHover key={node.id} node={hoverNode} settings={settings} 
                                getNodeState={this.getNodeState.bind(this)} />)}
    */
    style = Object.assign({}, style, { width: `${w}px`, height: `${h}px`, });
    // svg ? style.position = 'absolute'; // from svg renderer

    return  <ListenerNode wrapperTag="div" className={className} style={style} 
                  renderer={renderer}
                  eventsToHandle={['onMouseMove']}
                  eventHandlers={[this.setHoverNode.bind(this)]}
                  refFunc={(div=>this.graphDiv=div).bind(this)} >
              {svg}
            </ListenerNode>;
  }
}
SigmaReactGraph.propTypes = {
  nodes: React.PropTypes.array.isRequired,
};

function sigmaReactRenderer() {
  var sigma = require('sigma');
  /**
   * The labels, nodes and edges renderers are stored in the three following
   * objects. When an element is drawn, its type will be checked and if a
   * renderer with the same name exists, it will be used. If not found, the
   * default renderer will be used instead.
   *
   * They are stored in different files, in the "./svg" folder.
   */
  sigma.utils.pkg('sigma.react.nodes');
  sigma.utils.pkg('sigma.react.edges');
  sigma.utils.pkg('sigma.react.labels');

  utils(sigma);
  edgesCurveRenderer(sigma);
  //edgesRenderer(sigma);
  neighborhoodPlugin(sigma);
  //addSpecificRenderers(sigma);
  sigma.utils.pkg('sigma.renderers');
  /**
   * @param  {sigma.classes.graph}            graph    The graph to render.
   * @param  {sigma.classes.camera}           camera   The camera.
   * @param  {configurable}           settings The sigma instance settings
   *                                           function.
   * @param  {object}                 object   The options object.
   * @return {sigma.renderers.react}             The renderer instance.
   */
  sigma.renderers.react = function(graph, camera, settings, options) {
    if (typeof options !== 'object')
      throw 'sigma.renderers.react: Wrong arguments.';


    if (!(options.container instanceof HTMLElement ||
          options.container instanceof SVGElement 
         )) throw 'Container not found.';

    var i,
        l,
        a,
        fn,
        self = this;

    sigma.classes.dispatcher.extend(this);

    // Initialize main attributes:
    this.graph = graph;
    this.camera = camera;
    this.domElements = {
      graph: null,
      groups: {},
      nodes: {},
      edges: {},
      labels: {},
      hovers: {}
    };
    this.measurementCanvas = null;
    this.options = options;
    this.container = this.options.container;
    this.settings = (
        typeof options.settings === 'object' &&
        options.settings
      ) ?
        settings.embedObjects(options.settings) :
        settings;

    // Is the renderer meant to be freestyle?
    this.settings('freeStyle', !!this.options.freeStyle);

    // SVG xmlns
    this.settings('xmlns', 'http://www.w3.org/2000/svg');

    // Indexes:
    this.nodesOnScreen = [];
    this.edgesOnScreen = [];

    // Find the prefix:
    this.options.prefix = 'renderer' + sigma.utils.id() + ':';
    this.saveParams = {graph, camera, settings, options};
    // Initialize the DOM elements
    //this.initDOM('svg');
  };
  sigma.renderers.react.finishAdding = function({graph, camera, settings, options}) {
    var i,
        l,
        a,
        fn,
        self = this;

    // Initialize captors:
    this.captors = [];
    a = this.options.captors || [sigma.captors.mouse, sigma.captors.touch];
    for (i = 0, l = a.length; i < l; i++) {
      fn = typeof a[i] === 'function' ? a[i] : sigma.captors[a[i]];
      this.captors.push(
        new fn(
          this.domElements.graph,
          this.camera,
          this.settings
        )
      );
    }

    // Bind resize:
    window.addEventListener('resize', function() {
      self.resize();
    });

    // Deal with sigma events:
    // TODO: keep an option to override the DOM events?
    console.log('probably want my own version of bindDOMEvents?');
    //sigma.misc.bindDOMEvents.call(this, this.domElements.graph);
    this.bindHovers(this.options.prefix);

    // Resize
    this.resize(false);
  }

  /**
   * This method renders the graph on the react scene.
   *
   * @param  {?object}                options Eventually an object of options.
   * @return {sigma.renderers.react}            Returns the instance itself.
   */
  sigma.renderers.react.prototype.render = function(options) {
    options = options || {};

    var a,
        i,
        k,
        e,
        l,
        o,
        source,
        target,
        start,
        edges,
        renderers,
        subrenderers,
        index = {},
        graph = this.graph,
        nodes = this.graph.nodes,
        drawEdges = this.settings(options, 'drawEdges'),
        prefix = this.options.prefix || '';
    // Check the 'hideEdgesOnMove' setting:
    if (this.settings(options, 'hideEdgesOnMove'))
      if (this.camera.isAnimated || this.camera.isMoving)
        drawEdges = false;

    // Apply the camera's view:
    this.camera.applyView(
      undefined,
      this.options.prefix,
      {
        width: this.width,
        height: this.height
      }
    );

    // Hiding everything
    // TODO: find a more sensible way to perform this operation
    this.hideDOMElements(this.domElements.nodes);
    this.hideDOMElements(this.domElements.edges);
    this.hideDOMElements(this.domElements.labels);

    // Find which nodes are on screen
    this.edgesOnScreen = [];
    this.nodesOnScreen = this.camera.quadtree.area(
      this.camera.getRectangle(this.width, this.height)
    );

    // Node index
    for (a = this.nodesOnScreen, i = 0, l = a.length; i < l; i++)
      index[a[i].id] = a[i];

    // Find which edges are on screen
    for (a = graph.edges(), i = 0, l = a.length; i < l; i++) {
      o = a[i];
      if (
        (index[o.source] || index[o.target]) &&
        (!o.hidden && !nodes(o.source).hidden && !nodes(o.target).hidden)
      )
        this.edgesOnScreen.push(o);
    }
    console.log("can't append. finish rendering in the react comp");
  }

  /**
   * This method hides a batch of react DOM elements.
   *
   * @param  {array}                  elements  An array of elements to hide.
   * @param  {object}                 renderer  The renderer to use.
   * @return {sigma.renderers.react}              Returns the instance itself.
   */
  sigma.renderers.react.prototype.hideDOMElements = function(elements) {
    var o,
        i;

    for (i in elements) {
      o = elements[i];
      sigma.react.utils.hide(o);
    }

    return this;
  };

  /**
   * This method binds the hover events to the renderer.
   *
   * @param  {string} prefix The renderer prefix.
   */
  // TODO: add option about whether to display hovers or not
  sigma.renderers.react.prototype.bindHovers = function(prefix) {
    var renderers = sigma.react.hovers,
        self = this,
        hoveredNode;

    function overNode(e) {
      var node = e.data.node,
          embedSettings = self.settings.embedObjects({
            prefix: prefix
          });

      if (!embedSettings('enableHovering'))
        return;

      var hover = (renderers[node.type] || renderers.def).create(
        node,
        self.domElements.nodes[node.id],
        self.measurementCanvas,
        embedSettings
      );

      self.domElements.hovers[node.id] = hover;

      // Inserting the hover in the dom
      self.domElements.groups.hovers.appendChild(hover);
      hoveredNode = node;
    }

    function outNode(e) {
      var node = e.data.node,
          embedSettings = self.settings.embedObjects({
            prefix: prefix
          });

      if (!embedSettings('enableHovering'))
        return;

      // Deleting element
      self.domElements.groups.hovers.removeChild(
        self.domElements.hovers[node.id]
      );
      hoveredNode = null;
      delete self.domElements.hovers[node.id];

      // Reinstate
      self.domElements.groups.nodes.appendChild(
        self.domElements.nodes[node.id]
      );
    }

    // OPTIMIZE: perform a real update rather than a deletion
    function update() {
      if (!hoveredNode)
        return;

      var embedSettings = self.settings.embedObjects({
            prefix: prefix
          });

      // Deleting element before update
      self.domElements.groups.hovers.removeChild(
        self.domElements.hovers[hoveredNode.id]
      );
      delete self.domElements.hovers[hoveredNode.id];

      var hover = (renderers[hoveredNode.type] || renderers.def).create(
        hoveredNode,
        self.domElements.nodes[hoveredNode.id],
        self.measurementCanvas,
        embedSettings
      );

      self.domElements.hovers[hoveredNode.id] = hover;

      // Inserting the hover in the dom
      self.domElements.groups.hovers.appendChild(hover);
    }

    // Binding events
    this.bind('overNode', overNode);
    this.bind('outNode', outNode);

    // Update on render
    this.bind('render', update);
  };

  /**
   * This method resizes each DOM elements in the container and stores the new
   * dimensions. Then, it renders the graph.
   *
   * @param  {?number}                width  The new width of the container.
   * @param  {?number}                height The new height of the container.
   * @return {sigma.renderers.react}           Returns the instance itself.
   */
  sigma.renderers.react.prototype.resize = function(w, h) {
    var oldWidth = this.width,
        oldHeight = this.height,
        pixelRatio = 1;

    if (w !== undefined && h !== undefined) {
      this.width = w;
      this.height = h;
    } else {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      w = this.width;
      h = this.height;
    }

    if (oldWidth !== this.width || oldHeight !== this.height) {
      this.domElements.graph.style.width = w + 'px';
      this.domElements.graph.style.height = h + 'px';

      if (this.domElements.graph.tagName.toLowerCase() === 'react') {
        this.domElements.graph.setAttribute('width', (w * pixelRatio));
        this.domElements.graph.setAttribute('height', (h * pixelRatio));
      }
    }

    return this;
  };


  sigma.utils.pkg('sigma.react.nodes');
  sigma.utils.pkg('sigma.react.labels');
  sigma.utils.pkg('sigma.react.hovers');
  return sigma;
}

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

function edgesCurveRenderer(sigma) {
  sigma.utils.pkg('sigma.react.edges');

  /**
   * The curve edge renderer. It renders the node as a bezier curve.
   */
  sigma.react.edges.curve = {

    /**
     * SVG Element creation.
     *
     * @param  {object}                   edge       The edge object.
     * @param  {object}                   source     The source node object.
     * @param  {object}                   target     The target node object.
     * @param  {configurable}             settings   The settings function.
     */
    create: function(edge, source, target, settings) {
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

      var path = document.createElementNS(settings('xmlns'), 'path');

      // Attributes
      path.setAttributeNS(null, 'data-edge-id', edge.id);
      path.setAttributeNS(null, 'class', settings('classPrefix') + '-edge');
      path.setAttributeNS(null, 'stroke', color);

      return path;
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
    update: function(edge, path, source, target, settings) {
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
      path.style.display = '';

      return this;
    }
  };
};
function utils(sigma) {
  sigma.utils.pkg('sigma.react.utils');

  /**
   * Some useful functions used by sigma's SVG renderer.
   */
  sigma.react.utils = {

    /**
     * SVG Element show.
     *
     * @param  {DOMElement}               element   The DOM element to show.
     */
    show: function(element) {
      element.style.display = '';
      return this;
    },

    /**
     * SVG Element hide.
     *
     * @param  {DOMElement}               element   The DOM element to hide.
     */
    hide: function(element) {
      element.style.display = 'none';
      return this;
    }
  };
}
