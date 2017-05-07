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
import _ from 'src/supergroup' // in global space anyway...
import * as cncpt from 'src/ducks/concept'
import {AgTable, ConceptTree, } from 'src/components/TableStuff'
import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from 'src/utils'

import React, { Component } from 'react'


import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { bindActionCreators } from 'redux'

import Spinner from 'react-spinner'
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap'
//if (DEBUG) window.d3 = d3
import SortableTree from 'react-sortable-tree'

import ReactTooltip from 'react-tooltip'
window.ReactTooltip = ReactTooltip

import {GridList, GridTile} from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import CircularProgress from 'material-ui/CircularProgress';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';
import Chip from 'material-ui/Chip'
import muiThemeable from 'material-ui/styles/muiThemeable';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as muit from 'src/muitheme'
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

/*
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
*/
const WrapForSc = ({sc, ...props}) => {
  let scTheme = muit.scThemes[sc]
  //props = {...props, scTheme}
  return  <MuiThemeProvider muiTheme={scTheme}>
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
const CdmRecsAvatar = muiThemeable()(props => {
  let {contents, val, muiTheme, ...rest} = props
  return  <Avatar
            color='white'
            backgroundColor={muiTheme.palette.regular}
            size={30}
            {...rest}
            /*
            style={{width:'auto',
                    textAlign: 'right',
                    margin:'-4px 10px 10px -10px',
                    padding:5,
                    //...styles.font,
            }}
            */
          >
            { contents }
          </Avatar>
})
const ScView = muiThemeable()(props => {
  let {concepts, sc, title, style={}, muiTheme, depth, storeName, } = props
  let pal = muiTheme.palette
  let colCnts = cncpt.colCntsFromConcepts(concepts)
  return  <GridTile style={gridStyles.tile()} >
            <div style={gridStyles.child} >
              <Subheader style={gridStyles.tileTitle} >
                {title}
                {
                  colCnts.map(
                    (cnt,i)=>{
                      let ttId = _.uniqueId('scViewTtId-')
                      return (
                        <div
                            key={i}
                        >
                          <ReactTooltip id={ttId} place="bottom" effect="solid"/>
                          <RaisedButton 
                              //fullWidth={true}
                              primary={true} 
                              labelStyle={{textTransform:'none'}}
                              label={`${title ? title + ' ' : ''}${commify(cnt.cnt)}`}
                              labelPosition="before"
                              data-tip={colname(cnt)}
                              data-for={ttId}
                              icon={
                                <CdmRecsAvatar
                                    contents={ cncpt.conceptTableAbbr(cnt.tbl) }
                                />
                              }
                          />
                        </div>
                      )
                    })
                }
              </Subheader>
              Rels:
              { 
                viewCount < 15 &&
                depth < 1 &&
                _.map(cncpt.concepts2relsMap(concepts),
                      (relcids,relName) => {
                        if (!relName.match(/map/i)) return null
                        return <RelView key={relName} 
                                  {...{relName, relcids, depth, storeName}}
                        />
                        viewCount++
                      })
              }
            </div>
          </GridTile>
})
const colname = cnt => {
  let cn = `${cnt.tbl}.${cnt.col}`
  console.log(cn)
  return cn
}
const scsView = props => {
  let bySc = cncpt.conceptsBySc(props.concepts) // just supergroups by 'standard_concept'
                .filter(sc=>cncpt.rcsFromConcepts(sc.records))

  return  <GridList
            cellHeight={'auto'}
            style={{...gridStyles.gridList, ...gridStyles.gridList.horizontal}}
            //cellHeight={150}
            //cols={bySc.length}
            cols={.3}
          >
            {
              bySc.map((sc,i) => {
                let title=`${sc.records.length} ${cncpt.scName(sc.records[0])}`
                return  <WrapForSc sc={sc.toString()} key={i}>
                            <ScView {...{...props, sc, title, concepts: sc.records }} />
                        </WrapForSc>
              })
            }
          </GridList>
}
const RelsView = ({relName,relcids,depth,storeName}) => {
  let title = `Relssss View: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  if (depth > 1) {
    return <RaisedButton  fullWidth={true}
                          key={i}
                          primary={true} 
                          labelStyle={{textTransform:'none'}}
                          label={title}
                      />
  }
  return (
    <ConceptViewContainer key={relName}
      depth={depth + 1}
      storeName={storeName}
      concept_ids={relcids}
      title={`From RelView: ${relcids.length} ${relName} concepts`}
    />
  )
}
const RelView = ({relName,relcids,depth,storeName}) => {
  let title = `RelView: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  if (depth > 1) {
    return <RaisedButton  fullWidth={true}
                          key={i}
                          primary={true} 
                          labelStyle={{textTransform:'none'}}
                          label={title}
                      />
  }
  return (
    <ConceptViewContainer key={relName}
      depth={depth + 1}
      storeName={storeName}
      concept_ids={relcids}
      title={`From RelView: ${relcids.length} ${relName} concepts`}
    />
  )
}
const cardStyles = { // stopped using cards, but still using these style below
  root: {
    //margin: '3%',
    zoom: 0.8, 
    //width: '94%',
    //borderRadius: '100%',
    borderRadius: '.8em',
    backgroundColor: muit.getColors().light,
    //padding: 10,
    boxShadow: `inset 0 0 .9em .5em ${muit.getColors().darker}, 0 0 .9em .5em ${muit.getColors().darker}`,
    //boxShadow: `inset 0 0 2em 2em ${muit.getColors().darker}`,
//inset 0 0 0.5em 0.5em indigo, 0 0 0.5em 0.5em indigo;  /* padding:1em * /
    
  },
  title: {
    ...muit.getStyles().headerLight,
    //boxShadow: `.2em .2em .7em ${muit.getColors().darker}`,
    //backgroundColor: muiTheme.palette.atlasDarkBg,
    //color: muiTheme.palette.alternateTextColor,
  },
  text: {
  }
}
const gridStyles = { // GridList styles based on Simple example
                      // http://www.material-ui.com/#/components/grid-list
  parent: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    //...cardStyles.root,
  },
  gridList: {
    //border: '5px solid pink',
    width: '100%',
    //height: 450,
    horizontal: {
      display: 'flex',
      flexWrap: 'nowrap',
      overflowX: 'auto',
    },
    vertical: {
      overflowY: 'auto',
    },
  },
  listTitle: cardStyles.title,
  tile: sc => ({
    //zoom: 0.8, 
    backgroundColor: muit.getColors(sc).light,
    background: `linear-gradient(to top, 
                                  ${muit.getColors(sc).light} 0%,
                                  ${muit.getColors(sc).regular} 70%,
                                  ${muit.getColors(sc).dark} 100%)`,
    width: '100%',
    //minHeight: 100,
  }),
  tileTitle: {
    fontSize: '1.6em',
    color: 'white',
    //color: muit.getColors().darker,
  },
  child: {
    paddingTop:10,
    width: '100%',
    //marginTop: 50,  // WAS ONLY ON SC
  }
}
let viewCount = 0 // to prevent stack overflow
class ConceptInfoGridList extends Component {
  render() {
    let { muiTheme,
          title,
          depth,
          storeName,
          subtitle,
          concepts=[], 
          showIndividualConcepts=false,
        } = this.props
    if (concepts.length < 1)
      return null
    const onlyOneConcept = concepts.length === 1

    return (
      <div style={gridStyles.parent}>
        <GridList cellHeight={'auto'} 
                  //cols={concepts.length > 1 ? 2 : 1}
                  cols={1}
                  style={{...gridStyles.gridList, ...gridStyles.gridList.vertical}} >
          <GridTile style={gridStyles.tile()} >
            <div style={gridStyles.child} >
              <Subheader style={gridStyles.tileTitle} >{title}</Subheader>
              <Subheader style={gridStyles.tileTitle} >{subtitle}</Subheader>
              {scsView(this.props)}
            </div>
          </GridTile>
          { showIndividualConcepts && concepts.length > 1 ?
            <GridTile style={gridStyles.tile()} >
              <div style={gridStyles.child} >
                <h2>individual concepts</h2>
                <ConceptViewContainer 
                  {...{...this.props, title: 'Individual Concepts', 
                    showIndividualConcepts: true}} />
              </div>
            </GridTile>
            : []
          }
        </GridList>
      </div>
    )
  }
}
class ConceptViewContainer extends Component {
  componentDidMount() {
    let {concept_ids, depth, title, storeName, wantConcepts, } = this.props
    if (concept_ids && concept_ids.length) {
      storeName = `${depth}:${storeName}->${title}`
      wantConcepts(concept_ids, storeName)
    }
  }
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let {concept_ids, depth, title, subtitle, storeName, wantConcepts, 
            initiallyExpanded=true} = this.props
    return  <Card
                style={cardStyles.root}
                expandable={true}
                  initiallyExpanded={initiallyExpanded}
            >
              <CardTitle
                titleStyle={cardStyles.title}
                title={title}
                subtitle={subtitle}
                showExpandableButton={true}
                actAsExpander={true}
              />
              <CardText expandable={true}
                        style={cardStyles.text}
              >
                <ConceptInfoGridList {...{...this.props, title:undefined, subtitle:undefined}} />
              </CardText >
            </Card>
  }
}
ConceptViewContainer = connect(
  (state, props) => {
    let {storeName='primary', concepts, concept_ids, 
          depth=0, title, } = props
    if (!concepts) {
      if (concept_ids) {
        concepts = cncpt.conceptsFromCids(state)(concept_ids)
      } else {
        concepts = cncpt.storedConceptList(state)
      }
    }
    return {
      depth,
      storeName,
      title,
      concepts,
      storedConceptMap: cncpt.storedConceptMap(state),
      storedConceptList: cncpt.storedConceptList(state),
      conceptsFromCids: cncpt.conceptsFromCids(state),
    }
  },
  dispatch=>bindActionCreators(_.pick(cncpt,['wantConcepts']), dispatch)
)(muiThemeable()(ConceptViewContainer))

export {ConceptViewContainer}
