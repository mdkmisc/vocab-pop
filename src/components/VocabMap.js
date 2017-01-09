/*
Copyright 2016 Sigfried Gold

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
// @flow
// npm run-script flow
import React, { Component } from 'react';
var d3 = require('d3');
import _ from 'supergroup'; // in global space anyway...

function graph(recs, domnode, w, h, boxw, boxh) {
  /*
  let sg = _.supergroup(recs, 
                d=>[d.vocab_1,d.vocab_2],
                {multiValuedGroup:true});
  */
  let sg = _.supergroup(recs,
                d=>[`${d.sc_1}:${d.vocab_1}`, `${d.sc_2}:${d.vocab_2}`],
                {dimName: 'scVocab', multiValuedGroup:true});

  sg.addLevel(
    d => {
      if (d.toString() === `${d.sc_1}:${d.vocab_1}`) {
        return `${d.sc_2}:${d.vocab_2}`;
      } else {
        return `${d.sc_1}:${d.vocab_1}`;
      }
    },
    {dimName: 'linkTo'});

  let levelContents = [0,0,0]; // C, S, null for three standard concept levels
  sg.forEach( d => {
    d.ypos = ({'C': 0, 'S': 1, null: 2})[d.toString().replace(/:.*/,'')];
    d.xpos = levelContents[d.ypos] ++;
  });

  let x = d3.scaleLinear().range([0,w])
                .domain([-1, _.max(levelContents)])
  let y = d3.scaleLinear().range([0,h])
                .domain([-1, 4]);
  var c10 = d3.scaleLinear().range(d3.schemeCategory10);

  d3.select(domnode).select('svg').remove();
  var svg = d3.select(domnode)
    .append("svg")
    .attr("width", w)
    .attr("height", h);

    /*
  var drag = d3.drag()
    .on("drag", function(d, i) {
      d.x += d3.event.dx
      d.y += d3.event.dy
      d3.select(this).attr("cx", d.x).attr("cy", d.y);
      d.getChildren().each(function(l, li) {
        if (l.source === i) {
          d3.select(this).attr("x1", d.x).attr("y1", d.y);
        } else if (l.target === i) {
          d3.select(this).attr("x2", d.x).attr("y2", d.y);
        }
      });
    });
    */

  //var d3nodes = 
  svg.selectAll("node")
                .data(sg).enter()
                .append("rect")
                  .attr("class", "node")
                  .attr("x", function(d) {
                    return x(d.xpos) - boxw / 2;
                  })
                .attr("y", function(d) {
                  return y(d.ypos) - boxh / 2;
                })
                .attr("width", boxw)
                .attr("height", boxh)
                .attr("fill", function(d, i) {
                  return c10(i);
                })
                //.call(drag);
  //var labels = 
  svg.selectAll("foreighObject")
          .data(sg)
          .enter()
        .append('foreignObject')
          .attr("x", function(d) {
            return x(d.xpos) - boxw / 2;
          })
          .attr("y", function(d) {
            return y(d.ypos) - boxh / 2;
          })
          .attr('width', boxw)
          .attr('height', boxh)
        .append('xhtml:p')
          .html(d=>d.toString().replace(/.*:/,''))

  //var links = 
  svg.selectAll("link")
                .data(sg.leafNodes())
                .enter()
                .append("line")
                .attr("class", "link")
                .attr("x1", d=>x(d.parent.xpos))
                .attr("y1", d=>y(d.parent.ypos))
                .attr("x2", d=>x(d.rootList().lookup(d).xpos))
                .attr("y2", d=>y(d.rootList().lookup(d).ypos))
                .attr("fill", "none")
                .attr("stroke", "white");


}
export default class VocabMap extends Component {
  componentDidMount() {
  }
  render() {
    const {classes, width, height} = this.props;
    if (classes && classes.length) {
      //let ignoreForNow = _.filter(classes, {sc_1:'C', sc_2:null}) .concat( _.filter(classes, {sc_2:'C', sc_1:null}));
      //let recs = _.difference(classes, ignoreForNow);
      let div = this.div;
      graph(classes, div, width, height, 70, 40);
    }
    return <div ref={div=>this.div=div} />
  }
}
