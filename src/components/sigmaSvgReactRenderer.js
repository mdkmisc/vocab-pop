import React, { Component } from 'react';
import {render} from 'react-dom';
import {VocNode, VocEdge} from './VocabMap';
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
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      g.setAttributeNS(null, 'data-node-id', node.id);

      let cls, classes = node.classes || [];
      if (Array.isArray(classes)) {
        classes.push('plain-g-node');
        cls = classes.join(' ');
      } else if (typeof classes === 'string') {
        cls = classes + ' plain-g-node';
      } else {
        throw new Error("unknown type in node.classes");
      }
      cls += (' ' + settings('classPrefix') + '-node');
      g.setAttributeNS(null, 'class', cls);

      //g.setAttributeNS(null, 'fill', node.color || settings('defaultNodeColor'));
      render(<VocNode sigmaNode={node} sigmaSettings={settings} />, g);
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

      let cls, classes = edge.classes || [];
      if (typeof classes === 'string') {
        cls = classes + ' plain-g-edge';
      } else {
        throw new Error("unknown type in edge.classes");
      }
      cls += (' ' + settings('classPrefix') + '-edge');
      g.setAttributeNS(null, 'class', cls);

      render(<VocEdge classes={cls} sigmaEdge={edge} sigmaSource={source} 
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
