/*
Copyright 2016 Sigfried Gold

   Licensed under the Apache License, Version 2.0 (the "License")
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/* eslint-disable */

var d3 = require('d3')
var $ = require('jquery')
import _ from '../../supergroup' // in global space anyway...
import React, { Component } from 'react'


import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { bindActionCreators } from 'redux'

import * as cncpt from '../../redux/ducks/concept'

import Spinner from 'react-spinner'
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap'
//if (DEBUG) window.d3 = d3
import {AgTable, ConceptTree, } from '../TableStuff'
import SortableTree from 'react-sortable-tree'

import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from '../../utils'

import ReactTooltip from 'react-tooltip'
window.ReactTooltip = ReactTooltip

import {GridList, GridTile} from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';
import Chip from 'material-ui/Chip'
import muiThemeable from 'material-ui/styles/muiThemeable';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as muit from '../../muitheme'
import MenuItem from 'material-ui/MenuItem'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import ArrowIcon from 'material-ui/svg-icons/navigation/arrow-forward.js'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, } from 'material-ui/Card'

// not using most of this: http://www.material-ui.com/#/components/list
import {List, ListItem} from 'material-ui/List'
import ContentInbox from 'material-ui/svg-icons/content/inbox'
import ActionGrade from 'material-ui/svg-icons/action/grade'
import ContentSend from 'material-ui/svg-icons/content/send'
import ContentDrafts from 'material-ui/svg-icons/content/drafts'
import Divider from 'material-ui/Divider'
import ActionInfo from 'material-ui/svg-icons/action/info' 

import Avatar from 'material-ui/Avatar'

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

export const getConceptSetAsCard = ({getWith, getArg, props={}}) => {
  let concepts
  switch(getWith) {
    case 'concepts':
      concepts = getArg || []
    case 'concept_ids':
      throw new Error("need to load from concept_ids")
    case 'concept_code_search_pattern':
      throw new Error("need to load from code pattern")
    default:
      throw new Error("don't know how to do that")
  }
  return <ConceptSetAsCard concepts={concepts} {...props} />
}
const WrapForSc = ({sc, ...props}) => {
  let scTheme = muit.scThemes[sc]
  //props = {...props, scTheme}
  return  <MuiThemeProvider muiTheme={scTheme}>
            {props.children}
          </MuiThemeProvider>
}
/*
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
*/
const CdmRecsAvatar = muiThemeable()(props => {
  let {contents, val, muiTheme, ...rest} = props
  return  <Avatar
            color='white'
            backgroundColor={muiTheme.palette.regular}
            size={30}
            {...rest}
            /*
            style={{width:'auto',
                    textAlign: 'right',
                    margin:'-4px 10px 10px -10px',
                    padding:5,
                    //...styles.font,
            }}
            */
          >
            { contents }
          </Avatar>
})
const OneSc = muiThemeable()(props => {
  let {concepts, title, style={}, muiTheme} = props
  let pal = muiTheme.palette
  let colCnts = cncpt.colCntsFromConcepts(concepts)
  return  <div style={style} >
              {
                colCnts.map(
                  (cnt,i)=>{
                    let ttId = _.uniqueId('oneScTtId-')
                    return (
                      <div
                          key={i}
                          //data-tip={"rdiv" + colname(cnt)}
                      >
                      <ReactTooltip id={ttId} place="bottom" effect="solid"/>
                      <RaisedButton 
                          //fullWidth={true}
                          key={i}
                          style={{
                            //width: '90%',
                            //margin: '5%',
                            //padding: 5,
                            //backgroundColor: pal.light,
                            //width:400, 
                            //height:colCnts.length * 180 + 200,
                            //top:85,
                            //border: '3px dotted orange',
                          }}
                          primary={true} 
                          labelStyle={{textTransform:'none'}}
                          label={`${title ? title + ' ' : ''}${commify(cnt.cnt)}`}
                          labelPosition="before"
                          data-tip={colname(cnt)}
                          data-for={ttId}
                          icon={
                            <CdmRecsAvatar
                                contents={ cncpt.conceptTableAbbr(cnt.tbl) }
                            />
                          }
                      />
                      </div>
                    )
                  })
              }
          </div>
})
const colname = cnt => {
  let cn = `${cnt.tbl}.${cnt.col}`
  console.log(cn)
  return cn
}
const scDescForSet = concepts => {
  let bySc = cncpt.conceptsBySc(concepts) // just supergroups by 'standard_concept'
                .filter(sc=>cncpt.rcsFromConcepts(sc.records))

  const gridStyles = {  // GridList styles based on One line example
                        // http://www.material-ui.com/#/components/grid-list
    parent: {
      width: '100%',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      //border: '5px solid red',
    },
    gridList: {
      width: '100%',
      display: 'flex',
      flexWrap: 'nowrap',
      overflowX: 'auto',
    },
    title: {
      //minHeight: 40,
      //height: 40,
      //color: scTheme.palette.primary1Color,
      //color: 'rgb(0, 188, 212)',
    },
    tile: sc => ({
      zoom: 0.8, 
      backgroundColor: muit.getColors(sc).light,
      background: `linear-gradient(to top, 
                                    ${muit.getColors(sc).light} 0%,
                                    ${muit.getColors(sc).regular} 70%,
                                    ${muit.getColors(sc).dark} 100%)`,
      width: '100%',
      //minWidth: '100%',
      minHeight: 100,
    }),
    child: {
      //border: '5px solid purple',
      width: '100%',
      //height: '100%',
      marginTop: 50,
      //position: 'relative',
    }
  }
  return  <div style={gridStyles.parent}>
            <GridList
              cellHeight={'auto'}
              //cellHeight={150}
              style={gridStyles.gridList}
              //cols={bySc.length}
              cols={.3}
            >
              {
                bySc.map((sc,i) => {
                  return  <WrapForSc sc={sc.toString()} key={i}>
                            <GridTile
                              cols={16}
                              rows={21}
                              style={gridStyles.tile(sc)}
                              titleStyle={gridStyles.title}
                              title={`${sc.records.length} ${cncpt.scName(sc.records[0])}`}
                              //subtitle={<span>by <b>{tile.author}</b></span>}
                              //actionIcon={<IconButton><StarBorder color="white" /></IconButton>}
                              titlePosition='top'
                              //titleBackground={gradient}
                            >
                              <OneSc concepts={sc.records} 
                                      //title={sc.toString()}
                                      style={gridStyles.child}
                                //title={`${sc.records.length} ${cncpt.scName(sc.records[0])}`}
                              />
                            </GridTile>
                          </WrapForSc>
                })
              }
            </GridList>
          </div>
}
class ConceptSetAsCard extends Component {
  componentDidMount() {
    const {concept_ids, loadConceptInfo, storeName} = this.props
    if (concept_ids && concept_ids.length) {
      loadConceptInfo({params:{concept_ids}, storeName})
    }
  }
  componentDidMount() {
    //this.csTtId = _.uniqueId('csTtId-')
  }
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  render() {
    let { muiTheme,
          title,
          subtitle,
          concepts=[], } = this.props

    if (concepts.length < 1)
      return null
    const singleConcept = concepts.length === 1
    const cardStyles = {
      root: {
        margin: '3%',
        zoom: 0.8, 
        width: '94%',
        //borderRadius: '100%',
        borderRadius: '.8em',
        backgroundColor: muit.getColors().lighter,
        padding: 10,
        boxShadow: `inset 0 0 .9em .5em ${muit.getColors().darker}, 0 0 .9em .5em ${muit.getColors().darker}`,
        //boxShadow: `inset 0 0 2em 2em ${muit.getColors().darker}`,
//inset 0 0 0.5em 0.5em indigo, 0 0 0.5em 0.5em indigo;  /* padding:1em */
        
      },
      title: {
        ...muit.getStyles().headerLight,
        boxShadow: `.2em .2em .7em ${muit.getColors().darker}`,
        //backgroundColor: muiTheme.palette.atlasDarkBg,
        //color: muiTheme.palette.alternateTextColor,
      },
      text: {
      }
    }
    const gridStyles = { // GridList styles based on Simple example
                         // http://www.material-ui.com/#/components/grid-list
      parent: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
      },
      gridList: {
        //border: '5px solid pink',
        width: '100%',
        //height: 450,
        overflowY: 'auto',
      },
      tile: {
        zoom: 0.8, 
        backgroundColor: muit.getColors().light,
        width: '100%',
        //border: '5px solid green',
      },
      title: {
        fontSize: '1.6em',
        color: muit.getColors().darker,
      },
      child: {
        paddingTop:60,
        width: '100%',
      }
    }
    return (
      <Card
          style={cardStyles.root}
          expandable={true} 
            initiallyExpanded={true} 
      >
        <CardTitle
          titleStyle={cardStyles.title}
          title={title}
          //titleColor={muit.scThemes.X.palette.primary1Color}
          subtitle={subtitle}
          //subtitleColor={muit.scThemes.X.palette.primary1Color}
          showExpandableButton={true}
          actAsExpander={true}
        />
        <CardText expandable={true}
                  style={cardStyles.text} >
          <div style={gridStyles.parent}>
            <GridList cellHeight={'auto'} 
                      cols={singleConcept ? 1 : 2}
                      style={gridStyles.gridList} >
              <GridTile 
                        titleBackground='rgba(0,0,0,0)'
                        titlePosition='top'
                        titleStyle={gridStyles.title}
                        title='CDM Records' 
                        style={gridStyles.tile}
              >
                <div style={gridStyles.child} >
                  {scDescForSet(concepts)}
                  {
                  /*
                    _.supergroup(_.flatten(concepts.map(d=>d.rels)), 'relationship')
                      .map( (rel,i) =>
                        <ConceptSetAsCard key={i}
                          concepts={[concept]}
                          concept_ids={_.flatten(rel.records.map(d=>d.relcids))}
                          title={concept.concept_name} />
                        let title = `${rel.records.length} ${rel.toString()} concepts`
                                    [<ConceptSetConnected 
                                      title={title}
                                      storeName={title}
                                      concept_ids={_.flatten(rel.records.map(d=>d.relcids))}
                                    />]
                    )
                    */
                  }



                </div>
              </GridTile>
              { singleConcept ? [] :
                <GridTile 
                          titleBackground='rgba(0,0,0,0)'
                          titlePosition='top'
                          titleStyle={gridStyles.title}
                          title='Individual Concepts' 
                          style={gridStyles.tile}
                >
                  <div style={gridStyles.child} >
                    { concepts.map( (concept,i) => 
                        <ConceptSetAsCard key={i}
                          concepts={[concept]}
                          title={concept.concept_name} />
                    )}
                  </div>
                </GridTile>
              }
            </GridList>
          </div>
        </CardText >
      </Card>
    )
  }
}
ConceptSetAsCard = muiThemeable()(ConceptSetAsCard)
/*
ConceptSetAsCard = connect(
  (state, props) => {
    let {storeName} = props
    return {
      concepts: props.concepts ||
                vocab.apis.conceptInfoApi.selectors('conceptInfoApi')
                      .results(state)(storeName),
    }
  },
  (dispatch, ownProps) => {
    return {
      loadConceptInfo: ({params,storeName}) => {
        let loadAction = vocab.apis.conceptInfoApi.actionCreators
                            .load({params,storeName})
        let fakeState = vocab.apis.conceptInfoApi.callsReducer({},loadAction)
        let fakeCall = fakeState[storeName]
        dispatch(fakeCall)
      }
    }
  }
)(ConceptSet)
*/
export {ConceptSetAsCard}

/*
 *
export const getCounts = ({concepts=[], ...opts}) => {
  if (!_.isEmpty(opts))
    debugger //throw new Error("opt to handle?")
  
  let tblcols = _.supergroup( 
                    _.flatten(concepts.map(d=>d.rcs)),
                    ['tbl','col'])
  let cnts = 
    tblcols
      .leafNodes()
      .map((col,k) => ({
        colName: col.toString(),
        tblName: col.parent.toString(),
        col,
        cnts: _.chain(['rc','src','crc'])
                .map(cntType=>[cntType, col.aggregate(_.sum,cntType)])
                .filter(c => c[1]>0)
                .fromPairs()
                .value(),
      }))
  return cnts
}
const countText = (concepts) => {
  let colCnts = cncpt.getCounts({concepts})
  return (
    colCnts.map(
      ({cnts,col,colName,tblName},i) => {
        let msg = ''
        if (_.keys(cnts).length > 1) {
          msg = 'Only expect a single count type per concept!'
        }
        let cntTxt = _.map(cnts, (cnt,type) =>
                          <span key={type} >
                            <span style={{fontWeight:'bold'}}>
                              {commify(cnt)} {' '}
                              { // PUT PRETTY NAME CONVERSION SOMEWHERE BETTER
                                ({rc:'Standard',
                                  src:'Non-standard (source)',
                                  crc:'Classification (should only appear in descendant counts)'
                                })[type]
                              }
                            </span>{' '}
                            records
                          </span>
                      )
        return (<div key={i}>
                  {cntTxt} in {' '}
                  <span style={{fontWeight:'bold'}}>{colName} </span>
                  column of
                  <span style={{fontWeight:'bold'}}> {tblName} </span>
                </div>)
      }))
}
*/


/*
export class ConceptAsListItem extends Component {
  render() {
    let {title, subtitle, children, nestedItems, avatarText, ...otherProps} = this.props
    if (avatarText)
      return <ConceptWithCodeInAvatar {...this.props} />
    return (
      <ListItem
        innerDivStyle={{
          paddingTop: 3,
          paddingBottom: 3, }}
        primaryText={title}
        secondaryText={ subtitle }
        initiallyOpen	={false}
        nestedListStyle={{marginLeft:30, fontSize:5}}
        nestedItems={ nestedItems }
        {...otherProps}
      >
        {children}
      </ListItem>
    )
  }
}
const ConceptWithCodeInAvatar = props => {
  // old code, maybe formatting is useful
  let {title, subtitle, children, nestedItems, avatarText, styles={},
          ...otherProps} = props
  return (
    <ListItem
      innerDivStyle={{
        padding: '10px 10px 0px 78px',
        marginBottom: 0,
        ...styles.item,
        ...styles.font,
      }}
      leftAvatar={
        avatarText ?  <Avatar
                        color={this.props.muiTheme.palette.alternateTextColor}
                        backgroundColor={this.props.muiTheme.palette.primary1Color}
                        size={30}
                        style={{width:'auto',
                                textAlign: 'right',
                                margin:'-4px 10px 10px -10px',
                                padding:5,
                                ...styles.font,
                        }}
                      >
                        {avatarText}
                      </Avatar>
                  : undefined
      }
      containerElement={
        <span style={{
          margin: 0,
          padding:0,
          ...styles.font,
        }} />
      }
      primaryText={
        <span style={{
          margin: 0,
          padding:0,
          ...styles.font,
        }}>
          {title}
        </span>
      }
      secondaryText={ 
        <span style={{
          margin: 0,
          padding:0,
          ...styles.font,
        }}>
          {subtitle}
        </span>
      }
      secondaryTextLines={2}
      initiallyOpen={true}

      nestedItems={ nestedItems }
      {...otherProps}
    >
      {children}
    </ListItem>
  )
}
*/
