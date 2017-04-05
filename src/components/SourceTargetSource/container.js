/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import * as utils from '../../utils'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import * as duck from '../../redux/ducks/vocab'
import {STSReport} from './presenter'
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

import {ConceptCodesForm} from '../Lookups'
import * as AppState from '../../AppState'

class SourceTargetSourceForm extends Component {
  constructor(props) {
    super(props)
    let vocabulary_id, concept_code_search_pattern
    // for testing:
    vocabulary_id = 'ICD9CM'
    concept_code_search_pattern = '401.1%,401.2,401.3%'
    this.state = {
      vocabulary_id,
      concept_code_search_pattern,
    };
  }
  componentDidMount() {
    let {vocabulary_id, concept_code_search_pattern, } = this.props
    if (vocabulary_id && concept_code_search_pattern) {
      this.props.dispatch({
        type:duck.VOCABULARY_ID_CONCEPT_CODE_SEARCH_PATTERN,
        payload: {vocabulary_id, concept_code_search_pattern}})
    }
  }
  componentDidUpdate(prevProps, prevState) {
  }
  render() {
    let {
          handleSubmit, load, pristine, reset, submitting, history,
          dispatch, lookupParams={}, 
          recs, fromSrcErr, 
          vocabulary_id, concept_code_search_pattern, 
        } = this.props
    //vocabulary_id = vocabulary_id || this.state.vocabulary_id
    //concept_code_search_pattern = concept_code_search_pattern || this.state.concept_code_search_pattern

    const cardStyle = {
      padding: '0px',
    };
    let report = recs && recs.length
      ? <STSReport vocabulary_id={vocabulary_id} concept_code_search_pattern={concept_code_search_pattern} 
                    recs={recs}
            />
      : null;
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <ConceptCodesForm
          {...lookupParams}
          //vocabulary_id={vocabulary_id}
          //concept_code_search_pattern={concept_code_search_pattern}
          //{...initialValues}
        />
        <Card containerStyle={cardStyle} style={cardStyle}>
          <CardHeader style={{padding:'0px 8px 0px 8px'}}
            title={`Searching ${vocabulary_id} for`}
            subtitle={concept_code_search_pattern}
          />
        <CardText>
          found {recs ? recs.length : 0} concepts
        </CardText>
          <CardActions>
          </CardActions>
        </Card>
          
        {report}
      </div>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
SourceTargetSourceForm = reduxForm({
  form: 'stsform',  // a unique identifier for this form
  //asyncValidate,
  onChange: function(fields, dispatch, props) {
    //this.asyncValidate(fields, this.dispatch);
  },
/*
  onChange: (fields, dispatch, props) => {
    asyncValidate(fields, this.dispatch);
  },
  //asyncBlurFields: [ 'concept_code_search_pattern' ],
  onSubmit: data => {
    debugger;
    //duck.loadFromSourceCodes(data)
  }
*/
})(SourceTargetSourceForm)

SourceTargetSourceForm = connect(
  (state, ownProps) => { // mapStateToProps
    const { vocabulary_id, concept_code_search_pattern, 
            isPending, vocabPending,
            recs, fromSrcErr, vocabs, } = state.app.vocab
    let newState = {
      recs, fromSrcErr, 
      vocabulary_id, 
      concept_code_search_pattern,
      lookupParams: {
          vocabulary_id, 
          concept_code_search_pattern,
          vocabs,
          fromSrcErr,
          isPending, vocabPending,
      },

      //initialValues: state.app.vocab,
      formRef: state.form.stsform,
      history: browserHistory,// wrong wrong wrong...i think
    }
    //console.log({oldState:state, newState})
    return newState
  },
  {
    duck
    //this.boundActions = bindActionCreators(duck, dispatch)
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
/*
function asyncValidate(values, dispatch, form) {
  //console.error('VALIDATING', values);
  if (form && !dispatch) {
    dispatch = form.dispatch;
  }
  return duck.loadFromSourceCodes(values)
  //let disp = dispatch(duck.loadFromSourceCodes(values)) .catch(err=>{throw {concept_code_search_pattern: err.statusText}})
  return disp;
}
*/
