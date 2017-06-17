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
import ReactTooltip from 'react-tooltip'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'
class ConceptSets extends Component {
  componentDidMount() {
    if (this.props.invalidCsetId) {
      console.error(`invalid csetId: ${JSON.stringify(this.props.csetId)}`)
      myrouter.deleteParams('csetId')
      return
    }
    ReactTooltip.rebuild()
  }
  componentDidUpdate() {
    if (this.props.invalidCsetId) {
      console.error(`invalid csetId: ${JSON.stringify(this.props.csetId)}`)
      myrouter.deleteParams('csetId')
      return
    }
    ReactTooltip.rebuild()
  }
  makeNewCset = () => {
    const {newCset, storedCsets} = this.props
    const _cset = newCset().payload
    return _cset.id
    //const cset = cset$.getCset(_cset.id,state.concepts)
    //return cset.id()
  }
  render() {
    const { storedCsets, M=muit(), invalidCsetId} = this.props
    const {csetId} = myrouter.getQuery()
    if (invalidCsetId) {
      return <h3>Can't find csetId {csetId}</h3>
    }
    let content
    if (csetId) {
      content = <div>
                  <h3>ConceptSetBuilder ({csetId})</h3>
                  <ConceptSetBuilder {...{csetId, M, }} />
                </div>
    } else {
      content = <div>
                  <h3>
                  {storedCsets.length} Concept Sets 
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
                  <ul>
                  {
                    storedCsets.map((cset,i) => {
                      return  <li key={i}>
                                <C.NameLink M={M} csetId={cset.id()}/>
                              </li>
                    })
                  }
                  </ul>
                </div>
    }

    return  <Paper style={M('paper')} zDepth={2} >
              {content}
            </Paper>
  }
  // good information, but causes infinite loop
  // <pre>{JSON.stringify(this.props.csetsStatus,null,2)}</pre>
}
ConceptSets = connect(
  (state, props) => {
    const { builder, isNew, csetId, } = myrouter.getQuery()
    const storedCsets = cset$.storedCsets(state)
    let moreProps = { 
      storedCsets,
      csetsStatus: state.csets.status,
    }
    if (typeof csetId !== 'undefined') {
      //let cset = cset$.getCset(state)(csetId)
      let cset = cset$.getCset(csetId)
      if (!cset) {
        console.error(`invalid csetId: ${JSON.stringify(csetId)}`)
        moreProps.invalidCsetId = true
      } else {
        moreProps.csetId = csetId
        moreProps.cset = cset
      }
    }
    return moreProps
  }
  , dispatch=>bindActionCreators(_.pick(cset$,['newCset','trashCset']), dispatch)
)(ConceptSets)
export {ConceptSets}
