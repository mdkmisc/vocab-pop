/* eslint-disable */
import myrouter from 'src/myrouter'
import muit from 'src/muitheme'
import * as cset$ from 'src/ducks/conceptSet'
import * as C from 'src/components/ConceptSets/ConceptSetViewer'
import {AgTable, } from 'src/components/TableStuff'
import {SaveButton, } from 'src/components/utilityComponents'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, } from 'redux'

import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import LinearProgress from 'material-ui/LinearProgress';
import MenuItem from 'material-ui/MenuItem';
import {RadioButton, } from 'material-ui/RadioButton'

import DeleteIcon from 'material-ui/svg-icons/action/delete'
import DoneIcon from 'material-ui/svg-icons/action/done'
import LinkIcon from 'material-ui/svg-icons/content/link';

import { Field, /*Form,*/ reduxForm, formValueSelector } from 'redux-form'
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

let ConceptSetBuilder = C.csetWrap(class extends Component {
  componentDidMount() {
    let { csets, M=muit(), builder, isNew, newCset} = this.props
  }
  componentWillUnmount() {
    let { trashCset, cset } = this.props
    if (!cset.isSaved) {
      trashCset(cset)
    }
  }
  componentDidUpdate() {
  }
  render() {
    const { csets, cset, M=muit(), builder, isNew, 
              vocabularies, saveCset,
    } = this.props
    // redux-form stuff:
    const {handleSubmit, pristine, reset, submitting} = this.props
    let matchBy = 'text'
    let matchStr = 'acne'
    if (!vocabularies.length) {
      return <LinearProgress mode="indeterminate" 
                style={{margin:'10%', width:'80%', height: 4, }}
                  />
    }
    if (!cset) {
      return  <LinearProgress mode="indeterminate" 
                style={{margin:'10%', width:'80%', height: 4, }} />
    }
    let vocabulary = cset.needsParam('vocabulary_id')
          && this.props.vocabulary_id
          && vocabularies.find(d=>d.vocabulary_id===this.props.vocabulary_id)

    if (cset.selectMethodName() === 'fromAtlas') {
      return (
        <Paper style={M('paper')} zDepth={2} >
          <h4>Definition downloaded from {' '}
            <a href={`http://www.ohdsi.org/web/atlas/#/conceptset/${cset.id()}/details`}>
              public Atlas concept sets
            </a>
          </h4>
          <C.CsetView M={M} csetId={cset.id()} load={true}/>
        </Paper>
      )
    }
    let selectMethodField = 
                <Field name="selectMethodName" 
                      style={{padding:'0px 8px 0px 8px',width:'80%'}}
                      component={SelectField}
                      floatingLabelText={'Select concepts by'}
                      onChange={
                        (evt, selectMethodName, prevValue) => {
                          saveCset(cset,{selectMethodName})
                        }
                      }
                >
                  {
                    Object
                      .entries(cset$.selectMethods||[])
                      .map(([k,v]) => {
                          return <MenuItem 
                              disabled={v.disabled}
                              desktop={true}
                              className="select-method"
                              key={k}
                              checked={k === cset.selectMethodName()}
                              //value={cset.selectMethodName()}
                              value={k}
                              primaryText={k}
                            />
                      })
                  }
                </Field>
    return  <Paper style={M('paper')} zDepth={2} >
              <h3>
                <C.CsetView M={M} csetId={cset.id()} load={true}/>
                {cset.cidCnt() 
                  ? <SaveButton 
                        buttonProps={{
                          onClick:()=>saveCset(cset,{isSaved:true})
                        }}
                        //buttonProps={{label:'what?'}}
                      />
                  : null
                }
                {cset.isSaved() 
                  ? <DeleteIcon />
                  : null
                }
                {/*pristine
                  ? null
                  : <SaveButton 
                        onClick={()=>alert('save me!')}
                        buttonProps={{label:'what?'}}
                      />
                */}
              </h3>
              <form style={{marginLeft:20}} onSubmit={e=>e.preventDefault()}>
                {selectMethodField}
                {
                  cset.cidCnt()
                    ?  <Field name="name" 
                          style={{padding:'0px 8px 0px 8px',width:'60%'}}
                          component={TextField}
                          floatingLabelText='ConceptSet Name'
                          onChange={
                            (evt, name, prevValue) => {
                              saveCset(
                                cset,
                                { name,
                                  selectMethodParams: {
                                    ...cset.selectMethodParams(),
                                    name,
                                  }
                                })
                            }
                          }
                      />
                    : null
                }
                {
                  cset.needsParam('vocabulary_id')
                    ?  <Field name="vocabulary_id" 
                          style={{padding:'0px 8px 0px 8px',width:'60%'}}
                          component={SelectField}
                          //floatingLabelText={vocabulary ? vocabulary.vocabulary_version : 'Choose Vocabulary'}
                          floatingLabelText='Vocabulary'
                          onChange={
                            (evt, vocabulary_id, prevValue) => {
                              saveCset(
                                cset,
                                { selectMethodParams: {
                                    ...cset.selectMethodParams(),
                                    vocabulary_id,
                                  }
                                })
                            }
                          }
                      >
                        {
                          (vocabularies||[]).map(
                            d=>{
                                return <MenuItem 
                                  disabled={!d.include}
                                  desktop={true}
                                  className="vocab-item"
                                  key={d.vocabulary_id}
                                  checked={vocabulary && d.vocabulary_id === vocabulary.vocabulary_id}

                                  value={d.vocabulary_id}
                                  primaryText={d.vocabulary_id}
                                  secondaryText={d.vocabulary_name}
                                  />
                            })
                        }
                      </Field>
                    : null
                }
                {
                  cset.needsParam('vocabulary_id') && vocabulary
                    ? <FlatButton
                        primary={true}
                        style={{padding:'0px', margin:'0px 0px 8px 0px',}}
                        href={vocabulary.vocabulary_reference}
                        target="_blank"
                        //label={<div>{vocabulary.vocabulary_name}<br/> {vocabulary.vocabulary_version}</div>}
                        icon={<LinkIcon />}
                      >
                        {vocabulary.vocabulary_name}
                      </FlatButton> 
                    : null
                }
                <br/>
                {
                  cset.needsParam('matchStr')
                    ?  <Field name="matchStr" 
                          style={{padding:'0px 8px 0px 8px',width:'60%'}}
                          component={TextField}
                          floatingLabelText='Text (% for wildcard)'
                          onChange={
                            (evt, matchStr, prevValue) => {
                              saveCset(
                                cset,
                                { selectMethodParams: {
                                    ...cset.selectMethodParams(),
                                    matchStr,
                                  }
                                })
                            }
                          }
                      />
                    : null
                }

                <hr/>
                {
                /*
                <AgTable data={cset.concepts()||[]}
                      width={"100%"} height={250}
                      id="src_target_recs" />
                */
                }
              </form>
            </Paper>
  }
})
ConceptSetBuilder = reduxForm({
  form: 'concept_builder',  // a unique identifier for this form
  /*
  onChange: (values, dispatch, props) => {
    props.saveCset(props.cset.obj())
  },
  */
})(ConceptSetBuilder)
 
ConceptSetBuilder = connect(
  (state, props) => {
    let cset = cset$.getCset(state)(props.csetId,state.concepts)
    if (!cset) {
      throw new Error("shouldn't be here")
    }
    return {
      csets: cset$.csets(state),
      cset,
      initialValues: {...cset.obj(),...cset.selectMethodParams()},
      ...cset.selectMethodParams(),
      vocabularies: state.vocabularies||[],
    }
  }
  , dispatch=>bindActionCreators(_.pick(cset$,[
      'newCset','trashCset','saveCset']), dispatch)
)(ConceptSetBuilder)
export default ConceptSetBuilder
