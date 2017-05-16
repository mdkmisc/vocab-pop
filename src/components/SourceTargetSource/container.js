/* eslint-disable */
import myrouter from 'src/myrouter'
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
    let { vocabulary_id, concept_code_search_pattern, 
          concepts=[], fetching=[],
          api, conceptStatus,
        } = this.props
    //let formParams = {  vocabulary_id:'blah', concept_code_search_pattern:'eek', }
    let form = <ConceptCodesLookupForm />
    //console.log(concepts)
    let content = null
    let invisible = false
    switch (conceptStatus) {
      case cncpt.conceptActions.PAUSE:
        content = <CircularProgress />
        break
      case cncpt.conceptActions.FULL:
        //content = <div>concept store is full</div>
        //break
      case cncpt.conceptActions.BUSY:
        invisible = true
      default:
        content =
            <C.ConceptViewContainer 
              invisible={invisible}
              concepts={concepts}
              subtitle={
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
            conceptStatus: {conceptStatus}
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
    //const {vocabulary_id, concept_code_search_pattern, } = selector(state, 'vocabulary_id', 'concept_code_search_pattern')
    const {vocabulary_id, concept_code_search_pattern, } 
          = myrouter.getQuery()
    let cids = state.cids
    let focalCids = cncpt.focal(state)
    let concepts = cncpt.focalConcepts(state)
    let conceptStatus = state.concepts.requests.status
    return {
      api: state.api,
      fetching: cncpt.fetching(state),
      waiting: concepts.length < focalCids.length,
      vocabulary_id, concept_code_search_pattern,
      formRef: state.form.stsform,
      concepts,
      conceptStatus,
    }
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
