/* eslint-disable */
import myrouter from 'src/myrouter'
import muit from 'src/muitheme'
import ConceptSetBuilder from './ConceptSetBuilder'

import { connect } from 'react-redux'
import { bindActionCreators, } from 'redux'
import React, { Component } from 'react'
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';

class ConceptSets extends Component {
  componentDidMount() {
  }
  componentDidUpdate() {
  }
  render() {
    const { csets, M=muit(), } = this.props
    const { builder, isNew, csetName, } = myrouter.getQuery()
    if (builder) {
      if (isNew) {
        return <ConceptSetBuilder {...{builder, isNew, M, csets}} />
      }
    }
    return  <Paper style={M('paper')} zDepth={2} >
              <h3>
              {csets.length} Concept Sets 
                <span style={{float:'right'}}>
                  <RaisedButton 
                      onClick={()=>myrouter.addParams({builder:true,isNew:true}) }
                      primary={true}
                  >New</RaisedButton>
                </span>
              </h3>
              {
                csets.map((cset,i) => {
                  return <pre>{JSON.stringify(cset,null,2)}</pre>
                })
              }
            </Paper>
  }
}

ConceptSets = connect(
  (state, props) => {
    return {
      csets: state.csets
    }
  }
  /*
  , dispatch=>bindActionCreators(_.pick(cncpt,['wantConcepts']), dispatch),
  (stateProps, dispatchProps, ownProps) => {
    const {vocabulary_id, conceptState, conceptStatus, 
            cids, } = stateProps
    const {wantConcepts, } = dispatchProps
    const {matchBy, matchStr, } = myrouter.getQuery()
    return {
      vocabulary_id,
      conceptStatus,
      cset: new cset.ConceptSet(
        {
          cids,
          maxDepth:2,
          role: 'focal',
          desc: `${vocabulary_id} ${matchBy === 'codes' ? ' codes matching ' : ' concepts containing '} ${matchStr}`,
        }, 
        { conceptState, },
        wantConcepts,
      ),
    }
  }
  */
)(ConceptSets)
export {ConceptSets}
