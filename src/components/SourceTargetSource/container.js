/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import * as utils from '../../utils'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import * as duck from '../../redux/ducks/vocab'
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
import * as AppState from '../../AppState'

import {STSReport} from './STSReport'


class SourceTargetSourceForm extends Component {
  componentDidMount() {
    let {dispatch, vocabulary_id, concept_code_search_pattern, 
          localState,
          } = this.props
    dispatch(duck.loadVocabs())
    if (vocabulary_id && concept_code_search_pattern) {
      dispatch({
        type:duck.API_INITIATE,
        localState,
        apiCall: LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN,
        payload:{vocabulary_id,concept_code_search_pattern}
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

SourceTargetSourceForm = connect(
  (state, ownProps) => { // mapStateToProps
    const { vocabulary_id, concept_code_search_pattern, 
            isPending, vocabPending,
            recs, fromSrcErr, vocabs, } = state.vocab
    return {

      localState: ownProps.state || state.vocab,

      sourceConceptCodesSG: duck.sourceConceptCodesSG(state),
      sourceRelationshipsSG: duck.sourceRelationshipsSG(state),
      recs, fromSrcErr, 
      vocabulary_id, 
      concept_code_search_pattern,
      vocabs,
      isPending, vocabPending,
      formRef: state.form.stsform,
      //history: browserHistory,// wrong wrong wrong...i think
    }
  },
  { duck }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
