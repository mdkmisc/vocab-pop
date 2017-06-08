/* eslint-disable */
import myrouter from 'src/myrouter'
import muit from 'src/muitheme'
import * as cset from 'src/ducks/conceptSet'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, } from 'redux'

import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';

class ConceptSetBuilder extends Component {
  componentDidMount() {
    debugger
    let { csets, M=muit(), builder, isNew, newCset} = this.props
    if (isNew) {
      this.setState({cset:newCset()})
    }
  }
  componentWillUnmount() {
    debugger
    let { trashCset } = this.props
    const {cset} = this.state
    if (!cset.isSaved) {
      trashCset(this.state.cset)
    }
  }
  componentDidUpdate() {
  }
  render() {
    let { csets, M=muit(), builder, isNew, } = this.props
    let { cset, } = this.state || {}
    if (!cset) {
      return  <LinearProgress mode="indeterminate" 
                style={{margin:'10%', width:'80%', height: 4, }} />
    }
    if (isNew) {
    }
    return  <Paper style={M('paper')} zDepth={2} >
              <h3>
                Concept Set Builder<br/>
                Name: {cset.name}<br/>
              </h3>
              <pre>{JSON.stringify(cset,null,2)}</pre>
            </Paper>
  }
}

ConceptSetBuilder = connect(
  (state, props) => {
    return {
      csets: state.csets
    }
  }
  , dispatch=>bindActionCreators(_.pick(cset,['newCset','trashCset']), dispatch)
  /*
  ,(stateProps, dispatchProps, ownProps) => {
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
)(ConceptSetBuilder)
export default ConceptSetBuilder

