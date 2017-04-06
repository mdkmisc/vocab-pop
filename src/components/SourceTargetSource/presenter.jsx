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

import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import ArrowIcon from 'material-ui/svg-icons/navigation/arrow-forward.js'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, } from 'material-ui/Card';
import Chip from 'material-ui/Chip'

// not using most of this: http://www.material-ui.com/#/components/list
import {List, ListItem} from 'material-ui/List';
import ContentInbox from 'material-ui/svg-icons/content/inbox';
import ActionGrade from 'material-ui/svg-icons/action/grade';
import ContentSend from 'material-ui/svg-icons/content/send';
import ContentDrafts from 'material-ui/svg-icons/content/drafts';
import Divider from 'material-ui/Divider';
import ActionInfo from 'material-ui/svg-icons/action/info'; 

import Avatar from 'material-ui/Avatar';



//import { AutoComplete as MUIAutoComplete } from 'material-ui'
import {
  AutoComplete,
  Checkbox,
  DatePicker,
  TimePicker,
  RadioButtonGroup,
  SelectField,
  Slider,
  TextField,
  Toggle
} from 'redux-form-material-ui'

class XXSourceTargetSourceForm extends Component {
  constructor(props) {
    console.log("in new one")
    super(props)
    this.state = {}
  }
  render() {
    let {vocabulary_id='ICD9CM', concept_code_search_pattern='401.1%,401.2,401.3%'} = this.state
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

                <FormGroup controlId="concept_code_search_pattern" >
                  <Col componentClass={ControlLabel}>Source Codes</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={concept_code_search_pattern}
                      onChange={
                        e => {
                                e.preventDefault()
                                concept_code_search_pattern= e.target.value
                                this.setState({concept_code_search_pattern, })
                        }} />
                  </Col>
                </FormGroup>
              </Form>
            </div>

  }
              //<STSReport vocabulary_id={vocabulary_id} concept_code_search_pattern={concept_code_search_pattern} />
}
export const STSReport = props => {
  let {vocabulary_id, concept_code_search_pattern, recs=[], } = props
  let treeFunc = recs => _.supergroup(recs, [
                            'src_code_match_str',
                            'src_concept_code',
                            'src_concept_id',
                            'relationship',
                            'target_concept_id'])
  let scc = _.supergroup(
    (recs||[]), d=>`${d.src_concept_code}: ${d.src_concept_name}`,{dimName:'source'})
  scc.addLevel('relationship')
  scc.addLevel(d=>`${d.src_concept_code}: ${d.src_concept_name}`,{dimName:'target'})

  const cardStyle = {
    padding: '0px',
  };
  let codes = concept_code_search_pattern.split(/[\s,]/)
  let styles = {
                      chip: {
                        margin: 4,
                      },
                      wrapper: {
                        display: 'flex',
                        flexWrap: 'wrap',
                      },
  }
  let chips = (codes||[]).map(code => (
                <Chip key={code} style={styles.chip}
                    onRequestDelete={() => alert('not working yet')}
                >
                  {code}
                </Chip>))
  return  <div>
            <Card containerStyle={cardStyle} style={cardStyle}>
              <CardHeader style={{padding:'0px 8px 0px 8px'}}
                title={<span>
                        {vocabulary_id}{' '}
                        Source <ArrowIcon/> Target <ArrowIcon/> Source Report
                      </span>}
                subtitle={
                          <div style={styles.wrapper}>
                            Search patterns
                            {chips}
                            match {scc.length} concepts:
                          </div>}
              />
              <CardText>
                <List >
                  {scc.map((d,i) => <ListItem key={i} 
                                          leftAvatar={
                                            <Avatar
                                              color={muiTheme.palette.alternateTextColor}
                                              backgroundColor={muiTheme.palette.primary1Color}
                                              size={30}
                                              style={{width:'auto',
                                                      padding:5,}}
                                            >
                                        {d.toString().split(/:/)[0]} 
                                            </Avatar>}
                                        primaryText={d.toString().split(/: /)[1]} 
                                        open={true}
                                        nestedItems={
                                          d.getChildren().map(
                                            (rel,i) => <ListItem
                                                          key={i}
                                                          primaryText={rel.toString()}
                                                        />)}
                                    />)}
                </List>
                
                found {recs ? recs.length : 0} concepts
                {(codes||[]).join(' --> ')}
              </CardText>
              <CardActions>
              </CardActions>
            </Card>
          
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
