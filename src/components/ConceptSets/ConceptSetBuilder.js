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
    let { M=muit(), builder, isNew, newCset} = this.props
    /* can't deal with this now
    this.unregisterLeaveHook = this.props.router.setRouteLeaveHook(props.route, this.routerWillLeave.bind(this));
    this.handler = window.addEventListener("beforeunload", (ev) => {  
      debugger
        ev.preventDefault();
        return ev.returnValue = 'Are you sure you want to close?';
    })
  routerWillLeave(nextLocation) {
    return false;        
  }
    */
  }
  componentWillUnmount() {
    let { trashCset, csetId } = this.props
    /*
    this.unregisterLeaveHook()
    if (!cset.sameAsPersisted()) {
      window.confirm("hi")
    }
    debugger
    if (!cset.persistent()) {
      //trashCset(cset)
    }
    */
  }
  componentDidUpdate() {
  }
  render() {
    const { csetId, builder, isNew, 
              vocabularies, 
              showInfoDumpValue, 
              showSelectFormValue, 
    } = this.props
    let { M=Muit() } = this.props
    // redux-form stuff:
    const {handleSubmit, pristine, reset, submitting} = this.props
    let cset = cset$.getCset(csetId)
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
    M = M.props({sub:cset.subThemeName()})
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
                      onChange={(evt,selectMethodName,prev)=>
                        cset.update({selectMethodName})}
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
    let selectForm =
      <form style={{marginLeft:20}} onSubmit={e=>e.preventDefault()}>
        {selectMethodField}
        {
          cset.cidCnt()
            ?  <Field name="name" 
                  style={{padding:'0px 8px 0px 8px',width:'60%'}}
                  component={TextField}
                  floatingLabelText='ConceptSet Name'
                  onChange={(evt,name,prev)=>
                    cset.update({name})}
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
                  onChange={(evt,vocabulary_id,prev)=>
                    cset.updateSelectParams({vocabulary_id})}
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
                  onChange={(evt,matchStr,prev)=>
                    cset.updateSelectParams({matchStr})}
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
    return  (<Paper style={M('paper')} zDepth={2} >
              <Field name="showInfoDump" 
                  component={Toggle} 
                  label={showInfoDumpValue 
                          ? `Don't show info dump`
                          : `Show info dump`}
              />
              { showInfoDumpValue ? <C.InfoDump cset={cset} /> : null }
              
              <Field name="showSelectForm" 
                  component={Toggle} 
                  label={showSelectFormValue 
                          ? `Don't show select form`
                          : `Show select form`}
              />
              { showSelectFormValue ? selectForm : null }
              
              <h3>
                <C.CsetView M={M} csetId={cset.id()} load={true}/>
                { 
                  /*
                  (!cset.persistent() && cset.cidCnt()) ||
                  (cset.persistent() && !cset.sameAsPersisted())
                  */
                  cset.needsPersisting()
                  ? <SaveButton 
                        buttonProps={{
                          onClick:()=>cset.persist()
                        }}
                      />
                  : null
                }
                <Field name="includeDescendants" 
                  style={{padding:'0px 8px 0px 8px',width:'60%'}}
                  component={Checkbox}
                  label='Include descendants'
                  onChange={(evt,includeDescendants,prev)=>
                    cset.update({includeDescendants})}
                  normalize={val=>!!val}
                />
                <Field name="includeMapped" 
                  style={{padding:'0px 8px 0px 8px',width:'60%'}}
                  component={Checkbox}
                  label='Include mapped'
                  onChange={(evt,includeMapped,prev)=>
                    cset.update({includeMapped})}
                  normalize={val=>!!val}
                />

                {cset.persistent() 
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
            </Paper>
    )
  }
})
ConceptSetBuilder = reduxForm({
  form: 'concept_builder',  // a unique identifier for this form
})(ConceptSetBuilder)

const formSelector = formValueSelector('concept_builder')
ConceptSetBuilder = connect(
  (state, props) => {
    //let cset = cset$.getCset(state)(props.csetId)
    let cset = cset$.getCset(props.csetId)
    if (!cset) {
      throw new Error("shouldn't be here")
    }
    return {
      //cset,
      initialValues: {
        ...cset.obj(),
        ...cset.selectMethodParams(),
        showInfoDump: false,
        showSelectForm: !cset.valid(),
      },
      ...cset.selectMethodParams(),
      vocabularies: state.vocabularies||[],
      showInfoDumpValue: formSelector(state,'showInfoDump'),
      showSelectFormValue: formSelector(state,'showSelectForm'),
    }
  }
  , dispatch=>bindActionCreators(_.pick(cset$,[
      'newCset','trashCset',]), dispatch)
)(ConceptSetBuilder)
export default ConceptSetBuilder
