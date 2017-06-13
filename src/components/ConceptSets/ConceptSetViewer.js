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
import * as cset$ from 'src/ducks/conceptSet'
import * as oldConceptComp from 'src/components/Concept'
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
import SvgIcon from 'material-ui/SvgIcon'
import Subheader from 'material-ui/Subheader'
import CircularProgress from 'material-ui/CircularProgress'
import LinearProgress from 'material-ui/LinearProgress';
import StarBorder from 'material-ui/svg-icons/toggle/star-border'
import ExpandMore from 'material-ui/svg-icons/navigation/expand-more'
import ExpandLess from 'material-ui/svg-icons/navigation/expand-less'
import FileDownload from 'material-ui/svg-icons/file/file-download'
import ZoomIn from 'material-ui/svg-icons/action/zoom-in'
import CloudQueue from 'material-ui/svg-icons/file/cloud-queue'


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
      cset: cset$.getCset(state)(props.csetId,state.concepts)
    }
  }
  ,dispatch=>bindActionCreators(_.pick(cncpt, ['wantConcepts',]), dispatch)
  ,(stateProps, dispatchProps, ownProps) => {
    const { conceptState, conceptStatus, cset, } = stateProps
    const {wantConcepts, } = dispatchProps
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

export const ConceptCount = props => {
  const {cnt, ttText, url, M=muit()} = props
  return  <SvgIcon  
              color='white'
              hoverColor='green'
              viewBox="0 0 24 24" 
              style={{
                //border: '1px solid purple',
                paddingTop: 5,
                //marginTop: 30,
                //marginRight: 30,
                //marginLeft: 30,
              }}
          >
            <path style={{
                    //color: 'rgb(0, 0, 0)',
                    //fillOpacity: 0,
                    //fill: 'white',
                  }}
                  d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z" />
            <text x="8px" y="16px"
                  style={{
                    //fill: 'black',
                    fontSize: '.7em',
                  }}
            >{cnt}</text>
          </SvgIcon>
}

export const NameLink = csetConnect(props => {
  const {cset, conceptState, conceptStatus, } = props
  const all = cncpt.concepts(conceptState)
  const concepts = cncpt.conceptsFromCids(conceptState)(cset.cids())
  let name = ''
  switch (cset.selectMethodName()) {
    case 'fromAtlas':
      name = cset.name()
      break
    case 'matchText':
      name =  <span>
                <span style={{fontFamily:'monospace'}}>{cset.param('matchStr')}</span>
                {' '}in {cset.param('vocabulary_id')}
              </span>
      break
    default:
      name = cset.name()
  }
  return  <span>
            <Link to={{
                pathname: '/csets',
                search:`?csetId=${cset.id()}`,
                //state: { fromDashboard: true }
            }}>
              {name}
            </Link>
            <ConceptCount cnt={cset.cidCnt()} />
          </span>
  /*
            <span style={{zoom:.2}}>{JSON.stringify(cset.obj())}</span>
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
  return  <div>
            {cset.name()}: {' '}
            {oldConceptComp.groupLabel({cset,ttid:'csetViewer'})}
          </div>
})

