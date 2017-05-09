/* eslint-disable */

import _ from 'src/supergroup'; // in global space anyway...
import * as util from 'src/utils';

import React, { Component } from 'react'
import { bindActionCreators, createStore, compose, combineReducers, applyMiddleware } from 'redux'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { combineEpics } from 'redux-observable'
import muiThemeable from 'material-ui/styles/muiThemeable';

export const ttActions = {
  SHOW: 'vocab-pop/tooltip/REGISTER',
  SHOW: 'vocab-pop/tooltip/UNREGISTER',
  HIDE: 'vocab-pop/tooltip/SET_CONTENT',
}

/**** start action creators *********************************************************/
export const registerTooltip = (ttid) => ({
    type: ttActions.REGISTER, 
    meta: { ttid, },
})
export const unregisterTooltip = (ttid) => ({
    type: ttActions.UNREGISTER, 
    meta: { ttid, },
})
export const setTooltipContent = (ttid, content, ) => ({
    type: ttActions.SET_CONTENT, 
    meta: { ttid, content, },
})
/**** end action creators *********************************************************/


/**** start reducers *********************************************************/

const reducer = (state={}, action) => {
  let {type, payload, meta={}, error} = action
  let {ttid, content, } = meta
  switch (type) {
    case ttActions.REGISTER:
      return {...state, [ttid]: {content: undefined, }}
    case ttActions.UNREGISTER:
      return _.pickBy(state, (v,k) => k !== ttid)
    case ttActions.SET_CONTENT:
      return {...state, [ttid]: {content, }}
  }
  return state
}
/**** end reducers *********************************************************/

export default reducer

export class Tooltips extends Component {
  render() {
    let {tooltips} = this.props
    return  <div>
              {
                tooltips.map(
                  (tt,ttid) => (
                    <ReactTooltip id={ttid}
                      getContent={() => {
                        return tt.content
                        //let content = event.target.getAttribute('data-content')
                        //console.log(content)
                        //return content
                      }}
                    />
                  )
                )
              }
            </div>
    /*
    */
  }
}
Tooltips = connect(
  (state, props) => {
    return {
      tooltips: state.tooltips,
    }
  },
  dispatch=>bindActionCreators(
    ..._.pick(cncpt,['wantConcepts']), 
    ..._.pick(tooltip,['showTooltip','hideTooltip']), 
  dispatch)
)(muiThemeable()(Tooltips))

