/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import {AgTable, } from 'src/components/TableStuff'
import * as util from 'src/utils'
import {ApiSnackbar} from 'src/api'
import myrouter from 'src/myrouter'

import { connect } from 'react-redux'
import React, { Component } from 'react'
import * as cids from 'src/ducks/cids'
import * as cncpt from 'src/ducks/concept'

import { get } from 'lodash'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import Spinner from 'react-spinner'

import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import LinkIcon from 'material-ui/svg-icons/content/link';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Dialog from 'material-ui/Dialog';
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

class VocabField extends Component {
  render() {
    const {vocabularies, vocabulary_id, } = this.props
    return (
      <Field name="vocabulary_id" 
            //value={vocabulary_id}
            style={{padding:'0px 8px 0px 8px'}}
            component={SelectField}
            fullWidth={true}
            floatingLabelText="vocabulary_id"
            onChange={
              (evt,newVal,oldVal) => {
                myrouter.addParams({vocabulary_id:newVal})
              }
            }
      >
        {
          (vocabularies||[]).map(
            d=>{
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
    )
  }
}
class CodeSearchField extends Component {
  render() {
    const { concept_code_search_pattern, errMsg,
      } = this.props
    return (
      <Field name="concept_code_search_pattern" 
            hintText='401.1%,401.2,401.3%'
            floatingLabelText="Concept codes, separated by comma or space, use % for wildcard"
            component={TextField}
            //ref="concept_code_search_pattern" withRef
            //multiLine={true}
            fullWidth={true}
            errorText={errMsg}
            label="Concept Codes"
            onChange={
              (evt,newVal,oldVal) => 
                myrouter.addParams({
                    concept_code_search_pattern:newVal})
            }
            style={{padding:'0px 8px 0px 8px'}}
        />
    )
  }
}
class ConceptCodesLookupForm extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      open: false,
    }
  }
  open(do_it=false) {
    if (this.state.open)
      return
    this.setState({open:true})
  }
  close() {
    if (!this.state.open)
      return
    this.setState({open:false})
  }
  openOrClose() {
    const {vocabulary_id, concept_code_search_pattern, } = this.props
    if (!vocabulary_id || !concept_code_search_pattern) {
      this.open()
    }
  }
  componentDidMount() {
    const {vocabulary_id, concept_code_search_pattern, } = this.props
    this.openOrClose()
  }
  componentDidUpdate(prevProps) {
    this.openOrClose()
  }
  render() {
    let { 
            handleSubmit, pristine, reset, submitting,
              fetching, waiting, err, vocabularies,
              concept_code_search_pattern, vocabulary_id,
              concepts=[],
          } = this.props
    let errMsg = ''
    if (waiting) {
      // FIX STYLES
      errMsg =  <p style={{fontColor:'blue',fontWeight:'bold'}}>
                  Loading...
                </p> 
    } else 
    if (err) {
      errMsg =  <p style={{fontColor:'red',fontWeight:'bold'}}>
                  {err.statusText}
                </p> 
    }
    let vocabulary = vocabularies.find(d=>d.vocabulary_id===this.props.vocabulary_id)
    let open = this.open.bind(this)
    let close = this.close.bind(this)
    const actions = [
          <FlatButton
            label="Close"
            primary={true}
            keyboardFocused={!!concepts}
            disabled={!concepts}
            onTouchTap={close}
          />,
        ];
      
    //console.log(this.state)
    return (
        <form style={{marginLeft:20}}>
          <RaisedButton
              onTouchTap={open}
              label={`${concepts.length}
                      ${vocabulary_id}
                      codes matching
                      ${concept_code_search_pattern}` }
          />
          <ApiSnackbar />
          <Dialog
            title={
              <div>
                {concepts.length} concept codes
                {
                  fetching.length 
                    ?  `waiting for ${fetching.length} concepts`
                    : ''
                }
                <div style={{fontSize:12}}>
                  { concepts.map(d=>d.concept_code).join(', ') }
                </div>
              </div>
            }
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={close}
            contentStyle={{width:'100%',maxWidth:'none',}}
            autoScrollBodyContent={true}
          >
            <Card>
              <CardText>
                <VocabField vocabularies={vocabularies}
                            vocabulary_id={vocabulary_id}
                />
                {
                  vocabulary ?
                    <FlatButton
                      primary={true}
                      style={{padding:'0px', }}
                      href={vocabulary.vocabulary_reference}
                      target="_blank"
                      label={<span>{vocabulary.vocabulary_name}<br/> {vocabulary.vocabulary_version}</span>}
                      icon={<LinkIcon />}
                    /> : undefined
                }
              </CardText>
            </Card>
            <Card>
              <CardText>
                <CodeSearchField concept_code_search_pattern={concept_code_search_pattern} />
              </CardText>
            {/*
              <CardText>
                <Field name="concept_code_search_pattern" 
                      hintText='401.1%,401.2,401.3%'
                      floatingLabelText="Concept codes, separated by comma or space, use % for wildcard"
                      component={TextField}
                      ref="concept_code_search_pattern" withRef
                      multiLine={true}
                      fullWidth={true}
                      errorText={errMsg}
                      label="Concept Codes"
                      onChange={
                        (evt,newVal,oldVal) => 
                          myrouter.addParams({
                              concept_code_search_pattern:newVal})
                      }
                  />
              </CardText>
            */}
            </Card>
            <Card>
              <CardHeader
                title="Details"
                actAsExpander={true}
                showExpandableButton={true}
              />
              <CardText expandable={true}>
                <AgTable data={concepts||[]}
                        width={"100%"} height={250}
                        id="src_target_recs" />
              </CardText>
            </Card>
          </Dialog>
        </form>
    )
  }
}
// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
ConceptCodesLookupForm = reduxForm({
  form: 'concept_codes_form',  // a unique identifier for this form
})(ConceptCodesLookupForm)

ConceptCodesLookupForm = connect(
  (state, props) => { // mapStateToProps
    const { vocabulary_id, concept_code_search_pattern, } = myrouter.getQuery()
    let cids = state.cids
    let focalCids = cncpt.focal(state)
    let concepts = cncpt.focalConcepts(state)
    let addProps = {
      vocabularies: state.vocabularies||[],
      initialValues: { vocabulary_id, concept_code_search_pattern, },
      vocabulary_id, concept_code_search_pattern,
      concepts,
      focalCids,
      fetching: cncpt.fetching(state),
      waiting: concepts.length < focalCids.length,
      errMsg: concepts.length < focalCids.length ? 'waiting' : undefined,
      formRef: state.form.concept_codes_form,
    }
    return addProps
  } 
)(ConceptCodesLookupForm)

export {
  ConceptCodesLookupForm
}

