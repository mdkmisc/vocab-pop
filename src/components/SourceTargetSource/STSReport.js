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
import { bindActionCreators } from 'redux'

import * as vocab from '../../redux/ducks/vocab'
import {ConceptCodesLookupForm} from '../Lookups'

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
    console.error('window.stsprops', this.props)
    window.stsprops = this.props
    let {vocabulary_id, concept_code_search_pattern, conceptInfo=[], 
          sortableRowHeight=50,
    } = this.props
    const cardStyle = {
      padding: '0px',
    };

    return  <Card initiallyExpanded={true} containerStyle={cardStyle} style={cardStyle}>
              <CardHeader style={{
                  padding:'10px 8px 0px 8px'
                }}
                actAsExpander={true}
                showExpandableButton={true}
                title={<h4>Source Target Source Report</h4>}
              />
              <ConceptCodesLookupForm style={{ margin: 10, }}
              />
              <CardText style={{leftMargin:15}}
                        expandable={true} >
                <ConceptListConnected 
                  concepts={conceptInfo}
                  title={`${conceptInfo.length} concepts `}
                />
              </CardText>
            </Card>
  }
}
const ConceptItem = props => {  // just for source concepts at moment
  let { title, subtitle, avatarText, concept, styles} = props
  title = title || concept.concept_name
  subtitle = subtitle || countText([concept])
  return (
    <ListItem
      innerDivStyle={{
        padding: '10px 10px 0px 78px',
        marginBottom: 0,
        ...styles.item,
        ...styles.font,
      }}
      leftAvatar={
        avatarText ?  <Avatar
                        color={muiTheme.palette.alternateTextColor}
                        backgroundColor={muiTheme.palette.primary1Color}
                        size={30}
                        style={{width:'auto',
                                textAlign: 'right',
                                margin:'-4px 10px 10px -10px',
                                padding:5,
                                ...styles.font,
                        }}
                      >
                        {avatarText}
                      </Avatar>
                  : undefined
      }
      containerElement={
        <span style={{
          margin: 0,
          padding:0,
          ...styles.font,
        }} />
      }
      primaryText={
        <span style={{
          margin: 0,
          padding:0,
          ...styles.font,
        }}>
          {title}
        </span>
      }
      secondaryText={ 
        <span style={{
          margin: 0,
          padding:0,
          ...styles.font,
        }}>
          {subtitle}
        </span>
      }
      secondaryTextLines={2}
      initiallyOpen={true}
    />
  )
}
class ConceptList extends Component {
  componentDidMount() {
    const {concept_ids, loadConceptInfo, storeName} = this.props
    if (concept_ids && concept_ids.length) {
      loadConceptInfo({params:{concept_ids}, storeName})
    }
  }
  render() {
    let { title, concepts=[], } = this.props
    let rels = _.supergroup( _.flatten(concepts.map(d=>d.rels)), 'relationship')
    return (
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
              {title}
            </p> }
          secondaryText={ countText(concepts) }
          secondaryTextLines={2}
          initiallyOpen	={false}
          nestedListStyle={{marginLeft:30, fontSize:5}}
          nestedItems={ concepts.map((concept,i) => 
                          <ConceptItem  key={i}
                                        styles={{
                                          font: {
                                            fontSize: 12,
                                          }
                                        }}
                                        avatarText={concept.concept_code}
                                        concept={concept} 
                          />)}
        />
        <Card>
          <CardHeader
            title="Related to"
            actAsExpander={true}
            showExpandableButton={true}
          />
          <CardText expandable={true}>
            {
              rels.map( (rel,i) => {
                let title = `${rel.records.length} ${rel.toString()} (sub) concepts`
                console.log({rel, title})
                return <ListItem
                          key={i}
                          innerDivStyle={{
                            paddingTop: 13,
                            paddingBottom: 3,
                          }}
                          /*
                          primaryText={
                            <p style={{color:muiTheme.palette.primary1Color}}>
                              {rel.records.length}
                              {rel.toString()} 
                            </p> 
                          }
                          */
                          //secondaryText={ countText(concepts) }
                          //secondaryTextLines={2}
                          initiallyOpen	={true}
                          nestedItems={ 
                            /*
                            rels.getChildren()
                              .map((group,j) => 
                              <ConceptItem concept={concept} key={j} />)
                            */
                            [<ConceptListConnected 
                              title={title}
                              storeName={title}
                              concept_ids={_.flatten(rel.records.map(d=>d.relcids))}
                            />]
                          }
                      >
                      </ListItem>
                        
                /*
                debugger
                let rrels = vocab.sourceRelationshipsSG({vocab:{conceptInfo:rel.records}})
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
                */
              })
            }
          </CardText>
        </Card>
      </List>
    )
  }
}

const ConceptListConnected = connect(
  (state, props) => { // mapStateToProps
    let {storeName} = props
    //let apiCalls = state.vocab.apiCalls || {}
    if (storeName) {
      throw new Error('fix')
      /*
      let storeObj = apiCalls[apiGlobal.Apis.s toreId(
                                state.vocab.apis.conceptInfoApi.apiName, storeName)]
      return {concepts: (storeObj && storeObj.meta && storeObj.meta.results)}
      */
    }
    console.error('fix this weirdness')
    return {
      //concepts: vocab.apis.conceptInfoApi.selectors(state,props).results(state,props)(state,{},vocab.apis.conceptInfoApi.props),
    }
      //vocabulariesApi.selectorFuncs(state,props).results(state,props)(state,{},vocabulariesApi.props),
    //return {concepts: state.vocab.apis.conceptInfoApi.selectors.conceptInfoWithMatchStrs(state.vocab)}
  },
  vocab.mapDispatchToProps,
)(ConceptList)


const countText = (concepts) => {
  let colCnts = vocab.plainSelectors.getCounts({concepts})
  return (
    colCnts.map(
      ({cnts,col,colName,tblName},i) => {
        let msg = ''
        if (_.keys(cnts).length > 1) {
          msg = 'Only expect a single count type per concept!'
        }
        let cntTxt = _.map(cnts, (cnt,type) =>
                          <span key={type} >
                            <span style={{fontWeight:'bold'}}>
                              {commify(cnt)} {' '}
                              { // PUT PRETTY NAME CONVERSION SOMEWHERE BETTER
                                ({rc:'Standard',
                                  src:'Non-standard (source)',
                                  crc:'Classification (should only appear in descendant counts)'
                                })[type]
                              }
                            </span>{' '}
                            records
                          </span>
                      )
        return (<div key={i}>
                  {cntTxt} in {' '}
                  <span style={{fontWeight:'bold'}}>{colName} </span>
                  column of
                  <span style={{fontWeight:'bold'}}> {tblName} </span>
                </div>)
      }))
}
