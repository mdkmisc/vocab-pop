import React, { Component } from 'react';
import {render} from 'react-dom';
import {VNode, VNodeLabel} from './VocabMap';
var d3 = require('d3');
var $ = require('jquery'); window.$ = $;
export default function(sigma) {
  sigma.utils.pkg('sigma.svg.nodes');
  //labelRenderer(sigma);

  /**
   * The default node renderer. It renders the node as a simple disc.
   */
  sigma.svg.nodes.def = {

    /**
     * SVG Element creation.
     *
     * @param  {object}                   node     The node object.
     * @param  {configurable}             settings The settings function.
     */
    create: function(node, settings) {
      let g = document.createElementNS(d3.namespaces.svg, 'g');
      render(<VNode sigmaNode={node} sigmaSettings={settings} />, g);
      return g;
      var prefix = settings('prefix') || '',
          fo = document.createElementNS(d3.namespaces.svg, 'foreignObject');

      fo.setAttributeNS(null, 'data-node-id', node.id);
      fo.setAttributeNS(null, 'class', settings('classPrefix') + '-node');
      fo.setAttributeNS( null, 'fill', node.color || settings('defaultNodeColor'));
      fo.setAttributeNS(null, 'x', node[prefix + 'x']);
      fo.setAttributeNS(null, 'y', node[prefix + 'y']);
      //fo.setAttributeNS(null, 'width', 0);
      //fo.setAttributeNS(null, 'height', 0);
      fo.__node__ = node;

      node.fo = fo;
      // Returning the DOM Element
      return fo;
    },

    /**
     * SVG Element update.
     *
     * @param  {object}                   node     The node object.
     * @param  {DOMElement}               fo       The node DOM element.
     * @param  {configurable}             settings The settings function.
     */
    update: function(node, el, settings) {
      el.style.display = '';
      node.update(node, el, settings);
      return this;
      /*
      var prefix = settings('prefix') || '';
      let content = `<div class="fo-div">${node.info || node.label}</div>`;
      if (fo.innerHTML === content) {
        fo.style.display = '';
        fo.setAttributeNS(null, 'x', node[prefix + 'x'] - $(fo).width() / 2);
        fo.setAttributeNS(null, 'y', node[prefix + 'y'] - $(fo).height() / 2);
        return this;
      }
      fo.setAttributeNS(null, 'class', 'fo-node ' + (node.classes || ''));
      fo.innerHTML = content; //c[0].outerHTML; //`<g>${c[0].outerHTML}</g>`;
      $(fo.childNodes[0]).css('position','absolute');
      let cbr = fo.childNodes[0].getBoundingClientRect(), w = cbr.width, h = cbr.height;
      $(fo.childNodes[0]).css('position','');
      $(fo).width(w).height(h);
      fo.setAttributeNS(null, 'x', node[prefix + 'x'] - w / 2);
      fo.setAttributeNS(null, 'y', node[prefix + 'y'] - h / 2);
      if (!settings('freeStyle'))
        fo.setAttributeNS(null, 'fill', node.color || settings('defaultNodeColor'));

      // Showing
      fo.style.display = '';
      return this;
      */
    }
  };
}
function labelRenderer(sigma) {
  // Initialize packages:
  sigma.utils.pkg('sigma.svg.labels');

  sigma.svg.labels.def = {
    /**
     * SVG Element creation.
     *
     * @param  {object}                   node       The node object.
     * @param  {configurable}             settings   The settings function.
     */
    create: function(node, settings) {
      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          div = document.createElementNS(settings('xmlns'), 'div');
      render(<VNodeLabel sigmaNode={node} sigmaSettings={settings} />, div);
      return div;
      return node.fo;
      /*
      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          text = document.createElementNS(settings('xmlns'), 'text');

      var fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      var fontColor = (settings('labelColor') === 'node') ?
        (node.color || settings('defaultNodeColor')) :
        settings('defaultLabelColor');

      text.setAttributeNS(null, 'data-label-target', node.id);
      text.setAttributeNS(null, 'class', settings('classPrefix') + '-label');
      text.setAttributeNS(null, 'font-size', fontSize);
      text.setAttributeNS(null, 'font-family', settings('font'));
      text.setAttributeNS(null, 'fill', fontColor);

      text.innerHTML = node.label;
      text.textContent = node.label;

      return text;
      */
    },

    /**
     * SVG Element update.
     *
     * @param  {object}                   node     The node object.
     * @param  {DOMElement}               fo       The foreignObject
     * @param  {configurable}             settings The settings function.
     */
    update: function(node, fo, settings) {
      var prefix = settings('prefix') || '',
          size = node[prefix + 'size'];

      var fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      // Case when we don't want to display the label
      if (!settings('forceLabels') && size < settings('labelThreshold'))
        return;

      if (typeof node.label !== 'string')
        return;

      // Showing
      //fo.style.display = '';

      return this;
    }
  };
}
