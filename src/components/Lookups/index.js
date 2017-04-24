/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import * as utils from '../../utils'
import myrouter from '../../redux/myrouter'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import * as vocab from '../../redux/ducks/vocab'
import * as api from '../../redux/api'
import * as apiGlobal from '../../redux/apiGlobal'
import { get } from 'lodash'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import Spinner from 'react-spinner'

import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import LinkIcon from 'material-ui/svg-icons/content/link';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Chip from 'material-ui/Chip'
import Dialog from 'material-ui/Dialog';
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
import {AgTable, } from '../TableStuff'

class VocabField extends Component {
  render() {
    const {vocabularies, vocabulary_id, dispatch} = this.props
    return (
      <Field name="vocabulary_id" 
            //value={vocabulary_id}
            style={{padding:'0px 8px 0px 8px'}}
            component={SelectField}
            fullWidth={true}
            floatingLabelText="vocabulary_id"
            onChange={
              (evt,newVal,oldVal) => dispatch(
                myrouter
                  .addParams({
                    vocabulary_id:newVal})
              )}
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
export class ConceptCodesLookupForm extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      open: false,
      pending: true,
    }
  }
  componentDidMount() {
    const {loadVocabularies, loadConceptIds,
          vocabulary_id, concept_code_search_pattern, } = this.props
    loadVocabularies()
    if (vocabulary_id && concept_code_search_pattern) {
      loadConceptIds({params:{vocabulary_id,concept_code_search_pattern}})
    }
  }
  open() {
    if (this.state.open || this.state.pending)
      return
    this.setState({open:true})
  }
  close() {
    if (!this.state.open || this.state.pending)
      return
    this.setState({open:false})
  }
  componentDidUpdate(prevProps) {
    const { loadConceptIds, 
            vocabulary_id, 
            concept_code_search_pattern, 
            concept_ids=[],
            loadConceptInfo
    } = this.props
    if (vocabulary_id !== prevProps.vocabulary_id ||
        concept_code_search_pattern !== prevProps.concept_code_search_pattern) {
      loadConceptIds({params:{vocabulary_id,concept_code_search_pattern}})
      this.setState({pending:true})
    }
    if (!concept_ids.length)
      this.open()
    if (concept_ids !== prevProps.concept_ids) {
      this.setState({pending:false})
      if (Array.isArray(concept_ids) && concept_ids.length) {
        loadConceptInfo({params:concept_ids})
      }
    }
  }
  render() {
    let { 
            handleSubmit, load, pristine, reset, submitting,
              dispatch, // initialValues, 
              isPending, err, vocabularies,
              concept_code_search_pattern, vocabulary_id,
              conceptInfo,
          } = this.props
    let errMsg = ''
    if (isPending) {
      errMsg =  <p style={{fontColor:'blue',fontWeight:'bold'}}>
                  Loading...
                </p> 
    } else 
    if (err) {
      errMsg =  <p style={{fontColor:'red',fontWeight:'bold'}}>
                  {err.statusText}
                </p> 
    }
    let vocabulary = (vocabularies||[]).find(d=>d.vocabulary_id===this.props.vocabulary_id)
    const cardStyle = {
      padding: '0px',
      margin: '14px 10px 20px 0px',
      //border: '3px solid purple'
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
    /*
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
    */
    let open = this.open.bind(this)
    let close = this.close.bind(this)
    const actions = [
          <FlatButton
            label="Close"
            primary={true}
            keyboardFocused={!!conceptInfo}
            disabled={!conceptInfo}
            onTouchTap={close}
          />,
        ];
      
    return (
        <form style={{marginLeft:20}}>
          <RaisedButton
              onTouchTap={open}
              label={`${vocabulary_id} codes 
                      ${concept_code_search_pattern}` }
          />
          <Dialog
            title={
              <div>
                {conceptInfo.length} concept codes
                <div style={{fontSize:12}}>
                  { conceptInfo.map(d=>d.concept_code).join(', ') }
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
                {
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

                <VocabField vocabularies={vocabularies}
                            vocabulary_id={vocabulary_id}
                            dispatch={dispatch}
                />
                
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
                        (evt,newVal,oldVal) => dispatch(
                          myrouter
                           .addParams({
                             concept_code_search_pattern:newVal})
                        )}
                  />
                  {/* <div style={styles.wrapper}> {chips} </div> */}
              <Card>
                <CardHeader
                  title="Details"
                  actAsExpander={true}
                  showExpandableButton={true}
                />
                <CardText expandable={true}>
                  <AgTable data={conceptInfo||[]}
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

let {vocabularies, codeSearchToCids, conceptInfo}
      = apiGlobal.Apis.apis
let loaders = {
  loadVocabularies: vocabularies.loader,
  loadConceptIds: codeSearchToCids.loader,
  loadConceptInfo: conceptInfo.loader,
}
const mapDispatchToProps = 
  dispatch => bindActionCreators(loaders, dispatch)

ConceptCodesLookupForm = connect(
  (state, props) => { // mapStateToProps
    const { vocabulary_id, concept_code_search_pattern, 
          } = myrouter.getQuery()
    const apiStore = apiGlobal.apiStore(state,props)
    let newState = {
      ...loaders,
      initialValues: { vocabulary_id, concept_code_search_pattern, },
      vocabulary_id, concept_code_search_pattern,
      vocabularies: apiStore('vocabularies'),
      concept_ids: apiStore('codeSearchToCids'),
      conceptInfo: conceptInfo.selectors.conceptInfoWithMatchStrs(state),
      formRef: state.form.concept_codes_form,
    }
    return newState
  }, 
  mapDispatchToProps,
  /*
  (stateProps, dispatchProps, ownProps) => {
    let urlProps = 
    _.pick(myrouter.getQuery(),
        ['vocabulary_id','concept_code_search_pattern'])
    console.log({stateProps, dispatchProps, ownProps, urlProps})
    return urlProps
  }
  */
)(ConceptCodesLookupForm)
