/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import * as utils from '../../utils'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import * as vocab from '../../redux/ducks/vocab'
import * as api from '../../redux/api'
import { get } from 'lodash'
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
  componentDidMount() {
    let {getVocabularies, getIdsByCodeSearch,
          vocabulary_id, concept_code_search_pattern, } = this.props
    getVocabularies()
    if (vocabulary_id && concept_code_search_pattern) {
      getIdsByCodeSearch({vocabulary_id,concept_code_search_pattern})
    }
  }
  componentWillReceiveProps() {
    let {getIdsByCodeSearch,
          vocabulary_id, concept_code_search_pattern, } = this.props
    if (vocabulary_id && concept_code_search_pattern) {
      getIdsByCodeSearch({vocabulary_id,concept_code_search_pattern})
    }
    let {dispatch, vocabulary_id, concept_code_search_pattern, } = this.props
    if (vocabulary_id && concept_code_search_pattern) {
      dispatch({
        type:api.API_CALL,
        payload: {
          apiName: api.CONCEPT_CODES,
          params: {vocabulary_id,concept_code_search_pattern}
        }
      });
    }
  }
  render() {
    let {
          history, dispatch,
          recs, fromSrcErr, vocabs, isPending, vocabPending,
          vocabulary_id, concept_code_search_pattern, 
          sourceConceptCodesSG,
          sourceRelationshipsSG,
        } = this.props
    let formParams = {  vocabulary_id, 
                        concept_code_search_pattern,
                        vocabs,
                        fromSrcErr,
                        isPending, vocabPending,}
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <ConceptCodesLookupForm {...formParams} />
        <STSReport vocabulary_id={vocabulary_id} concept_code_search_pattern={concept_code_search_pattern} 
                    sourceConceptCodesSG={sourceConceptCodesSG}
                    sourceRelationshipsSG={sourceRelationshipsSG}
                    recs={recs} />
      </div>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
SourceTargetSourceForm = reduxForm({
  form: 'stsform',  // a unique identifier for this form
})(SourceTargetSourceForm)

let apis = _.pick(api, ['getVocabularies', 'getIdsByCodeSearch'])
function mapDispatchToProps(dispatch) {
  return bindActionCreators(apis, dispatch)
}
SourceTargetSourceForm = connect(
  (state, ownProps) => { // mapStateToProps
    const { vocabulary_id, concept_code_search_pattern, 
            isPending, vocabPending,
            recs, fromSrcErr, vocabs, } = state.vocab
    return {
      //...apis,
      sourceConceptCodesSG: vocab.sourceConceptCodesSG(state),
      sourceRelationshipsSG: vocab.sourceRelationshipsSG(state),
      recs, fromSrcErr, 
      vocabulary_id, 
      concept_code_search_pattern,
      vocabs,
      isPending, vocabPending,
      formRef: state.form.stsform,
      //history: browserHistory,// wrong wrong wrong...i think
    }
  },
  mapDispatchToProps
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
