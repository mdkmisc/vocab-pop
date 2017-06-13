/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';
import muit from 'src/muitheme'

import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ReactTooltip from 'react-tooltip'
//window.ReactTooltip = ReactTooltip

//var globalTtStore = {}
window.globalTtStore = {}  // just for debugging

class TooltipWrapper extends Component {
  componentDidMount() {
    this.makeContent(this.props)
  }
  componentDidUpdate() {
    this.makeContent(this.props)
  }
  makeContent(props) {
    let {ttid, ttText, ttFancy, tipProps, M=muit()} = props
    this.props.makeTtContent({ttid, ttText, ttFancy, M})
  }
  render() {
    let {ttid, ttText, ttFancy, tipProps, M=muit(), children} = this.props
    tipProps = { 
      "data-tip":true,
      "data-for":ttid,
      "data-tttext":ttText,
      ...tipProps,
    }
    return React.cloneElement(children, tipProps)
  }
}
TooltipWrapper = connect(
  (state, props) => { // mapStateToProps
    return {}
  },
  dispatch => bindActionCreators({ makeTtContent, },dispatch)
)(TooltipWrapper)
export { TooltipWrapper }





class Tooltips extends Component {
  componentDidMount() {
    ReactTooltip.rebuild()
  }
  componentDidUnmount() {
    debugger
  }
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let {tooltips} = this.props
    return  <div className="ttdiv" >
              {
                _.map(tooltips, (tt,ttid) => {
                  return <ReactTooltip 
                          key={ttid}
                          id={ttid}
                          className="tooltip-holder"
                          getContent={x=>{
                            let ttText = event.target.getAttribute('data-tttext')
                            let id = storeId(ttid, ttText)
                            let {ttFancy, M} = globalTtStore[id]
                            return ttFancy
                          }}
                          afterShow={x=>{
                            let ttText = event.target.getAttribute('data-tttext')
                            console.log('showed', ttText)
                            //debugger
                          }}
                        />
                })
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

const storeId = (ttid,ttText) => `${ttid}:${ttText}`
/**** start reducers *********************************************************/
// tooltip id and tooltip content id -- each piece of content saved...stupid?
// can't send dynamic content with react-tooltip  and can't 
// store React components in store...
const reducer = (state={}, action) => {
  let {type, payload, meta, error} = action
  switch (type) {
    case ttConsts.NEW_CONTENT:
      var {ttText, ttFancy, ttid, tipProps, M, } = payload
      let id = storeId(ttid,ttText)
      if (_.has(globalTtStore, id))
        return state
      globalTtStore[id] = {ttFancy, tipProps, M}
      let ttState = [...(state[ttid]||[]), ttText]
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
  let {ttid, ttText, ttFancy, tipProps, M=muit()} = props
  if (!ttid) debugger
  if (!ttFancy) {
    ttFancy = <pre style={M('tooltip.pre')}>{ttText}</pre>
  } else {
    ttFancy = <div style={M('tooltip.div')}>{ttFancy}</div>
  }
  if (!_.isString(ttText)) {
    throw new Error("ttText must be string. use ttFancy for react components")
  }
  return {type: ttConsts.NEW_CONTENT, payload: {ttid, ttText, ttFancy, tipProps, M}}
}
export const ttActions = {
  ttContentConnected: ()=>{throw new Error("CONNECT THIS!")}, 
}

/**** end action creators *********************************************************/

/**** start selectors *****************************************************************/
/**** end selectors *****************************************************************/

