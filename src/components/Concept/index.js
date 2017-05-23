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
//if (DEBUG) window.d3 = d3
import SortableTree from 'react-sortable-tree'

import Badge from 'material-ui/Badge'
import {GridList, GridTile} from 'material-ui/GridList'
import IconButton from 'material-ui/IconButton'
import Subheader from 'material-ui/Subheader'
import CircularProgress from 'material-ui/CircularProgress'
import StarBorder from 'material-ui/svg-icons/toggle/star-border'
import ExpandMore from 'material-ui/svg-icons/navigation/expand-more'
import ExpandLess from 'material-ui/svg-icons/navigation/expand-less'
import FileDownload from 'material-ui/svg-icons/file/file-download'


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
  RelsView: 0,
  IndividualConceptViews: 0,
  WrapInCard: 0,
  ConceptInfoGridList: 0,
  ConceptViewContainer: 0,
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
  render() {
    viewCounts.WrapInCard++
    let { children,
          title,
          subtitle,
          initiallyExpanded=false,
          M,
        } = this.props
    return  (
              <Card
                  {...M('card.styleProps')}
                  initiallyExpanded={initiallyExpanded}
              >
                <CardTitle
                  {...M('cardTitle.styleProps')}
                  title={title}
                  subtitle={subtitle}
                  titleStyle={_.isEmpty(title) ? {} : M('cardTitle.title')}
                  subtitleStyle={_.isEmpty(subtitle) ? {} : M('cardTitle.subtitle')}
                  showExpandableButton={true}
                  //actAsExpander={true}
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
class ConceptViewContainer extends Component {
  constructor(props) {
    let {depth, maxDepth, title} = props
    if (typeof depth === 'undefined' || typeof maxDepth === 'undefined' || depth > maxDepth + 1) {
      //throw new Error(`tried to construct problem CVC: ${depth} / ${maxDepth}, ${sourceTitle} => ${title}`)
    }
    viewCounts.ConceptViewContainer++
    super(props)
    let {cset} = props
    let showRel = cset.showRelFunc()
    this.state = {
      showRel: rel => showRel(rel.prop('relationship')),
      showRels: showRel(),
      toggleShowRel: (rel) => {
        showRel(rel.prop('relationship'), !rel.shouldThisShow(showRel))
        this.setState({showRels:showRel()}) // just to force update
      },
    }
  }
  componentDidMount() {
    this.setState({
      ttid: 'cvc',
    })
  }
  render() {
    let {cset, title, subtitle,
            wantConcepts, initiallyExpanded=true,
            muitParams={}, M=muit(),
        } = this.props
    let {toggleShowRel, showRel, ttid} = this.state
    M = M.props({cset})
    let countsM = M.props({cset})
      //,global:{zoom:.6}, override:{raisedButton:{style:{marginLeft:30}}}
    title = title || cset.fancyDesc()
    subtitle = 
      typeof subtitle === 'function' 
        ? subtitle(this.props) 
        : subtitle || <span>
                        {
                          cset.conCnt() + ' ' + 
                          ['dom','voc','cls']
                            .map(fld => cset.singleMemberGroupLabel(fld))
                            .filter(d=>d)
                            .join(', ')
                          + ' concepts'
                        }
                        <span style={{
                          marginLeft: 20, zoom:.8,
                        }} >
                          <Counts cset={cset} M={countsM} ttid={ttid} />
                        </span>
                      </span>
    return  (
      <WrapInCard M={M}
                  initiallyExpanded={initiallyExpanded}
                  title={title}
                  subtitle={subtitle}
      >
        <RelsView cset={cset} ttid={ttid} 
            toggleShowRel={toggleShowRel}
            showRel={showRel}
        />
        <div style={{zoom:.3, opacity: 0.4, backgroundColor:'orange'}}>
          <br/> <br/>
          <ConceptsSummary M={M} cset={cset} />
          {/* not going to use this now... maybe come back to it 
          <ConceptInfoGridList {...{ ...this.props, M, title:undefined, subtitle:undefined, ttid: this.ttid, }} /> */}
        </div>
      </WrapInCard>
    )
  }
}
const sFmt = d3.format('.2s')
export const Counts = props => {
  let {cset, M, ttid, } = props
  let cnts = cset.cdmCnts()
  let ttText = cnts.map(fmtCdmCnt('long')).join(', ')
  let ttFancy = <div>{
                  cnts
                    .map(fmtCdmCnt('long'))
                    .map((c,i) => <div style={M('tooltip.div')} key={i}>{c}</div>)
                }</div>
  let buttonContent = cnts.map(fmtCdmCnt('short')).join(', ')
  return <TipButton {...{ttid,ttText,ttFancy, M, buttonContent}} />
}
export const TipButton = props => {
  let {ttid, ttText, ttFancy, buttonContent, M, href, buttonProps} = props
  return  <TooltipWrapper {...{ttid,ttText,ttFancy, M}} >
            <RaisedButton
              {...M('raisedButton.styleProps')}
              style={M('raisedButton.style')}
              //href={href}
              {...buttonProps}
            >
              <span>
                {buttonContent}
              </span>
            </RaisedButton>
          </TooltipWrapper>

}
export class RelButton extends Component {
  render() {
    let {cset, ttid, M, toggleShowRel, shouldShow} = this.props // this is cset for the rel
    //let {relName, relcids} = rel
    //let href = '#' // should be link to concept focus

    let status = cset.status()
    let ttText = status.msg
    let buttonContent = status.status === 'not determined' || status.status === 'loading'
        ? <CircularProgress size={20} 
            {...M('circularProgress.styleProps')}
          /> 
        : null
    let buttonProps = {
      onClick:() => {
        cset.loadConcepts()
        toggleShowRel(cset)
      },
      //label: cset.fancyDesc(),
      label: `${cset.cidCnt()} ${cset.shortDesc()}`,
      /*/
      label: <span>{cset.cidCnt()} {cset.shortDesc()}
      <span aria-hidden="true" data-icon="&#xe90a;" className="icon-link"></span>
                </span>,
      */
      labelPosition: 'before',
      icon: (status.status === 'not requested' && <FileDownload/>) ||
            (status.status === 'loaded' && (shouldShow ? <ExpandLess/> : <ExpandMore/>)),
      secondary: true,
    }
    return <TipButton {...{ttid,ttText,M, buttonContent, buttonProps}} />
  }
}
const RelsView = props => { // assuming I just have cids, no concepts
  let {cset,title='', depth, maxDepth, ttid, toggleShowRel, showRel} = props
  viewCounts.RelsView++
  let M = muit()  // shouldn't have same style as parent, right...don't know sc of rels
  return (
    <div>
      <div style={M('raisedButton.parentDiv')} >
        <div style={M('headerLight')}>Related Concepts</div>
        { _.map(cset.rels(), (rel,i) => {
            let shouldShow = !!showRel(rel)
            return <RelButton cset={rel} ttid={ttid} M={M} key={i} 
                      toggleShowRel={toggleShowRel} shouldShow={shouldShow} />
        })}
      </div>
      { _.map(cset.rels(), (rel,i) => {
        let shouldShow = !!showRel(rel)
        return shouldShow ? <ConceptViewContainer key={i} cset={rel} /> : null
      })}
    </div>
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
export const ConceptsSummary = props => {
  let {cset, M} = props
  M = M.props({cset})
  let cnts = cset.cdmCnts()
  let sg = _.supergroup(cset.concepts(), ['domain_id','vocabulary_id','concept_class_id'])
  let countsM = M.props({cset,
                            //global:{zoom:.6}, 
                            //override:{raisedButton:{style:{marginLeft:30}}}
                        })
  return  <div style={{zoom:.4}}>
            Concepts Summary for {cset.concepts().length} concepts
            <pre style={M('randomDiv')}>
              {JSON.stringify(cnts)} {'\n\n'}
              {sg.leafNodes().namePaths().join('\n')}
                    ( <Counts cset={cset} M={M}/> )
                  (<Counts cset={cset} M={countsM} />)
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
