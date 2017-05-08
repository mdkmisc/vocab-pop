/* eslint-disable */
import myrouter from 'src/myrouter'
import _ from 'src/supergroup'; // in global space anyway...
import {commify} from 'src/utils'
import * as C from 'src/components/Concept'
import * as cncpt from 'src/ducks/concept'
import * as muit from 'src/muitheme'
import {ConceptCodesLookupForm} from 'src/components/Lookups'
//import * as sts from 'src/STSReport'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import Spinner from 'react-spinner'

import ReactTooltip from 'react-tooltip'

window.ReactTooltip = ReactTooltip
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


const styles = {
  ccodeButton: {
    //padding: 2,
    padding: '1px 3px 1px 3px',
    margin: '5px 2px 1px 2px',
    //margin: 2,
    //border:'1px solid pink', 
    color: 'white',
    lineHeight:'auto',
    height:'auto',
    minHeight:'auto',
    width:'auto',
    minWidth:'auto',
  },
}

class SourceTargetSourceForm extends Component {
  componentDidUpdate() {
    ReactTooltip.rebuild()
    this.ttid = _.uniqueId('stsTtId-')
  }
  render() {
    let { vocabulary_id, concept_code_search_pattern, concepts } = this.props
    let formParams = {  vocabulary_id, concept_code_search_pattern, }
    let cnts = C.cdmCnts( concepts, d=>d)
    return (
      <div ref={d=>this.divRef=d} id="sts-div" >
        <ReactTooltip id={this.ttid}
                      //place="bottom" 
                      //effect="solid"
        >
          <div>
            { cnts.long.map((c,i)=><div key={i}>{c}</div>) }
          </div> 
        </ReactTooltip>
        <Card initiallyExpanded={true} containerStyle={{padding:0}} style={{padding:0}}>
          <CardHeader style={{
              padding:'10px 8px 0px 8px'
            }}
            actAsExpander={true}
            showExpandableButton={true}
            title={<h4>Source Target Source Report</h4>}
          />
          <ConceptCodesLookupForm style={{ margin: 10, }}
          />
          <CardText style={{leftMargin:15}}
                    expandable={true} >
            <C.ConceptViewContainer 
              concepts={concepts}
              title={
                <span >
                  {concepts.length} {' '}
                  {vocabulary_id} concepts{' '}
                  <span style={{fontSize: '.6em',}}
                    data-tip data-for={this.ttId}
                  >
                    ({cnts.short.join(', ')})
                  </span>
                </span>
              }
              subtitle={
                concepts.map(
                  (c,i) => {
                    let cnts = C.cdmCnts([c], d=>d)
                    let cttid = `${this.ttid}:${i}`
                    let href = '#' // should be link to concept focus
                    return  (
                      <span>
                        <ReactTooltip id={cttid} >
                          {c.concept_name}:
                          { cnts.long.map((c,i)=><div key={i}>{c}</div>) }
                        </ReactTooltip>
                        <FlatButton  
                          style={
                            { 
                              ...styles.ccodeButton,
                              backgroundColor: muit.get({sc:c.standard_concept}).palette.regular,
                            }
                          } 
                          href={href} 
                          data-tip
                          data-for={cttid}
                        >
                          {c.concept_code}
                          ({cnts.short.join(', ')})
                        </FlatButton>
                      </span>
                    )
                  })}
            />
          </CardText>
        </Card>
      </div>
    )
  }
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
SourceTargetSourceForm = reduxForm({
  form: 'stsform',  // a unique identifier for this form
})(SourceTargetSourceForm)

SourceTargetSourceForm = connect(
  (state, props) => { // mapStateToProps
    const selector = formValueSelector('concept_codes_form')
    //const {vocabulary_id, concept_code_search_pattern, } = selector(state, 'vocabulary_id', 'concept_code_search_pattern')
    const {vocabulary_id, concept_code_search_pattern, } 
          = myrouter.getQuery()
    return {
      vocabulary_id, concept_code_search_pattern,
      formRef: state.form.stsform,
      //concepts: cncpt.storedConceptList(state),
      concepts: cncpt.apis.conceptInfoApi.selectors('conceptInfoApi').results(state)(),
    }
  }
)(SourceTargetSourceForm)
export default SourceTargetSourceForm
