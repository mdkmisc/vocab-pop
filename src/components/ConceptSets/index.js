/* eslint-disable */
import myrouter from 'src/myrouter'
import muit from 'src/muitheme'
import * as cset$ from 'src/ducks/conceptSet'
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
  makeNewCset = () => {
    const {newCset, csets} = this.props
    const cset = new cset$.Cset(newCset().payload)
    this.setState({csetId: cset.id()})
  }
  render() {
    const { csets, M=muit(), } = this.props
    const {csetId} = (this.state||{})
    let content
    if (csetId) {
      content = <ConceptSetBuilder {...{csetId, M, csets}} />
    } else {
      content = <div>
                  <h3>
                  {csets.length} Concept Sets 
                    <span style={{float:'right'}}>
                      <RaisedButton 
                          onClick={this.makeNewCset}
                          primary={true}
                      >New</RaisedButton>
                    </span>
                  </h3>
                  {
                    csets.map((cset,i) => {
                      return <pre key={i}>{JSON.stringify(cset,null,2)}</pre>
                    })
                  }
                </div>
    }

    return  <Paper style={M('paper')} zDepth={2} >
              {content}
            </Paper>
  }
}

ConceptSets = connect(
  (state, props) => {
    const { builder, isNew, } = myrouter.getQuery()
    return {
      csets: cset$.csets(state),
    }
  }
  , dispatch=>bindActionCreators(_.pick(cset$,['newCset','trashCset']), dispatch)
)(ConceptSets)
export {ConceptSets}
