/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import {AgTable, } from 'src/components/TableStuff'
import * as util from 'src/utils'
import {ApiSnackbar} from 'src/api'
import myrouter from 'src/myrouter'

import { connect } from 'react-redux'
import { bindActionCreators, } from 'redux'
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
import {RadioButton, } from 'material-ui/RadioButton'
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
    this.props.conceptPause()
    this.setState({open:true})
  }
  close() {
    if (!this.state.open)
      return
    this.props.conceptResume()
    this.setState({open:false})
  }
  componentDidMount() {
    this.open()
  }
  componentDidUpdate(prevProps) {
  }
  render() {
    let {   M,
            handleSubmit, pristine, reset, submitting,
              fetching, waiting, err, vocabularies,
              matchBy, matchStr, vocabulary_id,
              concepts=[], conceptStatus,
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
                      ${matchBy === 'codes' 
                          ? ' codes matching '
                          : ' concepts containing '}
                      ${matchStr}` }
          />
          <Dialog 
            style={M('dialog.style')}
            bodyStyle={M('dialog.bodyStyle')}
            contentStyle={M('dialog.contentStyle')}
            //contentStyle={{width:'100%',maxWidth:'none',}}
            overlayStyle={M('dialog.overlayStyle')}
            title={
              <div>
                Choose focal concepts<br/>
                <div style={M('dialog.titleStyle.subtitle')}>
                  {concepts.length 
                    ? concepts.length 
                    : 'None' } selected
                </div>
                {
                  fetching.length 
                    ?  `waiting for ${fetching.length} concepts`
                    : ''
                }
                <div style={{fontSize:12}}>
                  { concepts.map(
                      d=> matchBy==='codes' 
                            ? d.concept_code
                            : d.concept_name
                    ).join(', ') }
                </div>
              </div>
            }
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={close}
            autoScrollBodyContent={true}
          >
                <Field name="vocabulary_id" 
                      //value={vocabulary_id}
                      style={{padding:'0px 8px 0px 8px'}}
                      component={SelectField}
                      fullWidth={true}
                      floatingLabelText={`vocabulary_id (${this.props.initialValues.vocabulary_id})`}
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




                <Field  name="matchBy" 
                        onChange={
                          (evt,newVal,oldVal) => 
                            myrouter.addParams({
                              matchBy:newVal,
                          })}
                        component={RadioButtonGroup}>
                  <RadioButton value="codes" label="Concept Codes" />
                  <RadioButton value="text" label="Concept name" />
                  <RadioButton value="concept_id" label="Concept ID" />
                </Field>



                <Field name="matchStr" 
                      component={TextField}
                      //hintText='401.1%,401.2,401.3%'
                      hintText={
                        matchBy === 'codes'
                          ? "Concept codes, separated by comma or space, use % for wildcard"
                          : "Case-insensitive text appearing in concept_name"
                      }
                      floatingLabelText={
                        matchBy === 'codes'
                          ? "Concept Codes"
                          : "Text Search"
                      }
                      fullWidth={true}
                      errorText={errMsg}
                      onChange={
                        (evt,newVal,oldVal) => 
                          myrouter.addParams({
                            matchStr:newVal,
                          })
                      }
                      style={{padding:'0px 8px 0px 8px'}}
                  />



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
    let { vocabulary_id, 
          matchBy='codes', matchStr, } = myrouter.getQuery()
    let cids = state.cids
    let focalCids = cncpt.focal(state)
    let concepts = cncpt.focalConcepts(state)
    let addProps = {
      vocabularies: state.vocabularies||[],
      initialValues: {  vocabulary_id, 
                        matchBy, matchStr, },
      vocabulary_id, 
      matchBy, matchStr,
      concepts,
      focalCids,
      fetching: cncpt.fetching(state),
      waiting: concepts.length < focalCids.length,
      errMsg: concepts.length < focalCids.length ? 'waiting' : undefined,
      conceptStatus: state.concepts.requests.status,
      //formRef: state.form.concept_codes_form,
    }
    return addProps
  },
  dispatch => {
    return bindActionCreators({ 
      conceptPause:cncpt.pause, 
      conceptResume:cncpt.resume, 
    },dispatch)
  }
)(ConceptCodesLookupForm)

export {
  ConceptCodesLookupForm
}

