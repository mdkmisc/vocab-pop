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
import * as cset from 'src/ducks/conceptSet'
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
import LinearProgress from 'material-ui/LinearProgress';
import StarBorder from 'material-ui/svg-icons/toggle/star-border'
import ExpandMore from 'material-ui/svg-icons/navigation/expand-more'
import ExpandLess from 'material-ui/svg-icons/navigation/expand-less'
import FileDownload from 'material-ui/svg-icons/file/file-download'
import ZoomIn from 'material-ui/svg-icons/action/zoom-in'


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

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'


const csetConnect = Component => connect(
  (state, props) => {
    return {
      conceptState: state.concepts,
      conceptStatus: state.concepts.requests.status,
    }
  }
  ,dispatch=>bindActionCreators(_.pick(cncpt, ['wantConcepts',]), dispatch)
  ,(stateProps, dispatchProps, ownProps) => {
    const { conceptState, conceptStatus, } = stateProps
    const {wantConcepts, } = dispatchProps
    let cset = //ownProps.cset ||
                cset$.getCset(state)(ownProps.csetId,conceptState)
    if (cset && ownProps.load) {
      wantConcepts(cset.cids(),{requestId:cset.id()})
    }
    return {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      cset, 
    }
  }
)(Component)


export const NameLink = csetConnect(props => {
  const {cset, conceptState, conceptStatus, } = props
  const all = cncpt.concepts(conceptState)
  const concepts = cncpt.conceptsFromCids(conceptState)(cset.cids())
  return  <Link to={{
              pathname: '/csets',
              search:`?csetId=${cset.id()}`,
              //state: { fromDashboard: true }
          }}>
            {cset.name()}
          </Link>
  /*
  <OldSchoolMenuLink 
          to={{pathname:'csets',search:`?csetId=${cset.id()}`}}
          label={cset.name()}
        />
  return <Route path={to} exact={activeOnlyWhenExact} children={({ match }) => (
            <div className={match ? 'active' : ''}>
              {match ? '> ' : ''}<Link to={to}>{label}</Link>
            </div>
          )}/>
  */
  return  <a href="#">{cset.name()}</a>
})

export const CsetView = csetConnect(props => {
  const {cset, conceptState, conceptStatus, } = props
  const all = cncpt.concepts(conceptState)
  const concepts = cncpt.conceptsFromCids(conceptState)(cset.cids())
  return  <a href="#">{cset.name()}</a>
})

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
                cset.subgrpCnts(['voc','dom','cls','rels']).map((sgf,i)=> {
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
