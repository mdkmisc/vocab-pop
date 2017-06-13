/* eslint-disable */
import myrouter from 'src/myrouter'
import muit from 'src/muitheme'
import * as cset$ from 'src/ducks/conceptSet'
import * as C from 'src/components/ConceptSets/ConceptSetViewer'
import ConceptSetBuilder from './ConceptSetBuilder'

import { connect } from 'react-redux'
import { bindActionCreators, } from 'redux'
import React, { Component } from 'react'
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'
class ConceptSets extends Component {
  componentDidMount() {
  }
  componentDidUpdate() {
  }
  makeNewCset = () => {
    const {newCset, csets} = this.props
    const cset = cset$.getCset(newCset().payload,state.concepts)
    return cset.id()
  }
  render() {
    const { csets, M=muit(), } = this.props
    const {csetId} = myrouter.getQuery()
    let content
    if (csetId) {
      content = <ConceptSetBuilder {...{csetId, M, csets}} />
    } else {
      content = <div>
                  <h3>
                  {csets.length} Concept Sets 
                    <span style={{float:'right'}}>
                      <RaisedButton 
                        //onClick={this.makeNewCset}
                        //onClick={()=>myrouter.addParam('newCset',true)}
                        onClick={()=>{
                          let id = this.makeNewCset()
                          myrouter.addParam('csetId',id)
                        }}
                        primary={true}
                      >New</RaisedButton>
                    </span>
                  </h3>
                  <br/>
                  {
                    csets.map((cset,i) => {
                      return  <div key={i}>
                                <C.NameLink 
                                    cset={cset} key={i} M={M}
                                    //link={<Link component={ConceptSetBuilder}
                                />
                              </div>
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
    const { builder, isNew, csetId, } = myrouter.getQuery()
    const csets = cset$.csets(state)
    if (csetId) {
      let cset = cset$.getCset(state)(csetId,state.concepts)
      if (!cset) {
        console.error(`invalid csetId: ${JSON.stringify(csetId)}`, csets)
        myrouter.deleteParams('csetId')
      }
    }
    return {
      csets, csetId
    }
  }
  , dispatch=>bindActionCreators(_.pick(cset$,['newCset','trashCset']), dispatch)
)(ConceptSets)
export {ConceptSets}
