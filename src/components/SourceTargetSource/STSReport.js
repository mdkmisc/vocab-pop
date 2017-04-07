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
import _ from '../../supergroup'; // in global space anyway...
import React, { Component } from 'react'


import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'

import Spinner from 'react-spinner'
import {Glyphicon, Row, Col, 
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap'
//if (DEBUG) window.d3 = d3
//import {ConceptInfo, ConceptSetFromCode, ConceptSetFromText} from '../ConceptInfo'
import {AgTable, ConceptTree, } from '../TableStuff'
import SortableTree from 'react-sortable-tree';
require('../sass/Vocab.css')

import {commify, updateReason, 
        setToAncestorHeight, setToAncestorSize, getAncestorSize,
        getRefsFunc, sendRefsToParent,
        ListenerWrapper, ListenerTargetWrapper,
        LoadingButton} from '../../utils'
//import * as AppState from '../../AppState'

import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import ArrowIcon from 'material-ui/svg-icons/navigation/arrow-forward.js'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, } from 'material-ui/Card';
import Chip from 'material-ui/Chip'

// not using most of this: http://www.material-ui.com/#/components/list
import {List, ListItem} from 'material-ui/List';
import ContentInbox from 'material-ui/svg-icons/content/inbox';
import ActionGrade from 'material-ui/svg-icons/action/grade';
import ContentSend from 'material-ui/svg-icons/content/send';
import ContentDrafts from 'material-ui/svg-icons/content/drafts';
import Divider from 'material-ui/Divider';
import ActionInfo from 'material-ui/svg-icons/action/info'; 

import Avatar from 'material-ui/Avatar';



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

export class STSReport extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sccTreeData: [],
      relationships: [],
      srcCntTreeData: [],
      scc: [],
    }
  }
  componentDidMount() {
    this.dataToState();
  }
  componentDidUpdate() {
    this.dataToState();
  }
  dataToState() {
    let {vocabulary_id, concept_code_search_pattern, recs=[], 
          sourceConceptCodesSG, 
          sourceRelationshipsSG, 
          relcounts, 
        } = this.props
    try {  
      let scc = sourceConceptCodesSG
      if (scc === this.state.scc) return
      let sccTreeData = 
        scc.map((d,i)=>({
                      d,
                      subtitle: (<ListItem key={i} 
                                              leftAvatar={
                                                <Avatar
                                                  color={muiTheme.palette.alternateTextColor}
                                                  backgroundColor={muiTheme.palette.primary1Color}
                                                  size={30}
                                                  style={{width:'auto',
                                                          margin:'3px 4px 6px -14px',
                                                          padding:5,}}
                                                >
                                                  {d.src_concept_code}
                                                </Avatar>}
                                            primaryText={d.src_concept_name}
                                        />),
                      children: d.getChildren(true).map(c=>({c,title:c.toString()}))
                    }))
      let sr = sourceRelationshipsSG
      let relationships = 
        sr.map((r,i)=>({
          name: r.toString(),
          srTreeData: 
            r.getChildren(true)
            .map((d,j) => ({
                      d,
                      subtitle: (<ListItem key={j} 
                                              primaryText={d.src_concept_name}
                                              leftAvatar={
                                                <Avatar
                                                  color={muiTheme.palette.alternateTextColor}
                                                  backgroundColor={muiTheme.palette.primary1Color}
                                                  size={30}
                                                  style={{width:'auto',
                                                          margin:'3px 4px 6px -14px',
                                                          padding:5,}}
                                                >
                                                  {d.src_concept_code}
                                                </Avatar>}
                                        />),
                      children: d.getChildren(true).map(c=>({c,title:c.toString()}))
            }))
      }))
      debugger
      let srcTblsSG = _.supergroup(relcounts.filter(d=>d.src), 'tbl')
      
      let srcCntTreeData = 
        relcounts.map((d,i)=>({
                      d,
                      title: d.toString(),
                      subtitle: `${commify(d.aggregate(_.sum,'total'))} CDM o`,
                      children: 
                        d.getChildren(true)
                         .map(c=>({
                           c,
                           title:c.toString()}))
                    }))
      this.setState({scc, sccTreeData, sr, relationships, srcCntTreeData})
    }
    catch(e) {
      console.error(e)
      debugger
    }
  }
  render() {
    let {vocabulary_id, concept_code_search_pattern, recs=[], 
          sourceConceptCodesSG,
          sourceRelationshipsSG,
          relcounts,
          sortableRowHeight=50,
    } = this.props
    let {scc, sccTreeData, sr, relationships, srcCntTreeData} = this.state;
    let treeFunc = recs => _.supergroup(recs, [
                              'src_code_match_str',
                              'src_concept_code',
                              'src_concept_id',
                              'relationship',
                              'target_concept_id'])
    /*
    let scc = _.supergroup(
      (recs||[]), d=>`${d.src_concept_code}: ${d.src_concept_name}`,{dimName:'source'})
    scc.addLevel('relationship')
    scc.addLevel(d=>`${d.src_concept_code}: ${d.src_concept_name}`,{dimName:'target'})

    scc.flattenTree().forEach(
      val => Object.defineProperty(val, 'title',
                              {get:function() {return this.toString() }})
    )
    */
    const cardStyle = {
      padding: '0px',
    };
    let codes = concept_code_search_pattern.split(/[\s,]+/)
    let styles = {
                        chip: {
                          margin: 4,
                        },
                        wrapper: {
                          display: 'flex',
                          flexWrap: 'wrap',
                        },
    }
    if (_.uniq(codes).length !== codes.length) {
      console.error("didn't expect duplicate codes")
    }
    let chips = (codes||[]).map((code,i) => (
                  <Chip key={i} style={styles.chip}
                      onRequestDelete={() => alert('not working yet')}
                  >
                    {code}
                  </Chip>))
    return  <div>
              <Card containerStyle={cardStyle} style={cardStyle}>
                <CardHeader style={{padding:'0px 8px 0px 8px'}}
                  title={<span>
                          {vocabulary_id}{' '}
                          Source <ArrowIcon/> Target <ArrowIcon/> Source Report
                        </span>}
                  subtitle={
                            <div style={styles.wrapper}>
                              Search patterns
                              {chips}
                              match {scc.length} concepts:
                            </div>}
                />
                <CardText>
                  <Card containerStyle={{margin:5}} style={cardStyle}>
                    <CardHeader 
                      style={{ fontSize: '.7em' }}
                      title={ <p style={{ fontSize: '.7em',
                                        fontWeight: 'regular',}}
                              >
                                CDM Records with matched concepts
                              </p>}
                    />
                    <CardText>
                          <SortableTree
                              isVirtualized={false}
                              rowHeight={sortableRowHeight}
                              canDrag={false}
                              treeData={srcCntTreeData}
                              onChange={srcCntTreeData => {
                                console.log('got srcCntTreeData', srcCntTreeData)
                                this.setState({ srcCntTreeData })
                              }}
                          />
                    </CardText>
                  </Card>

                  {relationships.map(
                    ({name, srTreeData},i) => (
                      <Card key={i} containerStyle={{margin:5}} style={cardStyle}>
                        <CardHeader 
                          style={{ fontSize: '.7em' }}
                          title={ <p style={{ fontSize: '.7em',
                                            fontWeight: 'regular',}}
                                  >
                                  {name} Relationship
                                  </p>}
                        />
                        <CardText>
                              <SortableTree
                                  isVirtualized={false}
                                  rowHeight={sortableRowHeight}
                                  canDrag={false}
                                  treeData={srTreeData}
                                  onChange={srTreeData => {
                                    console.log('got srTreeData', srTreeData)
                                    this.setState({ srTreeData })
                                  }}
                              />
                        </CardText>
                      </Card>
                    ))
                  }

                  {/*
                  <Card containerStyle={cardStyle} style={cardStyle}>
                    <div style={{ height: Math.min(sccTreeData.length*sortableRowHeight, 300) }}>
                        <SortableTree
                            rowHeight={sortableRowHeight}
                            canDrag={false}
                            treeData={sccTreeData}
                            onChange={sccTreeData => {
                              console.log('got sccTreeData', sccTreeData)
                              this.setState({ sccTreeData })
                            }}
                        />
                    </div>
                  </Card>
                  */}
                </CardText>
                <CardText>
              {/*
                  <List >
                    {scc.map((d,i) => <ListItem key={i} 
                                            leftAvatar={
                                              <Avatar
                                                color={muiTheme.palette.alternateTextColor}
                                                backgroundColor={muiTheme.palette.primary1Color}
                                                size={30}
                                                style={{width:'auto',
                                                        padding:5,}}
                                              >
                                          {d.toString().split(/:/)[0]} 
                                              </Avatar>}
                                          primaryText={d.toString().split(/: /)[1]} 
                                          open={true}
                                          nestedItems={
                                            d.getChildren(true).map(
                                              (rel,i) => <ListItem
                                                            key={i}
                                                            primaryText={rel.toString()}
                                                          />)}
                                      />)
                    }
                  </List>
              */}
                  
                  found {recs ? recs.length : 0} concepts
                  {(codes||[]).join(' --> ')}
                </CardText>
              </Card>
            
              {/*
              <ConceptTree
                      width={"100%"} height={200}
                      recs={recs}
                      treeFunc={treeFunc}
                      //rowSelect={node => selectCb(node)}
              />
              <pre>
                {treeFunc(recs).flattenTree().namePaths().join('\n')}
              </pre>
              <AgTable data={recs}
                      width={"100%"} height={250}
                      id="src_target_recs" />
            
              <pre>{JSON.stringify(recs,null,2)}</pre>
              */}
            </div>
  }
}

