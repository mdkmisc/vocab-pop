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
import {TooltipWrapper} from 'src/tooltip'
import {AgTable, ConceptTree, } from 'src/components/TableStuff'
import {commify, updateReason,
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from 'src/utils'
import 'src/sass/style.css'

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
export const LinksWithCounts = props => {
  let {cset, depth, M, ttid} = props
  if (M('invisible'))
    return null
  viewCounts.LinksWithCounts++
  let visibility = M('invisible') ? 'hidden' : 'visible'
  let height = M('invisible') ? '0px' : 'auto'
  if (cset.concepts().length > 50) {
    return <ConceptsSummary M={M} cset={cset} />
  }
  return  <div style={{visibility, height}}>
            {
              cset.concepts().map(
                (c,i) => {
                  return <LinkWithCounts key={i}
                            ttid={ttid}
                            M={M}
                            cset={cset.subset([c])}
                            title={c.concept_code}
                            tip={`${c.vocabulary_id}: ${c.concept_name}`}
                        />
                })
            }
          </div>
}
export class LinkWithCounts extends Component {
  render() {
    let {cset, ttid, title, tip, muitParams, M} = this.props
    //let M = muit(muitParams)
    let cnts = cdmCnts(cset, d=>d)
    let href = '#' // should be link to concept focus

    let ttText = _.isString(tip) ? tip : ''
    let ttFancy = tip
    let contents = title
    if (cnts.short.length) {
      contents += ` (${cnts.short.join(', ')})`
      ttText += ` (${cnts.long.join(', ')})`
      ttFancy = <div><div>{tip}</div>{cnts.long.map((c,i)=><div key={i}>{c}</div>)}</div>
    }
    return  (
      <span>
        <TooltipWrapper {...{ttid,ttText,ttFancy, M}} >
          <RaisedButton
            style={M('raisedButton')}
            buttonStyle={M('raisedButton.styleProps.buttonStyle')}
            href={href}
          >
            {contents}
            <Counts cset={cset} M={M}/>
          </RaisedButton>
        </TooltipWrapper>
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
  render() {
    let {cset, relcids, relName, ttid, tip, M,} = this.props
    let href = '#' // should be link to concept focus

    let ttText = _.isString(tip) ? tip : ''
    ttText = `${ttText}${ttText ? ' ' : ''}${relcids.length} ${relName}`
    let contents = `${relcids.length} ${relName}`
    return  (
      <span>
        <TooltipWrapper {...{ttid,ttText,M}} >
          <RaisedButton
            onClick={() => alert('hi')}
            style={M('raisedButton')}
            buttonStyle={M('raisedButton.styleProps.buttonStyle')}
            //href={href}
          >
            {contents}
          </RaisedButton>
        </TooltipWrapper>
      </span>
    )
  }
}
const RelsPeek = props => { // assuming I just have cids, no concepts
  let {cset,title='', depth, maxDepth, ttid} = props
  viewCounts.RelsPeek++
  let M = muit()  // shouldn't have same style as parent, right...don't know sc of rels
  return (
            <div //style={M('raisedButton.container')}
                  //style={{ border: '4px solid green', }}
            >
              Related to:
              { _.map(cncpt.concepts2relsMap(cset.concepts()), (relcids,relName) => (
                  <RelButton {...{cset, relcids, relName, ttid, key:relName,
                                  tip:`tooltip for ${relName}`, M,
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
            _.map(cncpt.concepts2relsMap(cset.concepts()),
                  (relcids,relName) => {
                    //if (!relName.match(/map/i)) return null
                    return <RelView key={relName} 
                              {...{relName, relcids, title,
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
const RelView = ({relName,relcids,depth,maxDepth,title,M,}) => {
  viewCounts.RelView++
  /* only called by RelsPeek (full rels) */
  //let title = `RelView: ${relcids.length} ${relName} concepts: ${relcids.toString()}`
  title = `${title}-->RelView ${relcids.length} ${relName}`
  if (depth > maxDepth) {
    //console.error('bailing from RelView to avoid max stack')
    return <h5>too deep to display {title}</h5>
  }
  throw new Error("broken")
  /*
  return (
    <ConceptViewContainer key={relName} M={M}
      linksWithCounts={true}
      depth={depth}
      maxDepth={maxDepth}
      concept_ids={relcids}
      title={title}
    />
    if (concept_ids && concept_ids.length) {
      //wantConcepts(_.difference(concept_ids,cset.concepts().map(d=>d.concept_id)), {title,depth})
      wantConcepts(concept_ids, {title,depth})
    }
  )
  */
}
class IndividualConceptViews extends Component {
  render() {
    let {cset, depth, maxDepth, Wrapper='div', M,} = this.props
    viewCounts.IndividualConceptViews++
    return  <div>
            { cset.concepts().map((c,i) =>
                <ConceptViewContainer key={i} M={M}
                  depth={depth}
                  maxDepth={maxDepth}
                  {...{
                    initiallyExpanded: false,
                    ...this.props,
                    cset: cset.subset([c]),
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
    //let visibility = M('invisible') ? 'hidden' : 'visible'
    //let height = M('invisible') ? '0px' : 'auto'
              //<div style={{visibility, height}}>
              //</div>
    return  (
              <Card
                  {...M('card.styleProps')}
                  //style={M('card.style')}
                  //containerStyle={M('card.containerStyle')}
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
                  {...M('cardTitle.styleProps')}
                  title={title}
                  subtitle={subtitle}
                  titleStyle={_.isEmpty(title) ? {} : M('cardTitle.title')}
                  subtitleStyle={_.isEmpty(subtitle) ? {} : M('cardTitle.subtitle')}
                  showExpandableButton={true}
                  actAsExpander={true}
                  expandable={false}
                />
                <CardText 
                style={M('cardText.style')}
                  expandable={true} 
                  {...M('cardText.styleProps')} >
                  <div style={M('cardText.children')}>
                    {children}
                  </div>
                </CardText >
              </Card>
    )
  }
}
class ConceptInfoGridList extends Component {
  render() {
    let {
          // title, subtitle, // use in container, not here
          M,
          ttid,
          initiallyExpanded,
          cset,
          linksWithCounts,
        } = this.props
    if (cset.concepts().length < 1)
      return null
    viewCounts.ConceptInfoGridList++

    let scCsets = cset.scCsets()
    if (scCsets.length < 1) {
      debugger
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
    let contents = scCsets.map((scCset,i) => {
      M = M.props({cset:cset.scCset})
      let title = `${scCset.cCount()} ${scCset.scName()}`
      return  <div key={i} style={M('ciglDiv')}>
                { linksWithCounts 
                    ? <LinksWithCounts 
                        ttid={ttid}
                        cset ={scCset}
                        M={M}
                        //titleText={`${titleText} / ${title}`}
                      /> : '' }
                {/* depth > maxDepth
                    ? <div>no RelsPeek: {depth} > {maxDepth}</div>
                    : <div>yes RelsPeek: {depth} &lte; {maxDepth}
                      </div>
                */}
                        <RelsPeek
                                  cset ={scCset}
                                  M={M}
                                  ttid={ttid}
                        />
                { false &&
                  cset.concepts().length > 1
                  ? <WrapInCard initiallyExpanded={false} M={M}
                                title={'Individual Concepts'} >
                      <IndividualConceptViews cset ={scCset} />
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
    let {depth, maxDepth, title} = props
    if (typeof depth === 'undefined' || typeof maxDepth === 'undefined' || depth > maxDepth + 1) {
      //throw new Error(`tried to construct problem CVC: ${depth} / ${maxDepth}, ${sourceTitle} => ${title}`)
    }
    viewCounts.ConceptViewContainer++
    super(props)
    this.ttid = 'cvc'
  }
  componentDidUpdate(prevProps, prevState) {
    let {cset, } = this.props
    if (!cset.concepts().length) {
      return
    }
    if (cset.depth() > cset.maxDepth()) {
      debugger
      return
    }
  }
  render() {
    let {cset, title, subtitle,
            wantConcepts, initiallyExpanded=true,
            muitParams={}, linksWithCounts, M=muit(),
        } = this.props
    M = M.props({cset})
    let cnts = cdmCnts(cset, d=>d)
    let ttText = cnts.long.join(', ')
    let ttFancy = <div>
                  {
                    cnts.long.map((c,i)=><div style={M('tooltip.div')} key={i}>{c}</div>)
                  }
                </div>

    title = title || 
      <span>
        {
          cset.cCount() + ' ' +
          ['dom','voc','cls']
            .map(fld => cset.singleMemberGroupLabel(fld))
            .filter(d=>d)
            .join(', ')
          + ' concepts'
        }
      </span>

    /*
    title = <span>
              {title}
              <TooltipWrapper {...{ttid:this.ttid,ttText,ttFancy, M}} >
                <span style={{fontSize: '.6em',}} >
                  ( <Counts cset={cset} M={M}/> )
                </span>
              </TooltipWrapper>
            </span>
    */
    subtitle= typeof subtitle === 'function' ? subtitle(this.props) : subtitle
    return  (
      <WrapInCard M={M}
                  initiallyExpanded={initiallyExpanded}
                  //muitParams={muitParams}
                  title={title}
                  //subtitle={subtitle}
      >
        <RelsPeek cset={cset} ttid={this.ttid} />
        <Counts cset={cset} M={M}/>

        {/* not going to use this now... maybe come back to it */}
        <div style={{zoom:.4, opacity: 0.4, backgroundColor:'orange'}}>
          <ConceptInfoGridList {...{ ...this.props, M, title:undefined, subtitle:undefined, ttid: this.ttid, }} />
        </div>
      </WrapInCard>
    )
  }
}
const sFmt = d3.format('.2s')
export const Counts = props => {
  let {cset, M} = props
  return  (
      <RaisedButton
        style={M('raisedButton')}
        buttonStyle={M('raisedButton.styleProps.buttonStyle')}
        //href={href}
      >
        <span>
          {
            cset.cdmCnts().map(cnt=>`${sFmt(cnt.cnt)} ${cncpt.conceptTableAbbr(cnt.tbl)}`)
              .join(', ')
          }
        </span>
      </RaisedButton>
  )
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
export const cdmCnts = (cset, join=d=>d.join(', ')) => {
  return {
    short: join(cset.cdmCnts().map(fmtCdmCnt('short'))),
    long: join(cset.cdmCnts().map(fmtCdmCnt('long'))),
  }
}
export const ConceptsSummary = props => {
  let {cset, M} = props
  M = M.props({cset})
  let cnts = cdmCnts( cset, d=>d)
  let sg = _.supergroup(cset.concepts(), ['domain_id','vocabulary_id','concept_class_id'])
  console.log(M.desc())
  return  <div >
            Concepts Summary for {cset.concepts().length} concepts
            <pre style={M('randomDiv')}>
              {JSON.stringify(cnts)} {'\n\n'}
              {sg.leafNodes().namePaths().join('\n')}
                    ( <Counts cset={cset} M={M}/> )
            </pre>
          </div>
}
ConceptViewContainer = connect(
  (state, props) => {
    return {}
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
