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
import muit from 'src/muitheme'
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

const buttonStyles = {
  ccode: {
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
const cardStyles = {
  title: {
    //...muit.getStyles().headerLight,
    //boxShadow: `.2em .2em .7em ${muit.getColors().darker}`,
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
export const LinkWithCounts = props => {
  let {concepts, ttid, title, tip, muitParams} = props
  let M = muit(muitParams)
  let cnts = cdmCnts(concepts, d=>d)
  let href = '#' // should be link to concept focus

  let contents = title
  if (cnts.short.length) {
    contents += ` (${cnts.short.join(', ')})`
    tip = <div><div>{tip}</div>{cnts.long.map((c,i)=><div key={i}>{c}</div>)}</div>
  }
  let ttcid = tooltip.setTooltipContent('cvc', tip)
  return  (
    <span>
      <FlatButton  style={M('flatButton')}
        href={href} 
        data-tip
        data-for="cvc"
        data-ttcid={ttcid}
      >
        {contents}
      </FlatButton>
    </span>
  )
}
export const CdmCountView = props => {
  let {cnt, badgeStyle, rootStyle, ...rest} = props
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
}
const ScView = props => {
  // useless at this point?
  let {concepts, title, style={}, depth, } = props
  let cnts = cdmCnts( concepts, d=>d)
  if (!concepts || !concepts.length)
    debugger
  return  <GridTile style={gridStyles.tile()} >
            <div style={gridStyles.child} >
              <Subheader style={gridStyles.tileTitle} >
                ScView: 
                {title}
              </Subheader>
              { 
                //Rels:
                _.map(cncpt.concepts2relsMap(concepts),
                      (relcids,relName) => {
                        //if (!relName.match(/map/i)) return null
                        return <RelView key={relName} 
                                  {...{relName, relcids, depth, }}
                        />
                      })
              }
            </div>
          </GridTile>
}
const colname = cnt => {
  let cn = `${cnt.tbl}.${cnt.col}`
  //console.log(cn)
  return cn
}
const enhanceChildren = (children, props) => { // doesn't one of the react funcs do this already?
  return  <div>{ React.Children.map(
                  React.Children.toArray(children),
                  (child,i)=>React.cloneElement(child, props))
          }</div>


  let count = React.Children.count(children)
  if (count === 1) {
    return React.cloneElement(React.Children.only(children), props)
  } else if (count > 1) {
    console.log(React.Children)
debugger
    let ret = React.Children.map(
      React.Children.toArray(children),
      (child,i)=>React.cloneElement(child, props))
    return <div>{ret}</div>
    //return React.Children.toArray(children).map( (child,i)=>React.cloneElement(child, props))
  }
  return null
}
const SplitIntoScs = props => {
  let {concepts,depth, children} = props
  let bySc = cncpt.conceptsBySc(concepts) // just supergroups by 'standard_concept'
                .filter(sc=>cncpt.rcsFromConcepts(sc.records))

  /* DON'T THROW AWAY
  if (bySc.length === 1) {
    return enhanceChildren(children, { concepts,  })
  }
  if (bySc.length > 1) {
  }
  */

  let contents = bySc.map((sc,i) => {
    let title = `${sc.records.length} ${cncpt.scName(sc.records[0])}`
    return  <WrapInCard key={i}
                        initiallyExpanded={true} title={title} >
              {
                enhanceChildren(children, {
                    concepts: sc.records, sc,
                    //muiTheme: muit.get({sc}) 
                })
              }
            </WrapInCard>
  })

  return  <div>
            {contents}
          </div>
}
const scsView = props => {
  let {concepts,depth,} = props
  let bySc = cncpt.conceptsBySc(concepts) // just supergroups by 'standard_concept'
                .filter(sc=>cncpt.rcsFromConcepts(sc.records))

  let contents
  if (bySc.length > 1) {
    contents = bySc.map((sc,i) => {
                  let title = `${sc.records.length} ${cncpt.scName(sc.records[0])}`
                  return  
                              <ScView key={i}
                                {...{
                                    title, depth,
                                    concepts: sc.records,
                                    //muiTheme: muit.get({sc}) 
                                }} />
                })
    contents = [junkTile(0), junkTile(1)]
  } else {
    let sc = bySc[0]
    contents = [ <ScView key={0}
                  {...{
                      depth,
                      concepts: sc.records,
                      //muiTheme: muit.get({sc}) 
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
const RelsPeek = props => { // assuming I just have cids, no concepts
  let {concepts=[],title, sc} = props
  let M = muit({sc})
  return  <div>
            { _.map(cncpt.concepts2relsMap(concepts), (relcids,relName) => (
                <span key={relName} >
                  <FlatButton style={M('flatButton')}
                    //href={href} 
                    //data-tip
                    //data-for="cvc"
                    //data-ttcid={ttcid}
                  >
                    {title}
                    {relcids.length} {relName}
                  </FlatButton>
                </span>))
            }
          </div>
}
const RelView = ({relName,relcids,depth,}) => {
  let title = `RelView: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  if (depth > 2) {
    console.error('bailing from RelView to avoid max stack')
    return null//<h5>too deep to display ({depth}) {title}</h5>
  }
  return (
    <ConceptViewContainer key={relName}
      depth={depth + 1}
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
                      muitParams={{sc:c.standard_concept}}
                  />
          })
      }
    />
  )
}
class IndividualConceptViews extends Component {
  render() {
    const {concepts=[], depth, Wrapper='div'} = this.props
    return  <SplitIntoScs {...{concepts,depth}} >
            { concepts.map((c,i) =>
                <ConceptViewContainer key={i}
                  {...{
                    initiallyExpanded: false,
                    ...this.props, 
                    concepts: [c], 
                    title: c.concept_name, 
                    subtitle: `individual concept ${c.vocabulary_id} ${c.concept_code}`,
                  }} 
                />)
            }
            </SplitIntoScs>
  }
}
class ConceptInfoGridList extends Component {
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let { 
          // title, subtitle, // use in container, not here
          depth,
          initiallyExpanded,
          concepts=[], 
        } = this.props
    if (concepts.length < 1)
      return null

    return  <div>
              <WrapInCard initiallyExpanded={true}
                            title={'Relationships'}
              >
                <SplitIntoScs {...{concepts,depth}} >
                  <RelsPeek />
                </SplitIntoScs>
              </WrapInCard>
              { concepts.length > 1 
                ? <WrapInCard initiallyExpanded={false}
                              title={'Individual Concepts'} >
                    <IndividualConceptViews concepts={concepts} />
                  </WrapInCard>
                : ''
              }
            </div>
    /*
    return (
      <div style={gridStyles.parent}>
        <GridList cellHeight={'auto'} 
                  //cols={concepts.length > 1 ? 2 : 1}
                  cols={1}
                  style={{...gridStyles.gridList, ...gridStyles.gridList.vertical}} 
        >
          <GridTile style={gridStyles.tile()} >
            <div style={gridStyles.child} >
              <SplitIntoScs {...{concepts,depth}} >
                <RelsPeek />
              </SplitIntoScs>
            </div>
          </GridTile>

          { concepts.length > 1 
            ? <WrapInCard title={'Individual Concepts'} >
                <IndividualConceptViews concepts={concepts} />
              </WrapInCard>
            : []
          }

        </GridList>
      </div>
    )
    */
  }
}
class WrapInCard extends Component {
  render() {
    let { children,
          title, subtitle, initiallyExpanded=false,
          titleStyle=cardStyles.title, 
          rootStyle,
          muitParams,
        } = this.props
    let M = muit(muitParams)
    rootStyle = rootStyle || M('plainStyle')
    return    <Card
                  style={rootStyle}
                  expandable={true}
                    initiallyExpanded={initiallyExpanded}
              >
                <CardTitle
                  titleStyle={titleStyle}
                  title={title}
                  subtitle={subtitle}
                  showExpandableButton={true}
                  actAsExpander={true}
                />
                <CardText expandable={true}
                          style={cardStyles.text}
                >
                  {children}
                </CardText >
              </Card>
  }
}
class ConceptViewContainer extends Component {
  constructor(props) {
    let {depth, title='CvcNoTitle', } = props
    super(props)
    this.tt = tooltip.registerTooltip('cvc')
  }
  componentDidMount() {
    let {concept_ids, depth, title, wantConcepts, } = this.props
    if (concept_ids && concept_ids.length) {
      /*
      if (concept_ids.length > 100) {
        console.error(`not fetching ${concept_ids.length} concepts`, title)
        return
      }
      */
      wantConcepts(concept_ids)
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
            wantConcepts, conceptFetchStatus, initiallyExpanded=true,
            muitParams,
        } = this.props
    let M = muit(muitParams)
    if ( conceptFetchStatus === 'waiting' ) {
      return  <h4>
                <CircularProgress 
                    //color={muiTheme.palette.accent1Color} 
                  //size={60} thickness={7} 
                />
                Waiting for concepts: {title} - {subtitle} {concept_ids.join(', ')}
              </h4>
    }
    if ( depth > 2 ) {
      console.error('bailing to avoid max stack (depth)',depth, ConceptViewContainer.viewCount )
      return <h5>too deep to display ({depth}: {ConceptViewContainer.viewCount}) {title} - {subtitle}</h5>
    }
    let cnts = cdmCnts( concepts, d=>d)
    let ttcid = this.tt.setContent(cnts.long.map((c,i)=><div key={i}>{c}</div>))
    return  <WrapInCard
                        initiallyExpanded={initiallyExpanded}
                        rootStyle={M('flatButton')}
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
            >
              <ConceptInfoGridList {...{...this.props, title:undefined, subtitle:undefined}} />
            </WrapInCard>
  }
}
ConceptViewContainer = connect(
  (state, props) => {
    let {concepts=[], concept_ids=[],
          depth=0, title, } = props
    let conceptFetchStatus = 'ok'
    if (!concepts.length) {
      if (concept_ids.length) {
        concepts = cncpt.conceptsFromCidsWStubs(state)(concept_ids, false)
      } else {
        concepts = cncpt.concepts(state)
      }
      if (concept_ids.length > concepts.length) {
        conceptFetchStatus = concepts.length ? 'partiallyLoaded' : 'waiting'
      }
    }
    /*
    if (concepts.filter(d=>d.status).length) {
      debugger
    }
    */
    return {
      conceptFetchStatus,
      depth,
      title,
      concepts,
    }
  },
  dispatch=>bindActionCreators(
    _.pick(cncpt,['wantConcepts']), 
    //..._.pick(tooltip,['showTooltip','hideTooltip']), 
  dispatch)
)(ConceptViewContainer)

export {ConceptViewContainer}

/*
const conceptViewAbstract = (conceptSet=[], opts={}) => {
  let view = {
    conceptSet,
  }
  _.map(opts, (val,o) => {
    view = optHandlers[o](val, view)
  })
}
let optHandlers = {}
optHandlers.showIndividual = (bool, view) => {
  if (bool) {
    view = {...view}
    let {conceptSet} = view
    if (conceptSet.length > 1) {
      view.individualConcepts = conceptSet.map(cs=>conceptViewAbstract([cs]))
    }
  }
}
*/
