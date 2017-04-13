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
import Chip from 'material-ui/Chip'
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

export class ConceptCodesLookupForm extends Component {
  constructor(props) {
    super(props)
    this.state = {};
  }
  render() {
    let { 
            handleSubmit, load, pristine, reset, submitting, history,
              dispatch, // initialValues, 
              isPending, fromSrcErr, vocabs,
              concept_code_search_pattern, vocabulary_id, 
          } = this.props
    let errMsg = ''
    if (isPending) {
      errMsg =  <p style={{fontColor:'blue',fontWeight:'bold'}}>
                  Loading...
                </p> 
    } else 
    if (fromSrcErr) {
      errMsg =  <p style={{fontColor:'red',fontWeight:'bold'}}>
                  {fromSrcErr.statusText}
                </p> 
    }
    let vocabulary = (vocabs||[]).find(d=>d.vocabulary_id===this.props.vocabulary_id)
    const cardStyle = {
      padding: '0px',
      margin: '14px 0px 20px 0px',
    };
    let styles = {
                        chip: {
                          margin: 4,
                          backgroundColor:muiTheme.palette.primary1Color,
                        },
                        items: {
                          color:muiTheme.palette.alternateTextColor,
                        },
                        wrapper: {
                          display: 'flex',
                          flexWrap: 'wrap',
                        },
    }
    let patterns = concept_code_search_pattern.split(/[\s,]+/)
    if (_.uniq(patterns).length !== patterns.length) {
      console.error("didn't expect duplicate patterns")
    }
    let chips = (patterns||[]).map((code,i) => (
                  <Chip key={i} style={styles.chip}
                      onRequestDelete={() => alert('not working yet')}
                  >
                    <span style={styles.items}>
                      {code}
                    </span>
                  </Chip>))
    return (
        <form >
          <div>
            <Card containerStyle={cardStyle} style={cardStyle}>
              <CardHeader style={{padding:'0px 8px 0px 8px'}}
                actAsExpander={true}
                showExpandableButton={true}
                title='Vocabulary'
                subtitle={
                  vocabulary ?
                    <FlatButton
                      style={{padding:'0px', 
                              color:muiTheme.palette.primary1Color,
                              }}
                      href={vocabulary.vocabulary_reference}
                      target="_blank"
                      label={<span>{vocabulary.vocabulary_name}<br/> {vocabulary.vocabulary_version}</span>}
                      //primary={true}
                      icon={<LinkIcon />}
                    /> : undefined
                }
              />
              <CardText expandable={true}>
                <Field name="vocabulary_id" 
                      //value={vocabulary_id}
                      style={{padding:'0px 8px 0px 8px'}}
                      component={SelectField}
                      fullWidth={true}
                      floatingLabelText="vocabulary_id"
                >
                  {
                    (vocabs||[]).map(
                      d=>{
                          return <MenuItem 
                            className="vocab-item"
                            key={d.vocabulary_id}
                            checked={d.vocabulary_id === this.props.vocabulary_id}
                            value={d.vocabulary_id}
                            primaryText={d.vocabulary_id}
                            secondaryText={d.vocabulary_name}
                            />
                      })
                  }
                </Field>
                
                <Field name="concept_code_search_pattern" 
                      hintText='401.1%,401.2,401.3%'
                      floatingLabelText="Concept codes, separated by comma or space, use % for wildcard"
                      component={TextField}
                      ref="concept_code_search_pattern" withRef
                      multiLine={true}
                      fullWidth={true}
                      errorText={errMsg}
                      label="Concept Codes"
                  />



                          <div style={styles.wrapper}>
                            {chips}
                          </div>



              </CardText>
            </Card>
          </div>
        </form>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
ConceptCodesLookupForm = reduxForm({
  form: 'concept_codes_form',  // a unique identifier for this form
  //onChange: function(fields, dispatch, props) { },
})(ConceptCodesLookupForm)

const selector = formValueSelector('concept_codes_form')
ConceptCodesLookupForm = connect(
  (state, ownProps) => { // mapStateToProps
    let newState = {
      initialValues: {
        ...ownProps,
        foo: {bar: 'baz'},
      },
      formRef: state.form.concept_codes_form,
      history: browserHistory,// wrong wrong wrong...i think
    }
    return newState
  }, 
  { duck }
)(ConceptCodesLookupForm)
