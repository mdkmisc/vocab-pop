/* eslint-disable */

import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';

import React, { Component } from 'react'

class Tooltip {
  constructor(ttid) {
    this.ttid = ttid
    this.getId =  ()=>_.uniqueId(`${ttid}-`)
    this.contents = {}
  }
  static nodes = {}
  component() {
    return <ReactTooltip 
                key={this.ttid}
                id={this.ttid}
                className="tooltip-holder"
                getContent={() => {
                  let ttcid = event.target.getAttribute('data-ttcid')
                  let content = this.contents[ttcid]
                  //console.log('using tt', {ttid:this.ttid,ttcid,tt})
                  return content
                  //return content
                }}
              />
  }
  setContent(content) {
    let ttcid = this.getId()
    this.contents[ttcid] = content
    return ttcid
  }

}
export const registerTooltip = (ttid) => {
  return Tooltip.nodes[ttid] = Tooltip.nodes[ttid] || new Tooltip(ttid)
}
export const unregisterTooltip = (ttid) => {
  delete Tooltip.nodes[ttid]
}
export const setTooltipContent = (ttid, content, ) => {
  return Tooltip.nodes[ttid].setContent(content)
}

class Tooltips extends Component {
  render() {
    return  <div className="ttdiv" >
              {
                _.map(Tooltip.nodes, (tt,ttid) => {
                  console.log('making tt', {ttid,tt})
                  return tt.component()
                })
              }
            </div>
    /*
    */
  }
}
export {Tooltips}
