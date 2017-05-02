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
import _ from '../../supergroup' // in global space anyway...
import React, { Component } from 'react'


import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { bindActionCreators } from 'redux'

import * as vocab from '../../redux/ducks/vocab'
import * as cncpt from '../../redux/ducks/concept'

import Spinner from 'react-spinner'
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap'
//if (DEBUG) window.d3 = d3
import {AgTable, ConceptTree, } from '../TableStuff'
import SortableTree from 'react-sortable-tree'
require('../sass/Vocab.css')

import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from '../../utils'

import Chip from 'material-ui/Chip'
import muiThemeable from 'material-ui/styles/muiThemeable';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as muit from '../../muitheme'
import MenuItem from 'material-ui/MenuItem'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import ArrowIcon from 'material-ui/svg-icons/navigation/arrow-forward.js'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, } from 'material-ui/Card'

// not using most of this: http://www.material-ui.com/#/components/list
import {List, ListItem} from 'material-ui/List'
import ContentInbox from 'material-ui/svg-icons/content/inbox'
import ActionGrade from 'material-ui/svg-icons/action/grade'
import ContentSend from 'material-ui/svg-icons/content/send'
import ContentDrafts from 'material-ui/svg-icons/content/drafts'
import Divider from 'material-ui/Divider'
import ActionInfo from 'material-ui/svg-icons/action/info' 

import Avatar from 'material-ui/Avatar'

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

export const getConceptSetAsCard = ({getWith, getArg, props={}}) => {
  let concepts
  switch(getWith) {
    case 'concepts':
      concepts = getArg || []
    case 'concept_ids':
      throw new Error("need to load from concept_ids")
    case 'concept_code_search_pattern':
      throw new Error("need to load from code pattern")
    default:
      throw new Error("don't know how to do that")
  }
  return <ConceptSetAsCard concepts={concepts} {...props} />
}
class SetAsCard extends Component {
  render() {
    let { title="Did you forget a title for the SetAsCard?", 
          subtitle='',
          contents=[], // array of components (or single)
          dontPutContentsInCardTexts=false,
          dataIfCurious, // maybe don't need it
          expanded=false
        } = this.props

    if (dontPutContentsInCardTexts)
      throw new Error("not implemented")

    contents = Array.isArray(contents) ? contents : [contents]
    let cardTexts = contents.map(
      (c,i) =>  <CardText expandable={true} key={i}>
                  {c}
                </CardText>
    )

    return (
        <Card initiallyExpanded={expanded} >
          <CardHeader
            title={title}
            titleColor={muit.scThemes.X.palette.primary1Color}
            subtitle={subtitle}
            subtitleColor={muit.scThemes.X.palette.primary1Color}
            actAsExpander={true}
            showExpandableButton={true}
          />
          {cardTexts}
        </Card>
    )
  }
}
const WrapForSc = ({sc, ...props}) => {
  return  <MuiThemeProvider muiTheme={muit.scThemes[sc]}>
            {props.children}
          </MuiThemeProvider>
}
/*
let styles = {
                    chip: {
                      margin: 4,
                      backgroundColor:muiTheme.palette.primary1Color,
                    },
                    items: {
                      color:muiTheme.palette.alternateTextColor,
                    },
                    wrapper: {
                      display: 'flex',
                      flexWrap: 'wrap',
                    },
}
*/
const scDescForSet = concepts => {
  let bySc = cncpt.bySc(concepts) // just supergroups by 'standard_concept'
  let byScTblCol = cncpt.byScTblColtypeCol(concepts)
  return  <div>
            {
              byScTblCol.map(
                (sc,i)=> {
                  return <WrapForSc sc={sc.toString()} key={i}>
                            <RaisedButton primary={true} 
                                label={`${sc.records.length} ${cncpt.scName(sc.records[0],sc.records.length)}`}
                            >
                              {
                                sc.leafNodes().map(
                                  (cnt,i)=>(
                                      <Chip key={i} 
                                          //style={styles.chip}
                                          onRequestDelete={() => alert('not working yet')}
                                      >
                                        <span 
                                            //style={styles.items}
                                        >
                                          {cnt.problem || cnt.cnt}
                                        </span>
                                      </Chip>
                                  ))
                              }
                            </RaisedButton>
                         </WrapForSc>
                }

              )
            }
          </div>

}
SetAsCard = muiThemeable()(SetAsCard)
class ConceptSetAsCard extends Component {
  render() {
    let { title,
          subtitle,
          concepts=[], expanded=false} = this.props

    title = typeof title === 'undefined' 
                ? scDescForSet(concepts) : title

    //subtitle = typeof subtitle === 'undefined' ? countText(concepts) : subtitle

    // show each rel as whole ConceptSet?

    // show rels for each concept?
    return (
      <MuiThemeProvider muiTheme={muit.scThemes.X}>
      <SetAsCard {...{...this.props, title, subtitle}}
        contents={[
          // concepts:
          <List >
            {
              concepts.map(
                (concept,i) => {
                  let rsg = _.supergroup(concept.rels, 'relationship')
                  return (
                    <ListItem
                      key={i}
                      primaryText={
                        <div style={{color: muit.scThemes.X.palette.primary1Color}} >
                          {scDescForSet([concepts])}
                        </div>
                      }
                      secondaryText = {
                        rsg.map(r=><RaisedButton 
                                      primary={true}
                                      style={{
                                        margin:'0px 5px 0px 5px', 
                                        color: muit.scThemes.X.palette.secondary1Color,
                                      }}
                                      key={r.toString()}
                                      label={`${r.records.length} ${r}`} />
                               )
                      }
                      secondaryTextLines={2}
                      leftAvatar={
                        <Avatar
                          color={muit.scThemes.X.palette.alternateTextColor}
                          backgroundColor={muit.scThemes.X.palette.accent1Color}
                          size={30}
                          style={{width:'auto',
                                  textAlign: 'right',
                                  margin:'-4px 10px 10px -10px',
                                  padding:5,
                                  //...styles.font,
                          }}
                        >
                          {concept.concept_code}
                        </Avatar>
                      }

                      /*
                      insetChildren={true}

                      innerDivStyle={{
                        paddingTop: 3,
                        paddingBottom: 3, }}

                      initiallyOpen	={false}
                      nestedListStyle={{marginLeft:30, fontSize:5}}
                      nestedItems={ nestedItems }
                      {...otherProps}
                      */
                    >
                    </ListItem>
                  )
                }
              )
            }
          </List>,
        ]}

      />
      </MuiThemeProvider>
    )
  }
}
ConceptSetAsCard = muiThemeable()(ConceptSetAsCard)
export {ConceptSetAsCard}

/*
 *
export const getCounts = ({concepts=[], ...opts}) => {
  if (!_.isEmpty(opts))
    debugger //throw new Error("opt to handle?")
  
  let tblcols = _.supergroup( 
                    _.flatten(concepts.map(d=>d.rcs)),
                    ['tbl','col'])
  let cnts = 
    tblcols
      .leafNodes()
      .map((col,k) => ({
        colName: col.toString(),
        tblName: col.parent.toString(),
        col,
        cnts: _.chain(['rc','src','crc'])
                .map(cntType=>[cntType, col.aggregate(_.sum,cntType)])
                .filter(c => c[1]>0)
                .fromPairs()
                .value(),
      }))
  return cnts
}
const countText = (concepts) => {
  let colCnts = cncpt.getCounts({concepts})
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
*/


/*
export class ConceptAsListItem extends Component {
  render() {
    let {title, subtitle, children, nestedItems, avatarText, ...otherProps} = this.props
    if (avatarText)
      return <ConceptWithCodeInAvatar {...this.props} />
    return (
      <ListItem
        innerDivStyle={{
          paddingTop: 3,
          paddingBottom: 3, }}
        primaryText={title}
        secondaryText={ subtitle }
        initiallyOpen	={false}
        nestedListStyle={{marginLeft:30, fontSize:5}}
        nestedItems={ nestedItems }
        {...otherProps}
      >
        {children}
      </ListItem>
    )
  }
}
const ConceptWithCodeInAvatar = props => {
  // old code, maybe formatting is useful
  let {title, subtitle, children, nestedItems, avatarText, styles={},
          ...otherProps} = props
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
                        color={this.props.muiTheme.palette.alternateTextColor}
                        backgroundColor={this.props.muiTheme.palette.primary1Color}
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

      nestedItems={ nestedItems }
      {...otherProps}
    >
      {children}
    </ListItem>
  )
}
*/
