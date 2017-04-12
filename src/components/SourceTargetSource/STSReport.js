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

import * as duck from '../../redux/ducks/vocab'

import Spinner from 'react-spinner'
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap'
//if (DEBUG) window.d3 = d3
//import {ConceptInfo, ConceptSetFromCode, ConceptSetFromText} from '../ConceptInfo'
import {AgTable, ConceptTree, } from '../TableStuff'
import SortableTree from 'react-sortable-tree';
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

export class STSReport extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }
  componentDidMount() {
    this.dataToState();
  }
  componentDidUpdate() {
    this.dataToState();
  }
  dataToState() {
  }
  render() {
    try {
      let {vocabulary_id, concept_code_search_pattern, recs=[], 
            sourceRelationshipsSG,
            sourceConceptCodesSG,
            sortableRowHeight=50,
      } = this.props
      console.log({sourceRelationshipsSG})
      let treeFunc = recs => _.supergroup(recs, [
                                'src_code_match_str',
                                'src_concept_code',
                                'src_concept_id',
                                'relationship',
                                'target_concept_id'])
      const cardStyle = {
        padding: '0px',
      };

      return  <Card initiallyExpanded={true} containerStyle={cardStyle} style={cardStyle}>
                <CardHeader style={{padding:'0px 8px 0px 8px'}}
                  actAsExpander={true}
                  showExpandableButton={true}
                  title="Source Target Source Report"
                />


                <CardText expandable={true} >
                  <List >
                    <ListItem
                      innerDivStyle={{
                        paddingTop: 3,
                        paddingBottom: 3,
                        //padding: 0,
                        //padding: '10px 10px 10px 78px',
                      }}
                      primaryText={
                        <p style={{color:muiTheme.palette.primary1Color}}>
                          {`${sourceConceptCodesSG.length} ${vocabulary_id} concepts 
                              matching ${concept_code_search_pattern}`
                          }
                        </p>
                      }
                      secondaryText={ countText(recs) }
                      secondaryTextLines={2}
                      initiallyOpen	={false}
                      nestedItems={
                        sourceConceptCodesSG.map((d,i) => {
                          return          <ListItem key={i} 
                                            innerDivStyle={{
                                              padding: '10px 10px 0px 78px',
                                              marginBottom: 0,
                                            }}
                                            leftAvatar={
                                              <Avatar
                                                color={muiTheme.palette.alternateTextColor}
                                                backgroundColor={muiTheme.palette.primary1Color}
                                                size={30}
                                                style={{width:'auto',
                                                        textAlign: 'right',
                                                        margin:'-4px 10px 10px -10px',
                                                        padding:5,}}
                                              >
                                                {d.toString().split(/:/)[0]} 
                                              </Avatar>
                                            }
                                            containerElement={
                                              <span style={{
                                                margin: 0,
                                                padding:0,
                                              }} />
                                            }
                                            primaryText={
                                              <span style={{
                                                margin: 0,
                                                padding:0,
                                              }}>
                                                {d.toString().split(/: /)[1]}
                                              </span>
                                            }
                                            secondaryText={ countText(d.records) }
                                            secondaryTextLines={2}
                                            initiallyOpen={true}
                                          />
                          })
                        }
                    />
                    {sourceRelationshipsSG.map(
                      (rel,i) => {
                        let rrels = duck.sourceRelationshipsSG({vocab:{recs:rel.records}})
                        //debugger
                        return (
                          <div key={i} style={{marginLeft:15}} >
                            <Relationship key={i} rel={rel} />
                            <div style={{marginLeft:15}} >
                              {rrels.map(
                                (rrel,j) => <Relationship key={j} rel={rrel} />
                              )}
                            </div>
                          </div>
                        )
                      }
                    )}
                  </List>
                </CardText>
              </Card>
    } catch(e) {
      console.log(e)
      debugger
    }
  }
}
const Relationship = props => {
  let {rel, } = props
  return (
    <ListItem
      innerDivStyle={{
        paddingTop: 3,
        paddingBottom: 3,
        //padding: '10px 10px 10px 78px',
      }}
      primaryText={
        <p style={{color:muiTheme.palette.primary1Color}}>
          {rel.toString()}
        </p>}
        initiallyOpen	={true}
        nestedItems={
          rel.getChildren().map((vocab,i) => {
            return          <ListItem key={i} 
                              innerDivStyle={{
                                //padding: '10px 10px 10px 78px',
                              }}
                              containerElement={
                                <span style={{
                                }} />
                              }
                              primaryText={
                                <span style={{
                                  margin: 0,
                                  padding:0,
                                }}>
                                  {vocab.toString()}
                                </span>
                              }
                              secondaryText={ countText(vocab.records) }
                              secondaryTextLines={2}
                              initiallyOpen={false}
                              nestedItems={
                                vocab.getChildren(true)
                                  .sort((a,b)=>d3.ascending(a.concept_code,b.concept_code))
                                  .map(
                                    (concept,i) => <ListItem
                                                key={i}
                                                primaryText={rel.toString()}
                                                primaryText={
                                                  <span style={{
                                                  }}>
                                                    {concept.concept_name}
                                                  </span>
                                                }
                                                secondaryText={ countText(concept.records) }
                                                secondaryTextLines={2}
                                                leftAvatar={
                                                  <Avatar
                                                    color={muiTheme.palette.alternateTextColor}
                                                    backgroundColor={muiTheme.palette.primary1Color}
                                                    size={30}
                                                    style={{width:'auto',
                                                            textAlign: 'right',
                                                            margin:'-4px 10px 10px -10px',
                                                            padding:5,}}
                                                  >
                                                    {concept.concept_code}
                                                  </Avatar>
                                                }
                                                initiallyOpen={true}
                                              />)}
                            />
            })
          }
    />
  )
}
const countText = recs => {
  let tblcols = _.supergroup( 
                    _.flatten((recs||[]).map(d=>d.rcs)),
                    ['tbl','col'])
  return (tblcols
            .leafNodes()
            .map((col,k) => <div key={k}>
                              <span style={{fontWeight:'bold'}}>{col.namePath('-->')}</span>:{' '}
                              {['rc','src','crc'].map(
                                  c=>`${c}: ${col.aggregate(_.sum,c)}`
                                ).join(', ')
                              }
                            </div>))
}
