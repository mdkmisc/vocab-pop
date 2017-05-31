/* eslint-disable */
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

import * as config from '../config'
import React, { Component } from 'react';

import _ from '../supergroup';
import Form from "react-jsonschema-form";

export class FilterForm extends Component {
  constructor(props) {
    super(props);
    this.state = { 
    };
  }
  componentDidMount() {
  }
  componentWillUnmount() {
    this.filtSub && this.filtSub.unsubscribe();
  }
  render() {
    return <h3>need to fix</h3>
    const filterFormSchema = config.getSetting('filterFormSchema')
    const filters = config.getSetting('filters')
    debugger
    return <div>
            <h1>hello</h1>
            <Form schema={filterFormSchema}
                  //uiSchema={filterFormUISchema}
                  onChange={this.formChange.bind(this)}
                  onError={this.formError.bind(this)}
                  //onSubmit={log("submitted")}
                  formData={filters}
                  >
              <span/>
            </Form>
          </div>
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
