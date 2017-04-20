/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import * as utils from '../../utils'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import * as vocab from '../../redux/ducks/vocab'
import * as api from '../../redux/api'
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

import {ConceptCodesLookupForm} from '../Lookups'

import {STSReport} from './STSReport'


class SourceTargetSourceForm extends Component {
  /*
  componentDidMount() {
    const {concept_ids, loadConceptInfo} = this.props
    if (concept_ids && concept_ids.length) {
      loadConceptInfo(concept_ids)
    }
  }
  componentDidUpdate(prevProps) {
    const {concept_ids, loadConceptInfo} = this.props
    if (concept_ids !== prevProps.concept_ids) {
      loadConceptInfo(concept_ids)
    }
  }
  */
  render() {
    let {
          history, dispatch,
          conceptInfo, err, vocabularies, isPending, vocabPending,
          vocabulary_id, concept_code_search_pattern, 
          sourceConceptCodesSG,
          sourceRelationshipsSG,
        } = this.props
    let formParams = {  vocabulary_id, concept_code_search_pattern, }
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <ConceptCodesLookupForm {...formParams} />
        <STSReport  vocabulary_id={vocabulary_id} 
                    concept_code_search_pattern={concept_code_search_pattern} 
                    sourceConceptCodesSG={sourceConceptCodesSG}
                    sourceRelationshipsSG={sourceRelationshipsSG}
                    conceptInfo={conceptInfo} 
                    />
      </div>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
SourceTargetSourceForm = reduxForm({
  form: 'stsform',  // a unique identifier for this form
})(SourceTargetSourceForm)

// https://github.com/reactjs/reselect#sharing-selectors-with-props-across-multiple-components
/* too complicated.... this is probably just to improve memoization, i might not care
const makeMapStateToProps = () => {
  console.log(api)
  /*
  const apiSelectors = 
    _.mapValues(
      api.selectors, 
      () => {
        console.log(arguments)
        debugger
      })
  * /
  let apiStore = api.selectors.apiStore()
  const mapStateToProps = (state,props) => {
    const { vocabulary_id, concept_code_search_pattern, } = state.vocab
    let newProps = {  apiStore: apiStore(state,props),
                      //vocabulary_id, concept_code_search_pattern,
                      //formRef: state.form.stsform,
                   }
    console.log(newProps)
    return newProps
  }
  return mapStateToProps
}
*/


SourceTargetSourceForm = connect(
  //makeMapStateToProps,
  (state, props) => { // mapStateToProps
    const selector = formValueSelector('concept_codes_form')
    const {vocabulary_id, concept_code_search_pattern, } = selector(state, 'vocabulary_id', 'concept_code_search_pattern')
    return {
      sourceConceptCodesSG: vocab.sourceConceptCodesSG(state),
      sourceRelationshipsSG: vocab.sourceRelationshipsSG(state),
      vocabulary_id, concept_code_search_pattern,
      formRef: state.form.stsform,
    }
  },
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
