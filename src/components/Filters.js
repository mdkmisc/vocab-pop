/*
Copyright 2016 Sigfried Gold

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import config, {notBeingUsedRightNow} from '../config'
import React, { Component } from 'react';

import { //Nav, Navbar, Modal,
         //NavItem, Button,
         //Row, Col, 
         // NavDropdown, MenuItem, Panel, Button, 
          } from 'react-bootstrap';
//import { LinkContainer } from 'react-router-bootstrap';
//import Inspector from 'react-json-inspector';
//import 'react-json-inspector/json-inspector.css';
import _ from '../supergroup';
import Form from "react-jsonschema-form";

//const log = (type) => console.log.bind(console, type);
export class FilterForm extends Component {
  constructor(props) {
    super(props);
    this.state = { 
    };
  }
  componentDidMount() {
    throw new Error("FIX")
    /*
    this.filtSub = AxxppState.subscribeState(
      'filters', filters => {
        this.setState({filters});
      });
    */
  }
  componentWillUnmount() {
    this.filtSub && this.filtSub.unsubscribe();
  }
  render() {
    const {filterFormSchema, filterFormUISchema} = notBeingUsedRightNow;
    const filterSettings = this.state.filters || {};
    return <Form schema={filterFormSchema}
                  uiSchema={filterFormUISchema}
                  onChange={this.formChange.bind(this)}
                  onError={this.formError.bind(this)}
                  //onSubmit={log("submitted")}
                  formData={filterSettings}
                  >
              <span/>
            </Form>
  }
  formChange({edit,errors,formData}) {
    throw new Error("FIX")
    /*
    AxxppState.sOLDaveState('filters', formData);
    */
  }
  formError({edit,errors,formData}) {
    console.error(errors);
  }
}
