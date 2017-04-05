/*
Copyright 2016 Sigfried Gold

   Licensed under the Apache License, Version 2.0 (the "License")
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/* eslint-disable */

var d3 = require('d3')
var $ = require('jquery')
import _ from '../../supergroup'; // in global space anyway...
import React, { Component } from 'react'


import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'

import Spinner from 'react-spinner'
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap'
//if (DEBUG) window.d3 = d3
//import {ConceptInfo, ConceptSetFromCode, ConceptSetFromText} from '../ConceptInfo'
import {AgTable, ConceptTree, } from '../TableStuff'
require('../sass/Vocab.css')

import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from '../../utils'
//import * as AppState from '../../AppState'



class XXConceptViewForm extends Component {
  constructor(props) {
    console.log("in new one")
    super(props)
    this.state = {}
  }
  render() {
    let {vocabulary_id='ICD9CM', concept_codes='401.1%,401.2,401.3%'} = this.state
    return  <div>
              <Form horizontal className="flex-fixed-height-40">
                <FormGroup controlId="vocabulary_id_input" >
                  <Col componentClass={ControlLabel}>Vocabulary Id</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={vocabulary_id}
                      onChange={ e => {
                                      e.preventDefault()
                                      vocabulary_id = e.target.value
                                      this.setState({vocabulary_id, })
                                }} />
                  </Col>
                </FormGroup>

                <FormGroup controlId="concept_codes" >
                  <Col componentClass={ControlLabel}>Source Codes</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={concept_codes}
                      onChange={
                        e => {
                                e.preventDefault()
                                concept_codes= e.target.value
                                this.setState({concept_codes, })
                        }} />
                  </Col>
                </FormGroup>
              </Form>
            </div>

  }
              //<STSReport vocabulary_id={vocabulary_id} concept_codes={concept_codes} />
}

export const STSReport = props => {
  let {vocabulary_id, concept_codes, recs=[], } = props
  let treeFunc = recs => _.supergroup(recs, [
                            'src_code_match_str',
                            'src_concept_code',
                            'src_concept_id',
                            'relationship',
                            'target_concept_id'])
  return  <div>
            <h3>Source codes from {vocabulary_id}: {concept_codes}:</h3>
            <ConceptTree
                    width={"100%"} height={200}
                    recs={recs}
                    treeFunc={treeFunc}
                    //rowSelect={node => selectCb(node)}
            />
            <pre>
              {treeFunc(recs).flattenTree().namePaths().join('\n')}
            </pre>
            <AgTable data={recs}
                    width={"100%"} height={250}
                    id="src_target_recs" />
          
            <pre>{JSON.stringify(recs,null,2)}</pre>
          </div>
}
