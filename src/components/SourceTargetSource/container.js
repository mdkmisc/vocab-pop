/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import * as utils from 'src/utils'
import * as C from 'src/components/Concept'
import * as cncpt from 'src/ducks/concept'
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



class SourceTargetSourceForm extends Component {
  render() {
    let { vocabulary_id, concept_code_search_pattern, concepts } = this.props
    let formParams = {  vocabulary_id, concept_code_search_pattern, }
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
            <C.ConceptSetAsCard 
              concepts={concepts}
              title={`${concepts.length}
                      ${vocabulary_id}
                      concepts`}
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
    const {vocabulary_id, concept_code_search_pattern, } = selector(state, 'vocabulary_id', 'concept_code_search_pattern')
    return {
      vocabulary_id, concept_code_search_pattern,
      formRef: state.form.stsform,
      concepts: cncpt.storedConceptList(state),
    }
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
