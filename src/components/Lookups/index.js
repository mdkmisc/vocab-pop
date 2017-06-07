/* eslint-disable */
import _ from 'src/supergroup'; // in global space anyway...
import {AgTable, } from 'src/components/TableStuff'
import * as util from 'src/utils'
import {ApiSnackbar} from 'src/api'
import myrouter from 'src/myrouter'
import 'src/sass/Vocab.css'
import * as cncpt from 'src/ducks/concept'
import muit from 'src/muitheme'

import { connect } from 'react-redux'
import { bindActionCreators, } from 'redux'
import React, { Component } from 'react'

import { get } from 'lodash'
import { Field, Form, reduxForm, formValueSelector } from 'redux-form'
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
/*
class ConceptCodesLookupFormStandaloneATTEMPT extends Component {
  render() {
    let {   M=muit(),
            handleSubmit, pristine, reset, submitting,
              errMsg, vocabularies,
              matchBy, matchStr, vocabulary_id,
              cset,
          } = this.props
    let vocabulary = vocabularies.find(d=>d.vocabulary_id===this.props.vocabulary_id)
  }
}
*/
class ConceptCodesLookupForm extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      open: false,
    }
  }
  open() {
    if (this.state.open)
      return
    this.props.pause()
    this.setState({open:true})
  }
  close() {
    if (!this.state.open)
      return
    this.props.resume()
    this.setState({open:false})
  }
  componentDidMount() {
    //this.open()
  }
  componentDidUpdate(prevProps) {
  }
  render() {
    let {   M=muit(),
            handleSubmit, pristine, reset, submitting,
              errMsg, vocabularies,
              matchBy, matchStr, vocabulary_id,
              cset,
          } = this.props
    let open = this.open.bind(this)
    let close = this.close.bind(this)
    let vocabulary = vocabularies.find(d=>d.vocabulary_id===this.props.vocabulary_id)
    const actions = [
          <FlatButton
            label="Close"
            primary={true}
            keyboardFocused={!!cset.cidCnt()}
            disabled={!cset.cidCnt()}
            onTouchTap={close}
          />,
        ];
      
    //console.log(this.state)
    return (
        <div>
          <RaisedButton
              onTouchTap={open}
              label={'Select concepts'}
              fullWidth={true}
              /*
              label={`${cset.cidCnt()}
                      ${vocabulary_id}
                      ${matchBy === 'codes' 
                          ? ' codes matching '
                          : ' concepts containing '}
                      ${matchStr}` }
              */
          />
          <Dialog 
            {...M('dialog.styleProps')}
            style={M('dialog.style')}
            overlayStyle={M('dialog.overlayStyle')}
            contentStyle={M('dialog.contentStyle')}
            bodyStyle={M('dialog.bodyStyle')}
            //contentStyle={{width:'100%',maxWidth:'none',}}
            titleStyle={M('dialog.titleStyle')}
            actionsContainerStyle={M('dialog.actionsContainerStyle')}
            title={
              <div className="myDialogTitle">
              <span className="icon-balance-scale"/>
                Choose focal concepts<br/>
                <div style={M('dialog.titleStyle.subtitle')}>
                  {cset.cidCnt()} selected
                  <hr/>
                  { matchBy==='codes' 
                      ? cset.concepts().map(d=>d.concept_code).join(', ') 
                      : ''
                  }
                </div>
              </div>
            }
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={close}
          >
            <Form style={{marginLeft:20}} onSubmit={e=>e.preventDefault()}>
              <Field name="vocabulary_id" 
                    //value={vocabulary_id}
                    style={{padding:'0px 8px 0px 8px'}}
                    component={SelectField}
                    fullWidth={true}
                    floatingLabelText={`vocabulary_id (${this.props.initialValues.vocabulary_id})`}
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
              <Field  name="matchBy" component={RadioButtonGroup}>
                <RadioButton value="codes" label="Concept Codes" />
                <RadioButton value="text" label="Concept Name" />
                <RadioButton disabled={true} value="concept_id" label="Concept ID" />
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
                    style={{padding:'0px 8px 0px 8px'}}
              />

              <hr/>
              <AgTable data={cset.concepts()||[]}
                    width={"100%"} height={250}
                    id="src_target_recs" />
            </Form>
          </Dialog>
        </div>
    )
  }
}
// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
ConceptCodesLookupForm = reduxForm({
  form: 'concept_codes_form',  // a unique identifier for this form
  onChange: values => {
    myrouter.addParams(values)
  },
})(ConceptCodesLookupForm)
ConceptCodesLookupForm = connect(
  (state, props) => { // mapStateToProps
    let { vocabulary_id, 
          matchBy='codes', matchStr, } = myrouter.getQuery()
    return {
      vocabularies: state.vocabularies||[],
      initialValues: {  vocabulary_id, matchBy, matchStr, },
      vocabulary_id, 
      matchBy, matchStr,
      cids: cncpt.focal(state),
      errMsg: undefined,
      conceptState: state.concepts,
      relmetaState: state.relationships,
    }
  },
  dispatch=>bindActionCreators(
    _.pick(cncpt,
           ['wantConcepts','pause','resume']
          ), dispatch),
  (stateProps, dispatchProps, ownProps) => {
    const {vocabulary_id, matchBy, matchStr,
            conceptState, 
            cids, relmetaState, } = stateProps
    const {wantConcepts, } = dispatchProps
    return {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      cset: new cncpt.ConceptSet({
              cids,
              desc: `Lookup ${matchBy} ${matchStr} in vocabulary ${vocabulary_id}`,
              maxDepth:2,
              role: 'focal',
            }, 
            { conceptState, relmetaState, },
            dispatchProps,wantConcepts,
      ),
    }
  }
)(ConceptCodesLookupForm)

export {
  ConceptCodesLookupForm
}

                  /*
                  onChange={
                    (evt,newVal,oldVal) => 
                      myrouter.addParams({
                        matchStr:newVal,
                        matchBy,
                      })
                  }
                  */
                  /*
                  onChange={
                    (evt,newVal,oldVal) => {
                      myrouter.addParams({
                        vocabulary_id:newVal,
                        matchBy, matchStr
                      })
                    }
                  }
                  */
                  /*
                    onChange={
                      (evt,newVal,oldVal) => 
                        myrouter.addParams({
                          matchBy:newVal,
                          matchStr:'',
                      })}
                  */

