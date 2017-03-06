function getRenderer(renderers, el, settings, et='node') {
  return renderers[elType(el, settings, et)] || renderers.def;
}
function elType(el, settings, et='node') {
  return el.type || 
          settings(et === 'node' 
                      ? 'defaultNodeType'
                      : et === 'edge'
                        ? 'defaultEdgeType'
                        : undefined);
}
export function sigmaReactRenderer() {
  var sigma = require('sigma');

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';
  addFeatureRenderers(sigma);

  //if (typeof conrad === 'undefined') throw 'conrad is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.renderers');

  /**
   * This function is the constructor of the svg sigma's renderer.
   *
   * @param  {sigma.classes.graph}            graph    The graph to render.
   * @param  {sigma.classes.camera}           camera   The camera.
   * @param  {configurable}           settings The sigma instance settings
   *                                           function.
   * @param  {object}                 object   The options object.
   * @return {sigma.renderers.react}             The renderer instance.
   */
  sigma.renderers.react = 
    function(graph, camera, settings, options) {
    var i,
        l,
        a,
        fn,
        self = this;
    if (typeof options !== 'object')
      throw 'sigma.renderers.react: Wrong arguments.';
    sigma.classes.dispatcher.extend(this);

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
    // Indexes:
    this.nodesOnScreen = [];
    this.edgesOnScreen = [];


    // moved this...not sure if that's ok
    //options.settings.prefix = 'renderer' + sigma.utils.id() + ':';
    this.options.prefix = 'renderer' + sigma.utils.id() + ':';

    console.log("this is where initDOM('svg') happens in sigma.renderers.svg");
    this.initDOM(options.domRefs);


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
    sigma.misc.bindDOMEvents.call(this, this.domElements.graph);
    this.bindHovers(this.options.prefix);

    // Resize
    this.resize(false);
  };

  /**
   * This method renders the graph on the svg scene.
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


        //prefix = this.options.prefix || '', 
        // i don't get why prefix is blank, 
        // fixing it...but there's probably a reason I'm not understanding
        prefix = this.settings('prefix'),


        drawEdges = this.settings(options, 'drawEdges'),
        drawNodes = this.settings(options, 'drawNodes'),
        drawLabels = this.settings(options, 'drawLabels'),
        embedSettings = this.settings.embedObjects(options, {
          prefix: this.options.prefix,
          forceLabels: this.options.forceLabels
        });

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

    // Display nodes
    //---------------
    renderers = sigma.react.nodes;
    subrenderers = sigma.react.labels;
    //-- First we create the nodes which are not already created
    let self = this;
    if (drawNodes) {
      this.nodesOnScreen.forEach(
        node => {
          if (!node.hidden && !self.domElements.nodes[node.id]) {
            self.domElements.nodes[node.id] =
              getRenderer(renderers, node, 
                          self.settings, 'node')
                .create(node, embedSettings);

            self.domElements.labels[node.id] =
              getRenderer(subrenderers, node, 
                          self.settings, 'node')
                .create(node, embedSettings);
          }
        });
      this.nodesOnScreen.forEach(
        node => {
          self.domElements.nodes[node.id] =
            getRenderer(renderers, node, 
                        self.settings, 'node')
              .update(node, embedSettings);

          self.domElements.labels[node.id] =
            getRenderer(subrenderers, node, 
                        self.settings, 'node')
              .update(node, embedSettings);
        });
    }
    renderers = sigma.svg.edges;
    if (drawEdges) {
      this.edgesOnScreen.forEach(
        edge => {
          if (!self.domElements.edges[edge.id]) {
            let source = nodes[edge.source];
            let target = nodes[edge.target];
            let renderer = getRenderer(renderers, edge, 
                              self.settings, 'edge');

            self.domElements.edges[edge.id] =
              renderer.create(
                  edge, source, target, embedSettings);
          }
        });
      this.edgesOnScreen.forEach(
        edge => {
          let source = nodes[edge.source];
          let target = nodes[edge.target];
          let renderer = getRenderer(renderers, edge, 
                            self.settings, 'edge');

          self.domElements.edges[edge.id] =
            renderer.update(
                edge, source, target, embedSettings);
        });
    }
    this.dispatchEvent('render');
    return this;
  };

  /**
   * This method creates a DOM element of the specified type, switches its
   * position to "absolute", references it to the domElements attribute, and
   * finally appends it to the container.
   *
   * @param  {string} tag The label tag.
   * @param  {string} id  The id of the element (to store it in "domElements").
   */
  sigma.renderers.react.prototype.initDOM = function(refs) {
    console.log("FIX initDOM!!!!", refs);
    /*
    if (!refs || !refs.svg) {
      throw new Error("something wrong");
      return;
    }
    this.domElements.graph = refs.svg.svg;
    */
    this.domElements.graph = refs.div;
    return;
    /*
    var dom = refs.svg,
        c = this.settings('classPrefix'),
        g,
        l,
        i;

    dom.style.position = 'absolute';
    //dom.setAttribute('class', c + '-svg');

    // Setting SVG namespace
    dom.setAttribute('xmlns', this.settings('xmlns'));
    dom.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    dom.setAttribute('version', '1.1');

    // Creating the measurement canvas
    //var canvas = document.createElement('canvas');
    //canvas.setAttribute('class', c + '-measurement-canvas');

    // Appending elements
    this.domElements.graph = this.container.appendChild(dom);

    // Creating groups
    var groups = ['edges', 'nodes', 'labels', 'hovers'];
    for (i = 0, l = groups.length; i < l; i++) {
      g = document.createElementNS(this.settings('xmlns'), 'g');

      g.setAttributeNS(null, 'id', c + '-group-' + groups[i]);
      g.setAttributeNS(null, 'class', c + '-group');

      this.domElements.groups[groups[i]] =
        this.domElements.graph.appendChild(g);
    }

    // Appending measurement canvas
    this.container.appendChild(canvas);
    this.measurementCanvas = canvas.getContext('2d');
    */
  };

  /**
   * This method hides a batch of SVG DOM elements.
   *
   * @param  {array}                  elements  An array of elements to hide.
   * @param  {object}                 renderer  The renderer to use.
   * @return {sigma.renderers.react}              Returns the instance itself.
   */
  sigma.renderers.react.prototype.hideDOMElements = function(elements) {
    console.log("FIX THIS, should be hiding", elements);
    return this;
    var o,
        i;

    for (i in elements) {
      o = elements[i];
      sigma.svg.utils.hide(o);
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
    var renderers = sigma.svg.hovers,
        self = this,
        hoveredNode;

    function overNode(e) {
      debugger;
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
      debugger;
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
      debugger;

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
      debugger;
    } else {
      w = this.width = this.options.width;
      h = this.height = this.options.height;
      /*
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      w = this.width;
      h = this.height;
      */
    }

    if (oldWidth !== this.width || oldHeight !== this.height) {
      this.domElements.graph.style.width = w + 'px';
      this.domElements.graph.style.height = h + 'px';

      if (this.domElements.graph.tagName.toLowerCase() === 'svg') {
        this.domElements.graph.setAttribute('width', (w * pixelRatio));
        this.domElements.graph.setAttribute('height', (h * pixelRatio));
      }
    }

    return this;
  };


  /**
   * The labels, nodes and edges renderers are stored in the three following
   * objects. When an element is drawn, its type will be checked and if a
   * renderer with the same name exists, it will be used. If not found, the
   * default renderer will be used instead.
   *
   * They are stored in different files, in the "./svg" folder.
   */
  return sigma;
}
function addFeatureRenderers(sigma) {
  sigma.utils.pkg('sigma.react.nodes');
  sigma.utils.pkg('sigma.react.edges');
  sigma.utils.pkg('sigma.react.labels');

  sigma.react.nodes.def = {
    create: function(node, settings) {
      console.log("trying to create node", node.id);
      return node;
    },
    update: function(node, el, settings) {
      console.log("trying to update node", node.id);
      return this;
    }
  };
  sigma.react.labels.def = {
    create: function(node, settings) {
      console.log("trying to create label", node.id);
      return node;
    },
    update: function(node, el, settings) {
      console.log("trying to update label", node.id);
      return this;
    }
  };
  sigma.react.edges.def = {
    create: function(edge, source, target, settings) {
      console.log("trying to create edge", edge.id);
      return edge;
    },
    update: function(edge, el, source, target, settings) {
      console.log("trying to update edge", edge.id);
      return this;
    }
  };
}
