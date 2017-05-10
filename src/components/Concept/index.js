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
import * as tooltip from 'src/tooltip'
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

import Badge from 'material-ui/Badge'
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
const junkTile = i =>
                  <GridTile style={gridStyles.tile()} key={i}>
                    <div style={gridStyles.child} >
                      <h3>placeholder</h3>
                    </div>
                  </GridTile>
export const fmtCdmCnt = (fmt='short') => {
  switch(fmt) {
    case 'short':
      return cnt=>`${commify(cnt.cnt)} ${cncpt.conceptTableAbbr(cnt.tbl)}`
    case 'long':
      return cnt=>`${commify(cnt.cnt)} records in ${cnt.tbl}.${cnt.col}`
  }
  throw new Error("confused")
}
export const cdmCnts = (concepts, join=d=>d.join(', ')) => {
  let cnts = cncpt.colCntsFromConcepts(concepts) 
  return {
    short: join(cnts.map(fmtCdmCnt('short'))),
    long: join(cnts.map(fmtCdmCnt('long'))),
  }
}
export const LinkWithCounts = muiThemeable()(props => {
  let {concepts, ttid, title, tip, muiTheme} = props
  let cnts = cdmCnts(concepts, d=>d)
  let href = '#' // should be link to concept focus

  const styles = {
    ccodeButton: {
      //padding: 2,
      padding: '1px 3px 1px 3px',
      margin: '5px 2px 1px 2px',
      //margin: 2,
      //border:'1px solid pink', 
      color: 'white',
      lineHeight:'auto',
      height:'auto',
      minHeight:'auto',
      width:'auto',
      minWidth:'auto',
    },
  }
  let contents = title
  if (cnts.short.length) {
    contents += ` (${cnts.short.join(', ')})`
    tip = <div><div>{tip}</div>{cnts.long.map((c,i)=><div key={i}>{c}</div>)}</div>
  }
  let ttcid = tooltip.setTooltipContent('cvc', tip)
  return  (
    <span>
      <FlatButton  
        style={
          { 
            ...styles.ccodeButton,
            backgroundColor: muiTheme.palette.regular,
          }
        } 
        href={href} 
        data-tip
        data-for="cvc"
        data-ttcid={ttcid}
      >
        {contents}
      </FlatButton>
    </span>
  )
})
/*
const CdmRecsAvatar = muiThemeable()(props => {
  let {contents, val, muiTheme, ...rest} = props
  return  <Avatar
            color='white'
            backgroundColor={muiTheme.palette.regular}
            size={30}
            {...rest}
            style={{width:'auto',
                    textAlign: 'right',
                    margin:'-4px 10px 10px -10px',
                    padding:5,
                    //...styles.font,
            }}
          >
            { contents }
          </Avatar>
})
*/
export const CdmCountView = muiThemeable()(props => {
  let {cnt, badgeStyle, rootStyle, muiTheme, ...rest} = props
  return  <Badge 
            style={rootStyle}
            badgeStyle={badgeStyle}
            badgeContent={cncpt.conceptTableAbbr(cnt.tbl)}
            {...rest}
          >
            <span>{commify(cnt.cnt)}</span>
            {/*
            <CdmRecsAvatar contents={commify(cnt.cnt)} />
            */}
          </Badge>
})
const ScView = muiThemeable()(props => {
  let {concepts, title, style={}, muiTheme, depth, storeName, } = props
  let pal = muiTheme.palette
  let cnts = cdmCnts( concepts, d=>d)
  return  <GridTile style={gridStyles.tile()} >
            <div style={gridStyles.child} >
              <Subheader style={gridStyles.tileTitle} >
              </Subheader>
              { 
                //Rels:
                _.map(cncpt.concepts2relsMap(concepts),
                      (relcids,relName) => {
                        if (!relName.match(/map/i)) return null
                        return <RelView key={relName} 
                                  {...{relName, relcids, depth, storeName}}
                        />
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
  let {concepts,depth,muiTheme,storeName} = props
  let bySc = cncpt.conceptsBySc(concepts) // just supergroups by 'standard_concept'
                .filter(sc=>cncpt.rcsFromConcepts(sc.records))

  let contents
  if (bySc.length > 1) {
    contents = bySc.map((sc,i) => {
                  let title = `${sc.records.length} ${cncpt.scName(sc.records[0])}`
                  return  
                              <ScView key={i}
                                {...{
                                    title, depth, storeName,
                                    concepts: sc.records,
                                    muiTheme: muit.get({sc:sc.toString()}) 
                                }} />
                })
    //contents = [junkTile(0), junkTile(1)]
  } else {
    let sc = bySc[0]
    contents = [ <ScView key={0}
                  {...{
                      depth, storeName,
                      concepts: sc.records,
                      muiTheme: muit.get({sc:sc.toString()}) 
                  }} />
              ]
    //contents = [junkTile(0)]
  }
  return  <GridList
            cellHeight={'auto'} cols={.3}
            style={{...gridStyles.gridList, ...gridStyles.gridList.horizontal}}
          >
            {contents}
          </GridList>
}
const RelView = ({relName,relcids,depth,storeName}) => {
  let title = `RelView: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  if (depth > 2) {
    console.error('bailing from RelView to avoid max stack')
    return null//<h5>too deep to display ({depth}) {title}</h5>
  }
  return (
    <ConceptViewContainer key={relName}
      depth={depth + 1}
      storeName={storeName}
      concept_ids={relcids}
      title={`From RelView: ${relcids.length} ${relName} concepts`}
      subtitle={
        ({concepts}) => concepts.map(
          (c,i) => {
            return <LinkWithCounts key={i}
                      concepts={[c]}
                      title={c.concept_code}
                      tip={`${c.vocabulary_id}: ${c.concept_name}`}
                      //ttId={`${this.ttid}:${i}`}
                      muiTheme={muit.get({sc:c.standard_concept})}
                  />
          })
      }
    />
  )
}
class ConceptInfoGridList extends Component {
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let { muiTheme,
          // title, subtitle, // use in container, not here
          depth,
          storeName,
          concepts=[], 
          showIndividualConcepts=false,
        } = this.props
    if (concepts.length < 1)
      return null
    const onlyOneConcept = concepts.length === 1
    let contents =
          <GridTile style={gridStyles.tile()} >
            <div style={gridStyles.child} >
              {scsView({concepts,depth,muiTheme})}
            </div>
          </GridTile>
           /*  DON'T DELETE, PUT BACK WHEN READY
            showIndividualConcepts && concepts.length > 1 ?
            <GridTile style={gridStyles.tile()} >
              <div style={gridStyles.child} >
                <h2>individual concepts</h2>
                <Con
                
                ceptViewContainer 
                  {...{...this.props, title: 'Individual Concepts', 
                    showIndividualConcepts: true}} />
              </div>
            </GridTile>
            : []
          */

    //contents = [junkTile(0)]
    return (
      <div style={gridStyles.parent}>
        <GridList cellHeight={'auto'} 
                  //cols={concepts.length > 1 ? 2 : 1}
                  cols={1}
                  style={{...gridStyles.gridList, ...gridStyles.gridList.vertical}} >
          {contents}
        </GridList>
      </div>
    )
  }
}
class ConceptViewContainer extends Component {
  constructor(props) {
    let {depth, title='CvcNoTitle', storeName, } = props
    super(props)
    this.tt = tooltip.registerTooltip('cvc')
    this.storeName = `${depth}:${storeName}->${title}`
  }
  componentDidMount() {
    let {concept_ids, depth, title, wantConcepts, } = this.props
    if (concept_ids && concept_ids.length) {
      if (concept_ids.length > 100) {
        console.error(`not fetching ${concept_ids.length} concepts`, title)
        return
      }
      wantConcepts(concept_ids, this.storeName)
    }

    //this.ttId = _.uniqueId('ciglTtId-')
    ReactTooltip.rebuild()
  }
  componentWillUnmount() {
    tooltip.unregisterTooltip('cvc')
  }
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  static viewCount = 0 // to prevent stack overflow
  render() {
    let {concepts, concept_ids, depth, title, subtitle, 
            wantConcepts, conceptFetchStatus, initiallyExpanded=true} = this.props
    if ( conceptFetchStatus === 'waiting' ) {
      return <h4>Waiting for concepts: {title} - {subtitle} {concept_ids.join(', ')}</h4>
    }
    if ( ConceptViewContainer.viewCount++ > 200 ) {
      console.error('bailing to avoid max stack (count)',depth, ConceptViewContainer.viewCount )
      return <h5>too many to display ({depth}: {ConceptViewContainer.viewCount}) {title} - {subtitle}</h5>
    }
    if ( depth > 2 ) {
      console.error('bailing to avoid max stack (depth)',depth, ConceptViewContainer.viewCount )
      return null//<h5>too deep to display ({depth}: {ConceptViewContainer.viewCount}) {title} - {subtitle}</h5>
    }
    let cnts = cdmCnts( concepts, d=>d)
    let ttcid = this.tt.setContent(cnts.long.map((c,i)=><div key={i}>{c}</div>))
    return  <div>
              <Card
                  style={cardStyles.root}
                  expandable={true}
                    initiallyExpanded={initiallyExpanded}
              >
                <CardTitle
                  titleStyle={cardStyles.title}
                  title={
                    <span>
                      {title}
                      <span >
                        <span style={{fontSize: '.6em',}}
                          data-tip
                          data-for="cvc"
                          data-ttcid={ttcid}
                        >
                          ({cnts.short.join(', ')})
                        </span>
                      </span>
                    </span>
                  }
                  subtitle={
                    typeof subtitle === 'function'
                      ? subtitle(this.props)
                      : subtitle
                  }
                  showExpandableButton={true}
                  actAsExpander={true}
                />
                <CardText expandable={true}
                          style={cardStyles.text}
                >
                  <ConceptInfoGridList {...{...this.props, title:undefined, subtitle:undefined}} />
                </CardText >
              </Card>
              {/*
              <ReactTooltip id={this.ttid} >
                <div>
                  { cnts.long.map((c,i)=><div key={i}>{c}</div>) }
                </div> 
              </ReactTooltip>
              */}
            </div>
  }
}
ConceptViewContainer = connect(
  (state, props) => {
    let {storeName='primary', concepts=[], concept_ids=[],
          depth=0, title, } = props
    let conceptFetchStatus = 'ok'
    if (!concepts.length) {
      if (concept_ids.length) {
        concepts = cncpt.conceptsFromCids(state)(concept_ids, false)
      } else {
        concepts = cncpt.storedConceptList(state)
      }
      if (concept_ids.length > concepts.length) {
        conceptFetchStatus = concepts.length ? 'partiallyLoaded' : 'waiting'
      }
    }
    return {
      conceptFetchStatus,
      depth,
      storeName,
      title,
      concepts,
      storedConceptMap: cncpt.storedConceptMap(state),
      storedConceptList: cncpt.storedConceptList(state),
      conceptsFromCids: cncpt.conceptsFromCids(state),
    }
  },
  dispatch=>bindActionCreators(
    _.pick(cncpt,['wantConcepts']), 
    //..._.pick(tooltip,['showTooltip','hideTooltip']), 
  dispatch)
)(muiThemeable()(ConceptViewContainer))

export {ConceptViewContainer}
