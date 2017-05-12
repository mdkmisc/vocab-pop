/* eslint-disable */
import myrouter from 'src/myrouter'
import _ from 'src/supergroup'; // in global space anyway...
import {commify} from 'src/utils'
import * as C from 'src/components/Concept'
import * as cncpt from 'src/ducks/concept'
import * as cids from 'src/ducks/cids'
import {ConceptCodesLookupForm} from 'src/components/Lookups'
//import * as sts from 'src/STSReport'
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
    let { vocabulary_id, concept_code_search_pattern, concepts=[] } = this.props
    let formParams = {  vocabulary_id, concept_code_search_pattern, }
    //console.log(concepts)
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <Card initiallyExpanded={true} containerStyle={{padding:0}} style={{padding:0}}>
          <CardHeader style={{
              padding:'10px 8px 0px 8px'
            }}
            actAsExpander={true}
            showExpandableButton={true}
            title={<h4>Source Target Source Report</h4>}
          />
          <ConceptCodesLookupForm style={{ margin: 10, }}
          />
          <CardText style={{leftMargin:15}}
                    expandable={true} >
            <C.ConceptViewContainer 
              concepts={concepts}
              title={
                <span>
                  {concepts.length} {' '}
                  {vocabulary_id} concepts{' '}
                </span>
              }
              linksWithCounts={true}
              rootStyle={'topRoot'}
              styleOverrides={{root:'card.root.top'}}
            />
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
    const selector = formValueSelector('concept_codes_form')
    //const {vocabulary_id, concept_code_search_pattern, } = selector(state, 'vocabulary_id', 'concept_code_search_pattern')
    const {vocabulary_id, concept_code_search_pattern, } 
          = myrouter.getQuery()
    let concepts = cncpt.conceptsFromCids(state)(cids.cids(state), false)
    if (concepts.length && concepts.length !== state.cids.length) {
      debugger
      throw new Error("expected all the initial concepts")
    }
    return {
      vocabulary_id, concept_code_search_pattern,
      formRef: state.form.stsform,
      concepts,
    }
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
