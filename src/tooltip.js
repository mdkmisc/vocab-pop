/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';

import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import md5 from 'blueimp-md5'
import ReactTooltip from 'react-tooltip'
window.ReactTooltip = ReactTooltip

var globalTtStore = {}

class Tooltips extends Component {
  render() {
    let {tooltips} = this.props
    return  <div className="ttdiv" >
              {
                _.map(tooltips, (tt,ttid) => 
                  <ReactTooltip 
                      key={ttid}
                      id={ttid}
                      className="tooltip-holder"
                      getContent={x=>{
                        let ttcid = event.target.getAttribute('data-ttcid')
                        let content = globalTtStore[ttcid]
                        return content
                      }}
                  />
                )
              }
            </div>
  }
}
Tooltips = connect(
  (state, props) => { return {tooltips: state.tooltips} },
  dispatch => 
  dispatch => bindActionCreators({  })
)(Tooltips)
export {Tooltips}

export const ttConsts = {
  //NEW_TT: 'vocab-pop/tt/NEW_TT',
  //TRASH_TT: 'vocab-pop/tt/TRASH_TT',
  NEW_CONTENT: 'vocab-pop/tt/NEW_CONTENT',
}


/**** start reducers *********************************************************/
// tooltip id and tooltip content id -- each piece of content saved...stupid?
// can't send dynamic content with react-tooltip  and can't 
// store React components in store...
const reducer = (state={}, action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case ttConsts.NEW_CONTENT:
      var {content, fancyContent, ttid, } = payload
      if (_.has(state, [ttid, content]))
        return state
      let ttcid = md5(content)
      globalTtStore[ttcid] = fancyContent
      let ttState = {...state[ttid], [content]: ttcid}
      return {...state, [ttid]: ttState}
    /*
    case ttConsts.NEW_TT:
      var ttid = payload
      if (state[ttid])
        return state
      return {...state, [ttid]: {}}
    case ttConsts.TRASH_CONTENT:
      debugger
    */
  }
  return state
}
export default reducer
/**** end reducers *********************************************************/

/**** start action creators *********************************************************/
export const registerTooltip = ttid => ({type: ttConsts.NEW_TT, payload:ttid})
export const unregisterTooltip = ttid => ({type: ttConsts.TRASH_TT, payload:ttid})
export const makeTtContent = props => {
  let {ttid, content, fancyContent} = props
  fancyContent = fancyContent || content
  if (!_.isString(content)) {
    throw new Error("content must be string. use fancyContent for react components")
  }
  return {type: ttConsts.NEW_CONTENT, payload: {ttid, content, fancyContent}}
}
export const ttActions = {
  ttContentConnected: ()=>{throw new Error("CONNECT THIS!")}, 
}

/*
export const setTooltipContent = (ttid, content, ) => {
  let tt = Tooltip.nodes[ttid]
  if (!tt) {
    //throw new Error("trying to set content on a tooltip that no longer exists:",ttid, content)
    // not sure why this is happening...for now just ignore it
    return
  }
  return Tooltip.nodes[ttid].setContent(content)
}
*/

/**** end action creators *********************************************************/

/**** start selectors *****************************************************************/
/**** end selectors *****************************************************************/

