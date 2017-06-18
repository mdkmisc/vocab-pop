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
import CloudQueue from 'material-ui/svg-icons/file/cloud-queue'
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import CloudDone from 'material-ui/svg-icons/file/cloud-done'
import FileDownload from 'material-ui/svg-icons/file/file-download'
import ZoomIn from 'material-ui/svg-icons/action/zoom-in'
import ConceptIcon from 'material-ui/svg-icons/action/lightbulb-outline'


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
      //cset: cset$.getCset(state)(props.csetId)
      cset: cset$.getCset(props.csetId)
    }
  }
)(Component)

export const CsetWrapper = csetConnect(class extends Component {
  componentDidMount() {
    const {cset, load, } = this.props
    if (load && cset && cset.valid()) {
      cset.fetchConcepts()
      //wantConcepts(cset.cids(),{requestId:cset.id()})
    }
  }
  render() {
    const {Component} = this.props
    return <Component {...this.props} />
  }
})
export const csetWrap = Component => 
  props => <CsetWrapper Component={Component} {...props} />

export const ConceptCount = props => {
  const {cset, ttText, url, M=muit(), } = props
  return  <span style={{
                  zoom: .7,
              }}> 
            <Badge
              badgeContent={cset.cidCnt()}
              primary={true}
              badgeStyle={{
                //top: 18, right: 18,
              }}
            >
                    <ConceptIcon />
            </Badge>
          </span>
}
export const FetchButton = props => {
  const {cset, ttText, url, M=muit(), } = props
  return  <span style={{
                  zoom: .7,
              }}> 
              {
                cset.requested() ? null :
                  <IconButton tooltip={`Fetch concepts`}
                    onClick={
                      ()=>cset.fetchConcepts()
                      //wantConcepts( cset.cids(), {requestId:cset.id()})
                    }
                  >
                    <CloudDownload />
                  </IconButton>
              }
              {
                cset.waiting() &&
                !cset.doneFetching() ?
                    <CircularProgress size={20} 
                        {...M('circularProgress.styleProps')}
                    /> : null
              }
              {
                cset.doneFetching() ? <CloudDone color='green' /> : null
              }
          </span>
}

export const InfoDump = ({cset}) => {
  return (
        <pre>
          {cset.serialize(2)}
          {'\n'}
          sameAsPersisted: {cset.sameAsPersisted() ? 'true' : 'false'}
          {'\n'}
          sameAsStore: {cset.sameAsStore() ? 'true' : 'false'}
          {'\n'}
          persistent: {cset.persistent() ? 'true' : 'false'}
          {'\n'}
          needsCidsFetching: {cset.needsCidsFetching() ? 'true' : 'false'}
          {'\n'}
          needsPersisting: {cset.needsPersisting() ? 'true' : 'false'}
        </pre>
  )
}
export const NameLink = csetWrap(props => {
  const {cset, } = props
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
            <ConceptCount cset={cset} />
            <FetchButton cset={cset} />
            { cset.includeMapped() ? ' Include Mapped ' : '' }
            { cset.includeDescendants() ? ' Include Descendants ' : '' }
            {' '}{JSON.stringify(cset.basketCounts())}
            {' '}{oldConceptComp.groupLabel({cset,ttid:'nameLink'})}
          </span>
})

export const CsetView = csetWrap(props => {
  const {cset, } = props
  return (
    <div>
      <ConceptCount cset={cset} />
      <FetchButton cset={cset} />

      <div style={{fontFamily:'monospace',zoom:.3,}}>
        <hr/>
        {oldConceptComp.groupLabel({cset,ttid:'csetViewer'})}
        <hr/>
      </div>
    </div>
  )
})

