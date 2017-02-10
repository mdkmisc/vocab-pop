import React, { Component } from 'react';
import {render} from 'react-dom';
//import {VocNode, VocEdge} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
export default function(sigma) {
  sigma.utils.pkg('sigma.svg.nodes');
  //labelRenderer(sigma);

  sigma.svg.nodes.react = {
    /**
     * SVG Element creation.
     * @param  {object}                   node     The node object.
     * @param  {configurable}             settings The settings function.
     */
    create: function(node, settings) {
      let Component = node.ComponentClass;
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-node-id', node.id);

      g.setAttributeNS(null, 'class', 
              settings('classPrefix') + '-node'
              + ' sigma-react');
      //g.setAttributeNS(null, 'fill', node.color || settings('defaultNodeColor'));
      render(<Component sigmaNode={node} sigmaSettings={settings} />, g);
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
      node.update(node, el, settings);
      return this;
    }
  };

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
              settings('classPrefix') + '-edge' + ' sigma-react');

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
