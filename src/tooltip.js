/* eslint-disable */

import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';

import React, { Component } from 'react'
import muiThemeable from 'material-ui/styles/muiThemeable';

let state = {}

class Tooltip {
  constructor(ttid) {
    this.ttid = ttid
    this.getId =  ()=>_.uniqueId(`${ttid}-`)
    this.contents = {}
  }
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
  return state[ttid] = state[ttid] || new Tooltip(ttid)
}
export const unregisterTooltip = (ttid) => {
  delete state[ttid]
}
export const setTooltipContent = (ttid, content, ) => {
  return state[ttid].setContent(content)
}

class Tooltips extends Component {
  render() {
    return  <div className="ttdiv" >
              {
                _.map(state, (tt,ttid) => {
                  console.log('making tt', {ttid,tt})
                  return tt.component()
                })
              }
            </div>
    /*
    */
  }
}
//Tooltips = muiThemeable()(Tooltips)
export {Tooltips}
