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

window.viewCounts = {
  LinksWithCounts: 0,
  RelsPeek: 0,
  RelView: 0,
  IndividualConceptViews: 0,
  WrapInCard: 0,
  ConceptInfoGridList: 0,
  ConceptViewContainer: 0,
}
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
  let {concepts, depth, M, ttid} = props
  if (M('invisible'))
    return null
  viewCounts.LinksWithCounts++
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
                            ttid={ttid}
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
export class LinkWithCounts extends Component {
  componentDidUpdate() {
    let {concepts, ttid, title, tip, muitParams, M} = this.props
    //let M = muit(muitParams)
    let cnts = cdmCnts(concepts, d=>d)
    let href = '#' // should be link to concept focus

    let ttText = _.isString(tip) ? tip : ''
    let ttFancy = tip
    if (cnts.short.length) {
      ttText += ` (${cnts.long.join(', ')})`
      ttFancy = <div><div>{tip}</div>{cnts.long.map((c,i)=><div key={i}>{c}</div>)}</div>
    }
    tooltip.ttContentConnected({ttid, ttText, ttFancy})
  }
  render() {
    let {concepts, ttid, title, tip, muitParams, M} = this.props
    //let M = muit(muitParams)
    let cnts = cdmCnts(concepts, d=>d)
    let href = '#' // should be link to concept focus

    let ttText = _.isString(tip) ? tip : ''
    let contents = title
    if (cnts.short.length) {
      contents += ` (${cnts.short.join(', ')})`

      ttText += ` (${cnts.long.join(', ')})`
    }
    return  (
      <span>
        <RaisedButton
          style={M('raisedButton')}
          buttonStyle={M('raisedButton.styleProps.buttonStyle')}
          href={href}
          data-tip
          data-for={ttid}
          data-tttext={ttText}
        >
          {contents}
        </RaisedButton>
      </span>
    )
  }
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
export class RelButton extends Component {
  componentDidMount() {
    this.makeTip()
  }
  makeTip() {
    let {relcids, relName, ttid, tip, } = this.props
    let href = '#' // should be link to concept focus

    let ttText = _.isString(tip) ? tip : ''
    ttText = `${ttText}${ttText ? ' ' : ''}${relcids.length} ${relName}`
    tooltip.ttContentConnected({ttid, ttText})
  }
  componentDidUpdate(nextProps) {
    this.makeTip()
  }

  render() {
    let {relcids, relName, ttid, tip, M,} = this.props
    let href = '#' // should be link to concept focus

    let ttText = _.isString(tip) ? tip : ''
    ttText = `${ttText}${ttText ? ' ' : ''}${relcids.length} ${relName}`

    let contents = `${relcids.length} ${relName}`
    return  (
      <span>
        <RaisedButton
          style={M('raisedButton')}
          buttonStyle={M('raisedButton.styleProps.buttonStyle')}
          //href={href}
          data-tip
          data-for={ttid}
          data-tttext={ttText}
        >
          {contents}
        </RaisedButton>
      </span>
    )
  }
}
const RelsPeek = props => { // assuming I just have cids, no concepts
  let {concepts=[],title='', sc, depth, maxDepth, M, sourceTitle, ttid} = props
  viewCounts.RelsPeek++
  if (!_.includes(['S','C','X'], sc.toString() )) {
    //debugger
  }
  M = M.props({sc})
  return (
            <div //style={M('raisedButton.container')}
                  //style={{ border: '4px solid green', }}
            >
              { _.map(cncpt.concepts2relsMap(concepts), (relcids,relName) => (
                  <RelButton {...{relcids, relName, ttid, key:relName,
                                  tip:sourceTitle, M,
                                }} />))
              }
            </div>
  )
  if (depth > maxDepth) {
  }
  return <div>
          full rels instead of peek, depth: {depth} &lt; {maxDepth}
          {
            //Rels:
            _.map(cncpt.concepts2relsMap(concepts),
                  (relcids,relName) => {
                    //if (!relName.match(/map/i)) return null
                    return <RelView key={relName} 
                              {...{relName, relcids, title, sourceTitle,
                                  depth, maxDepth, M, }}
                            />
                  })
          }
        </div>
  /*
  */
/*
                    */
}
const RelView = ({relName,relcids,depth,maxDepth,title,sourceTitle,M,}) => {
  viewCounts.RelView++
  /* only called by RelsPeek (full rels) */
  //let title = `RelView: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  title = `${title}-->RelView ${relcids.length} ${relName}`
  if (depth > maxDepth) {
    //console.error('bailing from RelView to avoid max stack')
    return <h5>too deep to display {title}</h5>
  }
  return (
    <ConceptViewContainer key={relName} M={M}
      linksWithCounts={true}
      depth={depth}
      maxDepth={maxDepth}
      concept_ids={relcids}
      title={title}
      sourceTitle={sourceTitle}
    />
  )
}
class IndividualConceptViews extends Component {
  render() {
    let {concepts=[], depth, maxDepth, Wrapper='div', M,} = this.props
    viewCounts.IndividualConceptViews++
    return  <div>
            { concepts.map((c,i) =>
                <ConceptViewContainer key={i} M={M}
                  depth={depth}
                  maxDepth={maxDepth}
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
    viewCounts.WrapInCard++
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
  render() {
    let {
          // title, subtitle, // use in container, not here
          M,
          ttid,
          depth,
          maxDepth,
          initiallyExpanded,
          concepts=[],
          linksWithCounts,
          titleText,
          sourceTitle,
        } = this.props
    if (concepts.length < 1)
      return null

    viewCounts.ConceptInfoGridList++

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
      M = M.props({sc})
      let title = `${sc.records.length} ${cncpt.scName(sc.records[0])}`
      return  <div key={i} style={M('ciglDiv')}>
                { linksWithCounts 
                    ? <LinksWithCounts 
                        ttid={ttid}
                        concepts={sc.records}
                        sc={sc}
                        M={M}
                        depth={depth} 
                        sourceTitle={sourceTitle}
                        //titleText={`${titleText} / ${title}`}
                      /> : '' }
                {/* depth > maxDepth
                    ? <div>no RelsPeek: {depth} > {maxDepth}</div>
                    : <div>yes RelsPeek: {depth} &lte; {maxDepth}
                      </div>
                */}
                        <RelsPeek concepts={sc.records}
                                  sc={sc}
                                  M={M}
                                  ttid={ttid}
                                  depth={depth} 
                                  maxDepth={maxDepth} 
                                  sourceTitle={sourceTitle}
                                  //sourceTitle={`${titleText} / ${title}`}
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
    let {depth, maxDepth, title='CvcNoTitle', sourceTitle} = props
    if (typeof depth === 'undefined' || typeof maxDepth === 'undefined' || depth > maxDepth + 1) {
      throw new Error(`tried to construct problem CVC: ${depth} / ${maxDepth}, ${sourceTitle} => ${title}`)
    }
    viewCounts.ConceptViewContainer++
    super(props)
    this.state = {
      M: props.M || muit(),
      ttid: 'cvc',
    }
  }
  componentDidMount() {
    let {concepts, concept_ids, depth, title, subtitle,
            wantConcepts, conceptFetchStatus, initiallyExpanded=true,
            muitParams={}, linksWithCounts, invisible,
        } = this.props
    if (concept_ids && concept_ids.length) {
      //wantConcepts(_.difference(concept_ids,concepts.map(d=>d.concept_id)), {title,depth})
      wantConcepts(concept_ids, {title,depth})
    }
  }
  componentDidUpdate(prevProps, prevState) {
    let {concepts, concept_ids, depth, maxDepth, title, subtitle,
            wantConcepts, conceptFetchStatus, initiallyExpanded=true,
            muitParams={}, linksWithCounts, invisible,
        } = this.props
    if (!concepts.length) {
      return
    }
    let {M, ttid} = this.state
    if (depth > maxDepth) {
      return
    }
    invisible = M('invisible') || invisible
    M = M.props({...muitParams, invisible})
    let cnts = cdmCnts( concepts, d=>d)
    if (!cnts.short.length) {
      return
    }
    let ttText = cnts.long.join(', ')
    let ttFancy = <div>
                  {
                    cnts.long.map((c,i)=><div style={M('tooltip.div')} key={i}>{c}</div>)
                  }
                </div>
    tooltip.ttContentConnected({ttid, ttText, ttFancy})
  }
  render() {
    let {concepts, concept_ids, depth, maxDepth, title, subtitle,
            wantConcepts, conceptFetchStatus, initiallyExpanded=true,
            muitParams={}, linksWithCounts,
        } = this.props
    let {M, ttid} = this.state
    let cnts = cdmCnts(concepts, d=>d)
    let ttText = cnts.long.join(', ')
    /*
    if (!_.isEqual(cnts, cdmCnts(concepts,d=>d))) {
    }
    if (!cnts.short.length && depth === 0 && concepts.length > 5) {
      console.log(cdmCnts( concepts, d=>d))
      debugger
    }
    */
    /*
    let surroundSubtitle = false
    if (subtitle && surroundSubtitle) {
      subtitle = <div style={M('card.title.subtitle.surround')} >{subtitle}</div>
    }
    */
    //return <ConceptInfoGridList {...{...this.props, title:undefined, subtitle:undefined}} />
    title = <span>
              {title}, Depth: {depth} / {maxDepth},
              <span >
                <span style={{fontSize: '.6em',}}
                  data-tip
                  data-for={ttid}
                  data-tttext={ttText}
                >
                  ({JSON.stringify(cnts)})
                  ({cnts.short.join(', ')})
                  <br/>
                  Got {(concepts||[]).length} of {(concept_ids||[]).length} concepts
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
        <ConceptInfoGridList 
          {...{
            ...this.props, 
            M, title:undefined, subtitle:undefined, ttid,
          }} />
      </WrapInCard>
    )
  }
}
ConceptViewContainer = connect(
  (state, props) => {
    let {concepts=[], concept_ids=[],
          depth=0, maxDepth=2,
          title, 
          sourceTitle, titleText, // confusingly named
    } = props
    titleText = titleText || title
    if (!_.isString(titleText)) {
      debugger
      throw new Error('string titleText required')
    }
    if (!_.isString(sourceTitle)) {
      debugger
      throw new Error('string sourceTitle required')
    }
    depth++
    sourceTitle = `${sourceTitle}(${depth-1}) => ${titleText}(${depth})`
    let conceptFetchStatus = 'ok'
    if (!concepts.length) {
      if (concept_ids.length) {
        //concepts = cncpt.conceptsFromCidsWStubs(state)(concept_ids, false)
        concepts = cncpt.conceptsFromCids(state)(concept_ids, false)
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
    //let requests = cncpt.requests(state)
    /*
    if (depth > 0 && requests.requests.length > 1 && !requests.want.length
          &&cncpt.concepts(state).length > 95
          )
      debugger
     console.log(depth, props)
      */
    return {
      conceptFetchStatus,
      depth,
      maxDepth,
      title,
      concepts,
      titleText,
      sourceTitle,
    }
  },
  dispatch=>bindActionCreators(
    _.pick(cncpt,['wantConcepts']),
    //..._.pick(tooltip,['showTooltip','hideTooltip']),
  dispatch)
)(ConceptViewContainer)

export {ConceptViewContainer}

export const ConceptStatusReport = ({lines=[], M}) => {
  M = M || muit()
  if (!lines.length)
    return <div>GOT NO STATUS!!</div>
  lines = lines.concat(_.map(viewCounts, (v,k)=>`${k}: ${v}`))
  let cols = 3
  let linesPerCol = Math.ceil(lines.length / cols)
  return (<div style={{
                  ...M('grid.parent'),
                  backgroundColor:'white',
                  justifyContent: 'auto',
                  padding: 10,
                }}>
            Concept fetch status
            <GridList 
              {...M('grid.styleProps')}
              style={{...M('grid.gridList.horizontal'),
                        padding:0, margin: 0,
                      }} cols={3}
            >
              {_.range(cols).map(col => {
                col = parseInt(col)
                return (<GridTile style={{
                                ...M('grid.tile.plain'),
                                padding:0, margin: 0,
                              }} key={col} >
                          <pre style={{border: 'none',}} >
                            {lines.slice(col * linesPerCol, (col+1) * linesPerCol).join('\n')}
                          </pre>
                        </GridTile>)})}
            </GridList>
          </div>
  )
}
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
