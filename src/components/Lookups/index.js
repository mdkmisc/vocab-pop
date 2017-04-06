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


import * as AppState from '../../AppState'

export class ConceptCodesForm extends Component {
  constructor(props) {
    super(props)
    this.state = {};
    this.resize = this.resize.bind(this)
  }
  componentDidMount() {
    let {dispatch, vocabulary_id, 
          concept_code_search_pattern, } = this.props
    dispatch(duck.loadVocabs())
    if (vocabulary_id && concept_code_search_pattern) {
      dispatch({
        type:duck.LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN,
        payload:{vocabulary_id,concept_code_search_pattern}
      });
    }
    this.resize()
    /*
    this.refs.concept_code_search_pattern
      .getRenderedComponent() // on Field, returns ReduxFormMaterialUITextField
      .getRenderedComponent() // on ReduxFormMaterialUITextField, returns TextField
      .focus()                // on TextField
    */
  }
  resize() { // having some problem all of a sudden, not sure why
    return;
    let {width,height} = utils.setToAncestorSize(this, this.divRef, ".main-content");
    console.log({width,height});
    if (width === 0 || height === 0) {
      setTimeout(this.resize, 500)
    }
    //this.props.fullyRenderedCb(true);
  }
  componentDidUpdate() {
    this.resize()
  }
  componentDidUpdate(prevProps, prevState) {
  }
  render() {
    let { 
            handleSubmit, load, pristine, reset, submitting, history,
              dispatch, initialValues, 
          } = this.props
    let { 
            vocabulary_id, concept_code_search_pattern, 
            fromSrcErr, isPending, vocabs, vocabPending}
          = initialValues;
    if (!(vocabs && vocabulary_id)) {
      return  <div ref={d=>this.divRef=d} id="sts-div">
                <pre>{JSON.stringify(initialValues,null,2)}</pre>
              </div>
    }
    let errMsg = ''
    if (fromSrcErr) {
      errMsg =  <p style={{fontColor:'red',fontWeight:'bold'}}>
                  {fromSrcErr.statusText}
                </p> 
    }
    let vocabulary = (vocabs||[]).find(d=>d.vocabulary_id===vocabulary_id)
    const cardStyle = {
      padding: '0px',
      margin: '14px 0px 20px 0px',
    };
    let validate_vocabulary_id =
      value=>{
        console.log(`validating ${value}`)
        if (typeof value === 'undefined') return
        let voc = (vocabs||[]).find(d=>d.vocabulary_id===value)
        return voc ? undefined : `can't find ${value}`
      }
    //console.log({vocabulary_id, vocabulary, vocabs})
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <form 
          //onSubmit={ data=>{ debugger; console.log("submit is just for saving selection?", history); handleSubmit (data) } }
        >
          <div>
            <Card containerStyle={cardStyle} style={cardStyle}>
              <CardHeader style={{padding:'0px 8px 0px 8px'}}
                title='Vocabulary'
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
                      value={vocabulary_id}
                      style={{padding:'0px 8px 0px 8px'}}
                      component={SelectField}
                      fullWidth={true}
                      hintText="vocabulary_id"
                      //validate={validate_vocabulary_id}
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
                          let vocabulary_id = index
                          console.log('voc onchange', this.props)
                          dispatch({type:duck.VOCABULARY_ID,
                                  payload: {vocabulary_id}})
                        }
                      }
                >
                  {
                    (vocabs||[]).map(
                      d=>{
                          //console.log('select item', d, vocabulary_id)
                          return <MenuItem 
                            className="vocab-item"
                            key={d.vocabulary_id}
                            checked={d.vocabulary_id === vocabulary_id}
                            value={d.vocabulary_id}
                            primaryText={d.vocabulary_id}
                            secondaryText={d.vocabulary_name}
                            />
                      })
                  }
                </Field>
                
                <Field name="concept_code_search_pattern" 
                      hintText='401.1%,401.2,401.3%'
                      floatingLabelText="Concept Codes"
                      component={TextField}
                      ref="concept_code_search_pattern" withRef
                      multiLine={true}
                      fullWidth={true}
                      errorText={errMsg}
                      onChange={
                        (event, index, value) => {
                          let concept_code_search_pattern = event.target.value
                          console.log('code onchange', {event,index,value})
                          dispatch({type:duck.CONCEPT_CODE_SEARCH_PATTERN,
                                  payload: {concept_code_search_pattern}})
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
              </CardActions>
            </Card>
          </div>
        </form>
      </div>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
ConceptCodesForm = reduxForm({
  form: 'concept_codes_form',  // a unique identifier for this form
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
})(ConceptCodesForm)

const selector = formValueSelector('concept_codes_form')
ConceptCodesForm = connect(
  (state, ownProps) => { // mapStateToProps
    let newState = {
      initialValues: ownProps,
      formRef: state.form.concept_codes_form,
      history: browserHistory,// wrong wrong wrong...i think
    }
    //console.log('Lookup', {oldState:state, newState})
    return newState
  },
  {
    duck
    //this.boundActions = bindActionCreators(duck, dispatch)
  }
)(ConceptCodesForm)
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
