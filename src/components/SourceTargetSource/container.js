/* eslint-disable */
import myrouter from 'src/myrouter'
import muit from 'src/muitheme'
import _ from 'src/supergroup'; // in global space anyway...
import {commify} from 'src/utils'
import * as C from 'src/components/Concept'
import * as cncpt from 'src/ducks/concept'
import * as cids from 'src/ducks/cids'
import {ConceptCodesLookupForm} from 'src/components/Lookups'
import {ApiWatch, ApiSnackbar} from 'src/api'
//import * as sts from 'src/STSReport'
//
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import Spinner from 'react-spinner'

import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import LinkIcon from 'material-ui/svg-icons/content/link';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import CircularProgress from 'material-ui/CircularProgress';

import {
  Checkbox,
  DatePicker,
  TimePicker,
  RadioButtonGroup,
  SelectField,
  Slider,
  TextField,
  Toggle
} from 'redux-form-material-ui'

import ReactTooltip from 'react-tooltip'

class SourceTargetSourceForm extends Component {
  componentDidMount() {
    //this.ttid = _.uniqueId('stsTtId-')
    ReactTooltip.rebuild()
  }
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let { vocabulary_id, matchBy, matchStr, 
          concepts=[], fetching=[],
          api, conceptStatus, requests, focalCids,
        } = this.props
    let M = muit()
    //let formParams = {  vocabulary_id:'blah', matchBy, matchStr:'eek', }
    let form = <ConceptCodesLookupForm M={M}/>
    //console.log(concepts)
    let content = null
    let invisible = false
    switch (conceptStatus) {
      case cncpt.conceptActions.PAUSE:
        content = <CircularProgress />
        break
      case cncpt.conceptActions.BUSY:
        invisible = true
      case cncpt.conceptActions.FULL:
        //content = <div>concept store is full</div>
        //break
      default:
        content =
            <C.ConceptViewContainer 
              invisible={invisible}
              concepts={concepts}
              title={
                <span>
                  {concepts.length} {' '}
                  {vocabulary_id} concepts{' '}
                </span>
              }
              linksWithCounts={true}
              //styleOverrides={{root:'card.root.top'}}
            />
    }
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <h4>Source Target Source Report</h4>
        <Card initiallyExpanded={true} containerStyle={{padding:0}} style={{padding:0}}>
          <CardHeader style={{
              padding:'10px 8px 0px 8px'
            }}
            actAsExpander={true}
            showExpandableButton={true}
            title={<h4>Source Target Source Report</h4>}
          />
          {form}
          <CardText style={{leftMargin:15}} >
            <pre>{
              `loaded: ${concepts.length}\n` +
              _.map(requests,
                (r,k)=>`${k}: ${Array.isArray(r) ? r.length : r}`
                   ).join('\n')
              + `\nmissing focal: ${_.difference(focalCids, concepts.map(c=>c.concept_id)).length}\n`
            }</pre>
          </CardText>
          <CardText style={{leftMargin:15}} >
            {content}
          </CardText>
        </Card>
      </div>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
SourceTargetSourceForm = reduxForm({
  form: 'stsform',  // a unique identifier for this form
})(SourceTargetSourceForm)

SourceTargetSourceForm = connect(
  (state, props) => { // mapStateToProps
    //const selector = formValueSelector('concept_codes_form')
    const {vocabulary_id, matchBy, matchStr, } 
          = myrouter.getQuery()
    let cids = state.cids
    let focalCids = cncpt.focal(state)
    let concepts = cncpt.focalConcepts(state)
    let requests = state.concepts.requests
    let conceptStatus = state.concepts.requests.status
    return {
      focalCids,
      api: state.api,
      fetching: cncpt.fetching(state),
      waiting: concepts.length < focalCids.length,
      vocabulary_id, matchBy, matchStr,
      formRef: state.form.stsform,
      concepts,
      conceptStatus,
      requests,
      got:requests.got,
    }
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
