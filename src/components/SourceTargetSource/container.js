import _ from '../../supergroup'; // in global space anyway...
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, } from 'react-router'
import React, { Component } from 'react'
import actions from '../../actions/sourceTargetSource'
import {STSReport} from './presenter'
import { get } from 'lodash'
import { Field, reduxForm, formValueSelector } from 'redux-form'

import * as AppState from '../../AppState'

const asyncValidate = (values, dispatch) => {
  return actions.loadFromSourceCodes(values)
}
const renderField = ({ input, label, type, meta: { asyncValidating, touched, error } }) => (
  <div>
    <label>{label}</label>
    <div className={asyncValidating ? 'async-validating' : ''}>
      <input {...input} type={type} placeholder={label}/>
      {touched && error && <span>{error}</span>}
    </div>
  </div>
)
class SourceTargetSourceForm extends Component {
  componentDidMount() {
    let {dispatch, initialValues} = this.props;
    const boundActions = bindActionCreators(actions, dispatch)
    this.setState(boundActions);
    console.log("mounting", this.props);
    if (initialValues) {
      let x = boundActions.loadFromSourceCodes(initialValues)
      console.log("initializing action", x);
        //.then(recs=>console.log("this is dumb", recs), err=>console.error("even dumber", err));
    }
  }
  componentDidUpdate() {
    console.log("updating", this.props);
  }
  render() {
    const { handleSubmit, load, pristine, reset, submitting,
              vocabulary_id, concept_codes, recs, } = this.props
    //let data = {vocabulary_id:'ICD9CM', concept_codes:'401.1%,401.2,401.3%'}
    console.log("SourceTargetSourceForm", this.props)
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
      ? <STSReport vocabulary_id={vocabulary_id} concept_codes={concept_codes} />
      : null;
    return (
      <div>
        <form onSubmit={handleSubmit} >
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
  asyncBlurFields: [ 'vocabulary_id' ],
  onSubmit: (data,arg2,arg3,arg4) => {
    console.log("SUBMIT", {data,arg2,arg3,arg4})
    return actions.loadFromSourceCodes(data)
  },
})(SourceTargetSourceForm)

const selector = formValueSelector('stsform')
// You have to connect() to any reducers that you wish to connect to yourself
SourceTargetSourceForm = connect(
  (state, ownProps) => { // mapStateToProps
    console.log('sts CONNECT', {state, ownProps});
    //console.log('sts vocab state', selector(state,'vocabulary_id'))
    const {vocabulary_id, concept_codes, recs} = 
      selector(state, 'vocabulary_id', 'concept_codes','recs')
    //return state
    return {
      initialValues: state.vocabPop.sourceTargetSource,
      vocabulary_id, concept_codes, recs,
      formRef: state.form.stsform,
    }
  },
  {}
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
  //return state.vocabPop.sourceTargetSource
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
