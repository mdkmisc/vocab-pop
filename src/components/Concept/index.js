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
class IndividualConceptViews extends Component {
  render() {
    throw new Error("component needs updating")
    let {cset, M,} = this.props
    viewCounts.IndividualConceptViews++
    return  <div>
            { cset.concepts().map((c,i) =>
                <ConceptViewContainer key={i} M={M}
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
const sFmt = d3.format('.2s')
export const Counts = props => {
}
const CdmCntsButtons = props => {
  let {cset, M, ttid, } = props

  let sgVal = cset.sgVal()
  let withCdm = cncpt.groups(sgVal, 'withCdm')
  let cdmCnts = '0 in CDM'
  let buttons = _.flatten(
    withCdm.map((grp,i)=>{
      let cnts = cncpt.cdmCnts(grp)
      if (cnts.length) {
        return cnts.map((cnt,j)=>{
          let buttonContent = `${grp.records.length} ${grp}: ` +
                              cnts.map(fmtCdmCnt('short')).join(', ')
          let ttText = cnts.map(fmtCdmCnt('long')).join(', ')
          let ttFancy = <div>{
                          cnts
                            .map(fmtCdmCnt('long'))
                            .map((c,i) => <div style={M('tooltip.div')} key={i}>{c}</div>)
                        }</div>
          if (!ttid) debugger
          return <TipButton {...{key:`${i}:${j}`,ttid,ttText,ttFancy, M, buttonContent}} />
        })
      } else {
        let buttonContent = `${grp.records.length} ${grp}`
        let ttText = cnames(grp)
        if (!ttid) debugger
        return <TipButton {...{key:'nocnt',ttid,ttText,M, buttonContent}} />
      }
    })
  )
  return <span className="cdmcnts">{buttons}</span>
  /*
  if (withCdm.lookup('CDM Recs')) {
    cdmCnts = <span>{ withCdm.lookup('CDM Recs').records.length } in CDM
                <Counts cset={cset} M={M} ttid={ttid} />
              </span>
  }
  let cnts = cset.cdmCnts()
  let ttText = cnts.map(fmtCdmCnt('long')).join(', ')
  let ttFancy = <div>{
                  cnts
                    .map(fmtCdmCnt('long'))
                    .map((c,i) => <div style={M('tooltip.div')} key={i}>{c}</div>)
                }</div>
  let buttonContent = cnts.map(fmtCdmCnt('short')).join(', ')
  if (!ttid) debugger
  return <TipButton {...{ttid,ttText,ttFancy, M, buttonContent}} />
  */
}
const groupLabel = props => {
  let {cset, M, ttid,key='groupLabel'} = props
  let sgVal = cset.sgVal()
  let sc = cncpt.singleMemberGroupLabel(sgVal,'sc')

  if (sc) {
    M = M.props({sub:sc})
  }
  return (<span key={key}>
            {
              cset.conCnt() + ' ' + 
              ['dom','voc','cls']
                .map(fld => cncpt.singleMemberGroupLabel(sgVal,fld))
                .filter(d=>d)
                .join(', ')
              + ' concepts'
            }
            <span style={{
              marginLeft: 20, zoom:.8,
            }} >
              <CdmCntsButtons key={key} cset={cset} M={M} ttid={ttid} />
              {
                cset.subgrpCnts(['dom','cls','rels']).map((sgf,i)=> {
                  //debugger
                  return <TipButton {...{
                                tipProps: {"data-type":'info',},
                                key:i,
                                ttid,
                                ttText:
                                  sgf.fld + ':\n' +
                                  sgf.sg.leafNodes()
                                    .map(d=>`${d.records.length} ${d.namePath()}`)
                                    .join('\n'),
                                ttFancy:
                                  <div className="grouplabel-tip"
                                            style={{
                                              padding:0,margin:0,lineHeight:'.5em',
                                              zoom:.4,
                                            }}
                                  >
                                    <h4>{sgf.fld}</h4>
                                    <List style={{
                                        padding:0,margin:0,lineHeight:'.5em',
                                    }}>
                                      { sgf.sg.leafNodes().map((d,i)=>
                                          <ListItem key={i}
                                            style={{
                                              padding:0,margin:0,lineHeight:'.5em',
                                              zoom:.4,
                                            }}
                                            primaryText={
                                              `${d.records.length} ${d.namePath()}`
                                            }
                                          />)
                                      }
                                    </List>
                                  </div>,
                                M, 
                                buttonContent: sgf.title}} />
                })
              }
            </span>
          </span>
  )
  //,global:{zoom:.6}, override:{raisedButton:{style:{marginLeft:30}}}
}
export class ConceptViewContainer extends Component {
  constructor(props) {
    viewCounts.ConceptViewContainer++
    super(props)
    let {cset} = props
    this.state = {
      relsExpanded: {},
      ttid: 'cvc' || props.ttid,
    }
  }
  isExpanded = reldim => !!this.state.relsExpanded[reldim]
  expandRel = reldim => this.setState({...this.state, relsExpanded: {...this.state.relsExpanded, [reldim]: true}})
  collapseRel = reldim => this.setState({...this.state, relsExpanded: {...this.state.relsExpanded, [reldim]: false}})
  toggleRelExpanded = reldim => {
    //debugger
    this.setState({...this.state, relsExpanded: {...this.state.relsExpanded, [reldim]: !this.state.relsExpanded[reldim]}})
  }
  


  componentDidMount() {
    //this.setState({ ttid: 'cvc', })
  }
  render() {
    let {cset, title, subtitle,
            wantConcepts, initiallyExpanded=true,
            muitParams={}, M=muit(),
        } = this.props
    let {ttid} = this.state
    if (!ttid) debugger
    M = M.props({cset})
    title = title || cset.fancyDesc()
    subtitle = groupLabel({cset, M, ttid})
          
    /*
            <RelButtons cset={cset} ttid={ttid} 
                toggleRelExpanded={this.toggleRelExpanded}
                isExpanded={this.isExpanded}
            />
    */
    return  (
      <Card
          {...M('card.styleProps')}
          initiallyExpanded={initiallyExpanded}
      >
        <CardTitle
          {...M('cardTitle.styleProps')}
          title={title}
          subtitle={subtitle}
          titleStyle={M('cardTitle.title')}
          subtitleStyle={M('cardTitle.subtitle')}
          showExpandableButton={true}
          //actAsExpander={true}
          expandable={false}
        />
        <CardText style={M('cardText.style')}
          expandable={true} {...M('cardText.styleProps')} >
          <div style={M('cardText.children')}>


            <RelsView cset={cset} ttid={ttid} 
                toggleRelExpanded={this.toggleRelExpanded}
                isExpanded={this.isExpanded}
            />

            <div style={{zoom:.3, opacity: 0.4, backgroundColor:'orange'}}>
              <br/> <br/>
              {/* not going to use this now... maybe come back to it 
              <ConceptsSummary M={M} cset={cset} ttid={ttid}/>
              <ConceptInfoGridList {...{ ...this.props, M, title:undefined, subtitle:undefined, ttid: this.ttid, }} /> */}
            </div>


          </div>
        </CardText >
      </Card>
    )
  }
}
export const TipButton = props => {
  let {ttid, ttText, ttFancy, buttonContent, M, href, buttonProps,
        tipProps,
        } = props
  if (!ttid) debugger
  return  <TooltipWrapper {...{ttid,ttText,ttFancy,M,tipProps,}} >
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
export const cnames = sgVal => {
  let maxNames = 4
  let maxChars = 50
  let cnames = sgVal.records
                  .slice(0,maxNames)
                  .map(c=>c.concept_name)
                  .map(n=>n.length > maxChars ? n.substr(0,maxChars) + '...' : n)
  if (sgVal.records.length > maxNames) {
    cnames.push(`...(${sgVal.records.length - maxNames} more)`)
  }
  return cnames.join('\n')
}
export class RelButton extends Component {
  render() {
    let {cset, ttid, M, toggleRelExpanded, shouldShow, special} = this.props
    //let {relName, relcids} = rel
    //let href = '#' // should be link to concept focus

    let relSg = cset.prop('relSg')
    if (!relSg || !relSg.records || !relSg.records.length) {
      debugger
    }
    let status = cset.status()
    /*
    let ttFancy= 
      <pre>
        {
          cset.longDesc()
          + '\n' +
          status.loadedMsg()
        }
      </pre>
    let ttText = cset.longDesc() + status.loadedMsg() // ttText needs be at least as unique as fancy
    */
   let ttText = cnames(relSg)


    let buttonContent = status.waiting()
        ? <CircularProgress size={20} 
            {...M('circularProgress.styleProps')}
          /> 
        : null
    let icons = []
    if (status.notRequested()) {
      icons.push(<FileDownload key='fetch' />)
    }
    if (status.loaded()) {
      if (shouldShow) {
        icons.push(<ExpandLess key='expand'/>)
      } else {
        icons.push(<ExpandMore key='expand'/>)
      }
    }
                //[{special}]
    let buttonProps = {
      onClick:() => {
        //debugger
        cset.loadConcepts()
        toggleRelExpanded(relSg.reldim)
      },
      //label: cset.fancyDesc(),
      //label: `${cset.fromDesc()} ${cset.toDesc()}`,
      label:  <span>
                {relSg.records.length} {relSg.reldim} {relSg.relcids.length}
              </span>,
                //<span aria-hidden="true" data-icon="&#e907;" className="icon-link"></span>
      labelPosition: 'before',
      //icon: <span>{icons}</span>,
      icon: (status.notRequested() && <FileDownload/>) ||
            (status.loaded() && (shouldShow ? <ExpandLess/> : <ExpandMore/>)),
      secondary: true,
    }
    if (!ttid) debugger
    let mainButton = <TipButton {...{key:'main',ttid,ttText,
                                          //ttFancy,
                                          M, buttonContent, buttonProps}} />
    return mainButton
    let buttons = [mainButton]
    return <div>{buttons}</div>
  }
}
/*
const RelButtons = props => {
  let {cset, ttid, } = props
  let M = muit()  // shouldn't have same style as parent, right...don't know sc of rels

  let sgList = cset.sgListWithRels()
  let sgVal = sgList[0]
  //let sgVal = cset.sgVal()
  //let rels = cncpt.groups(sgVal, 'rels')
  let buttons = _.flatten(
    _.map(sgVal.getChildren(), (relSg,i) => {
      let relCset = cset.csetFromRelSg(relSg)
      /*
      let buttonContent = `${rel.records.length} ${rel}`
      let ttText = 'concept list?'
      if (!ttid) debugger
      debugger
      * /
      return groupLabel({key:i,cset:relCset, M, ttid})
      return <TipButton {...{key:i,ttid,ttText,M, buttonContent}} />
    })
  )
  return <span className="cdmcnts">{buttons}</span>
}
*/
const RelsView = props => { // assuming I just have cids, no concepts
  let {cset,title='', ttid, toggleRelExpanded, isExpanded} = props
    if (!ttid) debugger
  viewCounts.RelsView++
  let M = muit()  // shouldn't have same style as parent, right...don't know sc of rels
  let status = cset.status()
  if (status.waiting()) {
    return  <CircularProgress size={20} 
             {...M('circularProgress.styleProps')}
            /> 
  }
  let sgList = cset.sgListWithRels()
  if (sgList.length !== 1 || sgList[0].depth !== 0) {
    throw new Error("didn't expect")
  }
  let sgVal = sgList[0]
  /*    FINISH LATER
      <div style={M('raisedButton.parentDiv')} >
        <div style={{...M('headerLight'), zoom:.7}}>
          Opposite rels
        </div>
        {
          sgVal.oppositeRels.map((opposite,i)=>{
            let ttText = opposite.summary()
            let shouldShow = true
            let special = 'opposite rel!'
            let relCset = cset.csetFromRelSg(opposite)
            return <RelButton 
                      special={special}
                      cset={relCset}
                      ttid={ttid}
                      ttText={ttText}
                      M={M}
                      key={i} 
                      toggleRelExpanded={toggleRelExpanded}
                      shouldShow={shouldShow} />
          })
        }
      </div>
  */
  return (
    <div>
      <div style={M('raisedButton.parentDiv')} >
        <div style={{...M('headerLight'), zoom:.7}}>Related Concepts</div>
        { _.map(sgVal.getChildren(), (relSg,i) => {
            //let ttText = relSg.summary()
            let shouldShow = isExpanded(relSg.reldim)
            //let special = `${cset.reldim()} != ${relSg} (${relSg.reldim})`
            let special = ''

            /*
            if (cset.role('rel')) {
              if (relSg==cset.reldim()) {
                special = `${cset.reldim()} 
                              (${cset.concepts().length})
                              == 
                            ${relSg}
                              (${relSg.records.length})
                            `
              }
              else if (relSg==cset.rreldim()) {
                special = `${cset.reldim()} 
                              (${cset.concepts().length})
                              == !
                            ${relSg}
                              (${relSg.records.length})
                            `
              }
            }
            */
            let relCset = cset.csetFromRelSg(relSg)
            return <RelButton 
                      special={special}
                      cset={relCset}
                      ttid={ttid}
                      //ttText={ttText}  // being overridden
                      M={M}
                      key={i} 
                      toggleRelExpanded={toggleRelExpanded}
                      shouldShow={shouldShow} />
        })}
      </div>
      { _.map(sgVal.getChildren(), (relSg,i) => {
        if (relSg.showAsRoundTrip) {
          //debugger
          
          //let rtCset = cset.csetFromRelSg(relSg)
          //mt=cset.parent().byRelName().lookup('Maps to value').records.map(c=>c.concept_id)
          //mf=cset.byRelName().lookup('Value mapped from').records.map(c=>c.concept_id)
          //console.log('stop')
          /*
          rtCset.loadConcepts()
          return <ConceptViewContainer amRoundTrip={true} key={i} cset={rtCset} />
          */
        }
        let relCset = cset.csetFromRelSg(relSg)
        return (isExpanded(relSg.reldim)
          ? <ConceptViewContainer amRel={true} key={i} cset={relCset} /> 
          : null
        )
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
  let {cset, M, ttid} = props
  M = M.props({cset})
  let cnts = cset.cdmCnts()
  let sg = _.supergroup(cset.concepts(), ['domain_id','vocabulary_id','concept_class_id'])
  return  <div style={{zoom:.4}}>
            Concepts Summary for {cset.concepts().length} concepts
            <pre style={M('randomDiv')}>
              {JSON.stringify(cnts)} {'\n\n'}
              {sg.leafNodes().namePaths().join('\n')}
                      (<CdmCntsButtons cset={cset} M={M.props({cset})} ttid={ttid} />)
            </pre>
          </div>
}

