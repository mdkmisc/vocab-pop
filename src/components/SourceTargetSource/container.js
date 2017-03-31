/* eslint-disable */
import _ from '../../supergroup'; // in global space anyway...
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import actions from '../../actions/sourceTargetSource'
import {STSReport} from './presenter'
import { get } from 'lodash'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import Spinner from 'react-spinner'

import * as AppState from '../../AppState'

const renderField =
  opts => {
    let { input, label, type, 
          meta: { asyncValidating, touched, error } } = opts;
    console.log('rendering field with', opts);
    return (<div>
              <label>{label}</label>
              {'is it? ' + asyncValidating}
              <div className={asyncValidating ? 'async-validating' : ''}>
                <input {...input} type={type} placeholder={label}/>{' '}
                {asyncValidating ? <Spinner/> : ''}
                <br/>
                {touched && error && 
                  <span style={{fontWeight:700, color:'#700'}}>
                    {error}
                  </span>}
              </div>
            </div>)
  }
function asyncValidate(values, dispatch, form) {
  console.error('VALIDATING', values);
  if (form && !dispatch) {
    dispatch = form.dispatch;
  }
  let disp = dispatch(actions.loadFromSourceCodes(values))
                .catch(err=>{throw {concept_codes: err.statusText}})
  return disp;
}
class SourceTargetSourceForm extends Component {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    let {dispatch, initialValues} = this.props;
    if (initialValues) {
      let x = dispatch(actions.loadFromSourceCodes(initialValues));
        //.then(recs=>console.log("this is dumb", recs), err=>console.error("even dumber", err));
    }
  }
  componentDidUpdate(prevProps, prevState) {
    let {vocabulary_id, concept_codes, recs, handleSubmit} = this.props;
    if (prevProps.vocabulary_id !== vocabulary_id ||
        prevProps.concept_codes !== concept_codes) {
      console.error("new props", {vocabulary_id, concept_codes, recs})
    }
  }
  render() {
    const { handleSubmit, load, pristine, reset, submitting, history,
              vocabulary_id, concept_codes, recs, } = this.props
    //let data = {vocabulary_id:'ICD9CM', concept_codes:'401.1%,401.2,401.3%'}
    //console.log("SourceTargetSourceForm", this.props)
    /*
              (ep,e) => {
                //handleSubmit(ep,e)
                ep.stopPropagation()
                e.stopPropagation()
                console.log("don't submit")
                return false
              }
    */
    //let e = sclick(document, handleSubmit)
    let report = recs && recs.length
      ? <STSReport vocabulary_id={vocabulary_id} concept_codes={concept_codes} 
                    recs={recs}
            />
      : null;
    return (
      <div>
        <form onSubmit={ data=>{ debugger;
                                  console.log(history);
                                  handleSubmit (data) } }
          >
          <div>
              <Field name="vocabulary_id" 
                    component={renderField}
                    type="text" 
                    label="Vocabulary ID"/>
              <Field name="concept_codes" 
                    component={renderField}
                    type="text" 
                    label="Concept Codes"/>
          </div>
          <div>
            <button type="submit" disabled={pristine || submitting}>Submit</button>
            <button type="button" disabled={pristine || submitting} onClick={reset}>Undo Changes</button>
          </div>
        </form>
        {report}
      </div>
    )
  }
}
      //<STSReport recs={recs} vocabulary_id={vocabulary_id} concept_codes={concept_codes} />

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
SourceTargetSourceForm = reduxForm({
  form: 'stsform',  // a unique identifier for this form
  asyncValidate,
  onChange: function(fields, dispatch, props) {
    this.asyncValidate(fields, this.dispatch);
  },
/*
  onChange: (fields, dispatch, props) => {
    asyncValidate(fields, this.dispatch);
  },
*/
  asyncBlurFields: [ 'concept_codes' ],
  onSubmit: data => {
    debugger;
    actions.loadFromSourceCodes(data)
  }
})(SourceTargetSourceForm)

const selector = formValueSelector('stsform')
// You have to connect() to any reducers that you wish to connect to yourself
SourceTargetSourceForm = connect(
  (state, ownProps) => { // mapStateToProps
    //console.log('sts vocab state', selector(state,'vocabulary_id'))
    const {vocabulary_id, concept_codes, } = 
      selector(state, 'vocabulary_id', 'concept_codes')
    //return state
    let recs = state.app.sourceTargetSource.recs;
    //console.log('sts CONNECT', {state, ownProps}, 'did recs change?', recs);
    return {
      initialValues: state.app.sourceTargetSource,
      vocabulary_id, concept_codes, recs,
      formRef: state.form.stsform,
      history
    }
  },
  {
    actions
    //this.boundActions = bindActionCreators(actions, dispatch)
  }
)(SourceTargetSourceForm)
/*
const WrapForm = ()=><SourceTargetSourceForm
                        onSubmit={
                          (a,b,c,d) => {
                            console.log("SUBMIT!", a,b,c,d)
                            debugger
                          }
                        } />
*/
export default SourceTargetSourceForm
//export default WrapForm

/*
function mapStateToProps(state) {
  return state
  return {}
  //console.log('sourceTargetSource state', state)
  //return state.app.sourceTargetSource
  //return { user: get(state, 'sourceTargetSource.recs'), }
}

const mapDispatchToProps = {
  //loadRecs: actions.sourceTargetSource.loadFromSourceCodes,
}
*/

/*
export default connect (
  mapStateToProps,
  mapDispatchToProps
)(FormVals)
*/
function simulateClick(el, cb) {
  var event = new MouseEvent('click', {
    'view': window,
    'bubbles': true,
    'cancelable': true
  })
  el.addEventListener('click', 
                      (e,a,b,c)=>{
                        debugger
                        return cb(e,a,b,c)
                      })
  var cancelled = !el.dispatchEvent(event)
  if (cancelled) {
    // A handler called preventDefault.
    alert("cancelled")
  } else {
    // None of the handlers called preventDefault.
    alert("not cancelled")
  }
  return event
}
var sclick = _.once(simulateClick)
              //handleSubmit={actions.loadFromSourceCodes}
