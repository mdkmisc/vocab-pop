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
  tile: (M=muit()) => {
    return {
            //zoom: 0.8,
            backgroundColor: M.color('light'),
            background: `linear-gradient(to top,
                                          ${M.color('light')} 0%,
                                          ${M.color('regular')} 70%,
                                          ${M.color('dark')} 100%)`,
            width: '100%',
            //minHeight: 100,
          }
  },
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
/*
const junkTile = i =>
                  <GridTile style={gridStyles.tile()} key={i}>
                    <div style={gridStyles.child} >
                      <h3>placeholder</h3>
                    </div>
                  </GridTile>
*/
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
export const ConceptsSummary = props => {
  let {concepts, M} = props
  let cnts = cdmCnts( concepts, d=>d)
  let sg = _.supergroup(concepts, ['domain_id','vocabulary_id','concept_class_id'])
  return  <div style={M('randomDiv')}>
            Concepts Summary for {concepts.length} concepts
            <pre style={M('randomDiv')}>
              {JSON.stringify(cnts)} {'\n\n'}
              {sg.leafNodes().namePaths().join('\n')}
            </pre>
          </div>
}
export const LinksWithCounts = props => {
  let {concepts, depth, M} = props
  if (M('invisible'))
    return null
  let visibility = M('invisible') ? 'hidden' : 'visible'
  let height = M('invisible') ? '0px' : 'auto'
  if (concepts.length > 30) {
    return <ConceptsSummary M={M} concepts={concepts} />
  }
  return  <div style={{visibility, height}}>
            {
              concepts.map(
                (c,i) => {
                  return <LinkWithCounts key={i}
                            M={M}
                            //muitParams={{sc:c.standard_concept}}
                            concepts={[c]}
                            title={c.concept_code}
                            tip={`${c.vocabulary_id}: ${c.concept_name}`}
                        />
                })
            }
          </div>
}
export const LinkWithCounts = props => {
  let {concepts, ttid, title, tip, muitParams, M} = props
  //let M = muit(muitParams)
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
      <RaisedButton
        style={M('raisedButton')}
        buttonStyle={M('raisedButton.styleProps.buttonStyle')}
        href={href}
        data-tip
        data-for="cvc"
        data-ttcid={ttcid}
      >
        {contents}
      </RaisedButton>
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
const colname = cnt => {
  let cn = `${cnt.tbl}.${cnt.col}`
  //console.log(cn)
  return cn
}
const RelsPeek = props => { // assuming I just have cids, no concepts
  let {concepts=[],title='', sc, depth, M} = props
  if (!_.includes(['S','C','X'], sc.toString() )) {
    //debugger
  }
  M.props({sc})
  return <div>full rels instead of peek<br/>
                  {
                    //Rels:
                    _.map(cncpt.concepts2relsMap(sc.records), // sc.records === concepts
                          (relcids,relName) => {
                            if (!relName.match(/map/i)) return null
                            return <RelView key={relName}
                                      {...{relName, relcids, depth, M, }}
                            />
                          })
                  }
        </div>
  /*
  */
  return (
            <div //style={M('raisedButton.container')}
                  //style={{ border: '4px solid green', }}
            >
              { _.map(cncpt.concepts2relsMap(concepts), (relcids,relName) => (
                  <span key={relName} >
                    <RaisedButton 
                      style={M('raisedButton')}
                      buttonStyle={M('raisedButton.styleProps.buttonStyle')}
                      //    line above is sort of equivalent to line below
                      //{...M('raisedButton').styleProps}
                      //labelColor={'blue'}
                      //backgroundColor={'green'}
                      primary={true}
                      //style={{backgroundColor:'yellow'}}
                      //labelStyle={{...M('raisedButton').styleProps}}
                      //href={href}
                      //data-tip
                      //data-for="cvc"
                      //data-ttcid={ttcid}
                      //label={ `${title} ${relcids.length} ${relName}` }
                    >
                      {title}
                      {relcids.length} {relName}
                    </RaisedButton>
                  </span>))
              }
            </div>
  )
/*
                    */
}
const RelView = ({relName,relcids,depth,M,}) => {
  /* only called by RelsPeek (full rels) */
  let title = `RelView: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  if (depth > 2) {
    console.error('bailing from RelView to avoid max stack')
    return null//<h5>too deep to display ({depth}) {title}</h5>
  }
  return (
    <ConceptViewContainer key={relName} M={M}
      linksWithCounts={true}
      depth={depth + 1}
      concept_ids={relcids}
      title={`From RelView: ${relcids.length} ${relName} concepts`}
    />
  )
}
class IndividualConceptViews extends Component {
  render() {
    const {concepts=[], depth, Wrapper='div', M,} = this.props
    return  <div>
            { concepts.map((c,i) =>
                <ConceptViewContainer key={i} M={M}
                  {...{
                    initiallyExpanded: false,
                    ...this.props,
                    concepts: [c],
                    title: c.concept_name,
                    subtitle: `individual concept ${c.vocabulary_id} ${c.concept_code}`,
                  }}
                />)
            }
            </div>
  }
}
class WrapInCard extends Component {
  /*
   * things that call this: 
   *    - SplitIntoScs: <WrapInCard ... />
   */
  render() {
    let { children,
          title,
          subtitle,
          initiallyExpanded=false,
          M,
          /*
          containerStyle,
          rootStyle,
          titleStyle,
          titleTitleStyle,
          titleSubtitleStyle,
          textStyle,
                rootStyle = rootStyle || 'plainRoot'
                titleStyle = titleStyle || M('card.title')
                subtitleStyle = subtitleStyle || M('card.subtitle')
          */

        } = this.props
    let visibility = M('invisible') ? 'hidden' : 'visible'
    let height = M('invisible') ? '0px' : 'auto'
    return  (
              <div style={{visibility, height}}>
              <Card
                  style={M('card.style')}
                  containerStyle={M('card.containerStyle')}
                  initiallyExpanded={initiallyExpanded}
              >
                {/*    from stsreport, top level
                <CardHeader style={{
                    padding:'10px 8px 0px 8px'
                  }}
                  actAsExpander={true}
                  showExpandableButton={true}
                  title={<h4>Source Target Source Report</h4>}
                />
                */}
                <CardTitle
                  title={title}
                  subtitle={subtitle}

                  style={M('card.title')}

                  titleStyle={_.isEmpty(title) ? {} : M('card.title.title')}
                  titleColor={M('card.title.title').color}

                  subtitleStyle={_.isEmpty(subtitle) ? {} : M('card.title.subtitle')}
                  subtitleColor={M('card.title.subtitle').color}

                  showExpandableButton={true}
                  actAsExpander={true}
                  expandable={false}
                />
                <CardText expandable={true}
                          style={M('card.text')}
                          color={M('card.text').color}
                >
                  {children}
                </CardText >
              </Card>
              </div>
    )
  }
}
class ConceptInfoGridList extends Component {
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let {
          // title, subtitle, // use in container, not here
          M,
          depth,
          initiallyExpanded,
          concepts=[],
          linksWithCounts,
        } = this.props
    if (concepts.length < 1)
      return null


    let bySc = cncpt.conceptsBySc(concepts) // just supergroups by 'standard_concept'
                  //.filter(sc=>cncpt.rcsFromConcepts(sc.records))

    if (bySc.length < 1) {
      return null
    }
    /*
    if (bySc.length === 1) {
      //return <div>{children}</div>
      let sc = bySc[0]
      let muitParams = {sc}
      let M = muit(muitParams)
      return  enhanceChildren(children, { concepts, muitParams, sc, depth }, M)
    }
    */
    let contents = bySc.map((sc,i) => {
      M.props({sc})
      let title = `${sc.records.length} ${cncpt.scName(sc.records[0])}`
      return  <div key={i} style={M('ciglDiv')}>
                { linksWithCounts 
                    ? <LinksWithCounts 
                        concepts={sc.records}
                        sc={sc}
                        M={M}
                        depth={depth} 
                      /> : '' }
                <RelsPeek concepts={sc.records}
                          sc={sc}
                          M={M}
                          depth={depth} 
                />
                { false &&
                  concepts.length > 1
                  ? <WrapInCard initiallyExpanded={false} M={M}
                                title={'Individual Concepts'} >
                      <IndividualConceptViews concepts={sc.records} />
                    </WrapInCard>
                  : null
                }
              </div>
    })
    let visibility = M('invisible') ? 'hidden' : 'visible'
    return  <div style={{visibility}}>
              {contents}
            </div>
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
      wantConcepts(concept_ids, {title,depth})
    /*
      if (concept_ids.length > 200) {
        //debugger
        console.error(`not fetching ${concept_ids.length - 50} concepts`, title)
        //return
        wantConcepts(concept_ids.slice(0,50))
      } else {
        wantConcepts(concept_ids)
      }
    */
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
            muitParams={}, linksWithCounts, M, invisible,
        } = this.props
    M = M || muit()
    invisible = M('invisible') || invisible
    M.props({...muitParams, invisible})
    if ( depth > 2 ) {
      console.error('bailing to avoid max stack (depth)',depth, ConceptViewContainer.viewCount )
      return <h5>too deep to display ({depth}: {ConceptViewContainer.viewCount}) {title} - {subtitle}</h5>
    }
    let cnts = cdmCnts( concepts, d=>d)
    let ttcid = this.tt.setContent(cnts.long.map((c,i)=><div key={i}>{c}</div>))

    /*
    let surroundSubtitle = false
    if (subtitle && surroundSubtitle) {
      subtitle = <div style={M('card.title.subtitle.surround')} >{subtitle}</div>
    }
    */
    //return <ConceptInfoGridList {...{...this.props, title:undefined, subtitle:undefined}} />
    title = <span>
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
    subtitle= typeof subtitle === 'function' ? subtitle(this.props) : subtitle
    return  (
      <WrapInCard M={M}
                  initiallyExpanded={initiallyExpanded}
                  //muitParams={muitParams}
                  title={title}
                  subtitle={subtitle}
      >
        <ConceptInfoGridList {...{...this.props, M, title:undefined, subtitle:undefined}} />
      </WrapInCard>
    )
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
