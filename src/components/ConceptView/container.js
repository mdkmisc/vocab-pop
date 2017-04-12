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



// GET RID OF!!!
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap';

import * as AppState from '../../AppState'

class ConceptViewForm extends Component {
  constructor(props) {
    super(props)
    this.state = {};
    this.resize = this.resize.bind(this)
  }
  componentDidMount() {
    let {dispatch, initialValues} = this.props
    dispatch(duck.loadVocabs())
    if (initialValues) {
      dispatch({type:duck.LOAD_FROM_CONCEPT_CODE_SEARCH_PATTERN,payload:initialValues});
      //dispatch(duck.loadFromSourceCodes(initialValues))
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
    let {initialValues, handleSubmit} = this.props;
    let { vocabulary_id, concept_code_search_pattern, recs, fromSrcErr, isPending, vocabPending }
            = initialValues;
    if (prevProps.vocabulary_id !== vocabulary_id ||
        prevProps.concept_code_search_pattern !== concept_code_search_pattern) {
      //console.error("new props", {vocabulary_id, concept_code_search_pattern, recs})
    }
  }
  render() {
    const { handleSubmit, load, pristine, reset, submitting, history,
              dispatch, initialValues, 
          } = this.props
    let { vocabulary_id, concept_code_search_pattern, recs, fromSrcErr, 
          isPending, vocabs, vocabPending}
            = initialValues;
    let report = recs && recs.length
      ? <STSReport vocabulary_id={vocabulary_id} concept_code_search_pattern={concept_code_search_pattern} 
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
    if (!(vocabs && vocabulary_id)) {
      return <div ref={d=>this.divRef=d} id="sts-div" />
    }
    let {concept_id, concept_code, concept_text, conceptInfo, conceptSet, change} = this.state;
    const conceptIdValidation = 
      () => (this.state.valid_concept_id === true && 'success') ||
            (this.state.valid_concept_id === 'loading' && 'warning') ||
            (this.state.valid_concept_id === 'false' ? 'error' : null );
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <form 
          //onSubmit={ data=>{ debugger; console.log("submit is just for saving selection?", history); handleSubmit (data) } }
        >
          <div>
            <Card containerStyle={cardStyle} style={cardStyle}>


              <Form horizontal className="flex-fixed-height-40">
                <FormGroup controlId="concept_id_input"
                        validationState={conceptIdValidation()} >
                  <Col componentClass={ControlLabel}>Concept Id</Col>
                  <Col xs={4}>
                    <FormControl type="number" step="1" value={concept_id} placeholder="Concept Id"
                      onChange={ e => {
                                e.preventDefault();
                                let concept_id = e.target.value;
                                concept_id = parseInt(concept_id,10);
                                if (!_.isNumber(concept_id)) {
                                  concept_id = null;
                                  //this.setState({concept_id, valid_concept_id: 'error', conceptInfo: undefined, });
                                  //return;
                                }
                                this.conceptIdFetch(concept_id);
                        }}
                    />
                    <FormControl.Feedback />
                    <HelpBlock>{(this.state.valid_concept_id === 'loading' && 'Loading...') ||
                                (this.state.valid_concept_id === false 
                                    && 'Invalid concept id') || ''}</HelpBlock>
                  </Col>
                </FormGroup>

                <FormGroup controlId="concept_code_input"
                        //validationState={conceptCodeValidation()} 
                  >
                  <Col componentClass={ControlLabel}>Concept Code</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={concept_code} placeholder="Concept Code"
                      onChange={
                        e => {
                                e.preventDefault();
                                let concept_code = e.target.value;
                                this.conceptCodeFetch(concept_code);
                        }}
                    />
                    <FormControl.Feedback />
                    {/*<HelpBlock>{(this.state.valid_concept_code === 'loading' && 'Loading...') ||
                                (this.state.valid_concept_code === false 
                                    && 'Invalid concept id') || ''}</HelpBlock> */}
                  </Col>
                </FormGroup>

                <FormGroup controlId="concept_text_input"
                        //validationState={conceptTextValidation()} 
                  >
                  <Col componentClass={ControlLabel}>Concept Text</Col>
                  <Col xs={4}>
                    <FormControl type="string" value={concept_text} placeholder="Concept Text"
                      onChange={
                        e => {
                          throw new Error("not handling this yet");
                          /*
                                e.preventDefault();
                                let concept_text = e.target.value;
                                if (conceptInfo && conceptInfo.concept_text === concept_text) return;
                                AppState.saveState({conceptInfoUserChange:'user:concept_text', concept_text, });
                                this.setState({concept_text,
                                              valid_concept_text: 'loading',
                                              conceptSet: this.conceptTextFetch(concept_text)});
                          */
                        }}
                    />
                    <FormControl.Feedback />
                    {/*<HelpBlock>{(this.state.valid_concept_text === 'loading' && 'Loading...') ||
                                (this.state.valid_concept_text === false 
                                    && 'Invalid concept id') || ''}</HelpBlock> */}
                  </Col>
                </FormGroup>
              </Form>


            <hr/>
            <hr/>
            <hr/>


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
                          let vocabulary_id = index
                          console.log(this.props)
                          dispatch({type:duck.VOCABULARY_ID,
                                  payload: {vocabulary_id}})
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
          </div>
        </form>
        {/*
          <div>
            <button type="submit" disabled={pristine || submitting}>Submit</button>
            <button type="button" disabled={pristine || submitting} onClick={reset}>Undo Changes</button>
          </div>
        <pre style={{fontSize:8}}>
          {JSON.stringify(initialValues,null,2)}
        </pre>
        */}
        {report}
      </div>
    )
  }
}
      //<STSReport recs={recs} vocabulary_id={vocabulary_id} concept_code_search_pattern={concept_code_search_pattern} />

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
ConceptViewForm = reduxForm({
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
})(ConceptViewForm)

const selector = formValueSelector('stsform')
ConceptViewForm = connect(
  (state, ownProps) => { // mapStateToProps
    const {vocabulary_id, concept_code_search_pattern, } = selector(state, 'vocabulary_id', 'concept_code_search_pattern')
    let recs = state.vocab.recs;
    let fromSrcErr = state.vocab.fromSrcErr;
    //let isPending = state.vocab.isPending;
    let newState = {
      initialValues: state.vocab,
      //currentValues: state.vocab,
      vocabulary_id, concept_code_search_pattern, recs, fromSrcErr,
      //curVals:{ vocabulary_id, concept_code_search_pattern, recs, fromSrcErr,isPending},
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
)(ConceptViewForm)
export default ConceptViewForm
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
