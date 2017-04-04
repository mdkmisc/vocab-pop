/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import * as utils from '../../utils'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import * as sts from '../../redux/ducks/sourceTargetSource'
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


import * as AppState from '../../AppState'

class SourceTargetSourceForm extends Component {
  constructor(props) {
    super(props)
    this.state = {};
  }
  componentDidMount() {
    let {dispatch, initialValues} = this.props
    dispatch(sts.loadVocabs())
    if (initialValues) {
      dispatch({type:sts.LOAD_FROM_SOURCECODES,payload:initialValues});
      //dispatch(sts.loadFromSourceCodes(initialValues))
    }
    utils.setToAncestorSize(this, this.divRef, ".main-content");
    /*
    this.refs.concept_codes
      .getRenderedComponent() // on Field, returns ReduxFormMaterialUITextField
      .getRenderedComponent() // on ReduxFormMaterialUITextField, returns TextField
      .focus()                // on TextField
    */
  }
  componentDidUpdate(prevProps, prevState) {
    let {initialValues, handleSubmit} = this.props;
    let { vocabulary_id, concept_codes, recs, fromSrcErr, isPending, vocabPending }
            = initialValues;
    if (prevProps.vocabulary_id !== vocabulary_id ||
        prevProps.concept_codes !== concept_codes) {
      //console.error("new props", {vocabulary_id, concept_codes, recs})
    }
  }
  render() {
    const { handleSubmit, load, pristine, reset, submitting, history,
              dispatch, initialValues, 
          } = this.props
    let { vocabulary_id, concept_codes, recs, fromSrcErr, 
          isPending, vocabs, vocabPending}
            = initialValues;
    let report = recs && recs.length
      ? <STSReport vocabulary_id={vocabulary_id} concept_codes={concept_codes} 
                    recs={recs}
            />
      : null;
    let errMsg = ''
    if (fromSrcErr) {
      errMsg =  <p style={{fontColor:'red',fontWeight:'bold'}}>
                  {fromSrcErr.statusText}
                </p> 
    }
    let vocabulary = (vocabs||[]).find(d=>d.vocabulary_id===vocabulary_id)
    const cardStyle = {
      //height: 100,
      //width: '100%',
      padding: '0px',
      //margin: 5,
      //textAlign: 'center',
      //display: 'inline-block',
    };
    if (!vocabs && vocabulary_id) {
      return <div ref={d=>this.divRef=d}/>
    }
    return (
      <div ref={d=>this.divRef=d}>
        <form 
          //onSubmit={ data=>{ debugger; console.log("submit is just for saving selection?", history); handleSubmit (data) } }
        >
          <div>
            <Card containerStyle={cardStyle} style={cardStyle}>
              <CardHeader style={{padding:'0px 8px 0px 8px'}}
                title="Vocabulary"
                subtitle={
                    <FlatButton
                      style={{padding:'0px', }}
                      href={vocabulary.vocabulary_reference}
                      target="_blank"
                      label={<span>{vocabulary.vocabulary_name}<br/> {vocabulary.vocabulary_version}</span>}
                      //primary={true}
                      icon={<LinkIcon />}
                    />
                }
              />
              <CardActions>
                <Field name="vocabulary_id" 
                      style={{padding:'0px 8px 0px 8px'}}
                      value={vocabulary_id}
                      component={SelectField}
                      fullWidth={true}
                      hintText="vocabulary_id"
                      validate={
                        value=>{
                          let voc = (vocabs||[]).find(d=>d.vocabulary_id===value)
                          return voc ? undefined : `can't find ${value}`
                        }
                      }
                      //floatingLabelText="Vocabulary"
                      //data-lpignore={true}
                      //floatingLabelText="Type 'peah', fuzzy search"
                      //filter={MUIAutoComplete.fuzzyFilter}
                      //filter={MUIAutoComplete.noFilter}
                      //maxHeight={200}
                      //onUpdateInput={vocabUpdate}
                      //onNewRequest={value => { console.log('AutoComplete ', value) // eslint-disable-line no-console }}
                      //dataSourceConfig={{ }}
                      //errorText={vocabulary_id}
                      onChange={
                        (event, index, value) => {
                          dispatch({type:sts.VOCABULARY_ID,
                                  payload: {concept_codes,
                                              vocabulary_id:index}})
                        }
                      }
                >
                  {
                    (vocabs||[]).map(
                      d=><MenuItem 
                            key={d.vocabulary_id}
                            checked={d.vocabulary_id === vocabulary_id}
                            value={d.vocabulary_id}
                            primaryText={d.vocabulary_id}
                            secondaryText={d.vocabulary_name}
                            />)
                  }
                </Field>
              </CardActions>
            </Card>
              
              <Field name="concept_codes" 
                    hintText='401.1%,401.2,401.3%'
                    floatingLabelText="Concept Codes"
                    component={TextField}
                    ref="concept_codes" withRef
                    multiLine={true}
                    fullWidth={true}
                    errorText={errMsg}
                    onChange={
                      (event, index, value) => {
                        dispatch({type:sts.SOURCE_CODES,
                                payload: {
                                  vocabulary_id,
                                  concept_codes:index}})
                      }
                    }
  /*
  ? <span style={{fontWeight:700, color:'#700'}}>
      {fromSrcErr.statusText}
    </span>
    ? <span style={{fontWeight:700, color:'#700'}}>
        {vocabErr.statusText}
      </span>
  */
                    label="Concept Codes"
                />
          </div>
        </form>
        {/*
          <div>
            <button type="submit" disabled={pristine || submitting}>Submit</button>
            <button type="button" disabled={pristine || submitting} onClick={reset}>Undo Changes</button>
          </div>
        */}
        <pre style={{fontSize:8}}>
          {JSON.stringify(initialValues,null,2)}
        </pre>
        {report}
      </div>
    )
  }
}
      //<STSReport recs={recs} vocabulary_id={vocabulary_id} concept_codes={concept_codes} />

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
  //asyncBlurFields: [ 'concept_codes' ],
  onSubmit: data => {
    debugger;
    //sts.loadFromSourceCodes(data)
  }
*/
})(SourceTargetSourceForm)

const selector = formValueSelector('stsform')
SourceTargetSourceForm = connect(
  (state, ownProps) => { // mapStateToProps
    const {vocabulary_id, concept_codes, } = selector(state, 'vocabulary_id', 'concept_codes')
    let apiCallsProcessed = state.app.sourceTargetSource.apiCallsProcessed;
    let recs = state.app.sourceTargetSource.recs;
    let fromSrcErr = state.app.sourceTargetSource.fromSrcErr;
    //let isPending = state.app.sourceTargetSource.isPending;
    let newState = {
      initialValues: state.app.sourceTargetSource,
      apiCallsProcessed,
      //currentValues: state.app.sourceTargetSource,
      vocabulary_id, concept_codes, recs, fromSrcErr,
      //curVals:{ vocabulary_id, concept_codes, recs, fromSrcErr,isPending},
      formRef: state.form.stsform,
      history: browserHistory,// wrong wrong wrong...i think
    }
    //console.log({oldState:state, newState})
    return newState
  },
  {
    sts
    //this.boundActions = bindActionCreators(sts, dispatch)
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
/*
function asyncValidate(values, dispatch, form) {
  //console.error('VALIDATING', values);
  if (form && !dispatch) {
    dispatch = form.dispatch;
  }
  return sts.loadFromSourceCodes(values)
  //let disp = dispatch(sts.loadFromSourceCodes(values)) .catch(err=>{throw {concept_codes: err.statusText}})
  return disp;
}
*/
