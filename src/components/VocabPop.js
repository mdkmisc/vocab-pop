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
const DEBUG = true;
var d3 = require('d3');
if (DEBUG) window.d3 = d3;
import _ from 'supergroup'; // in global space anyway...

import React, { Component } from 'react';
import { Button, Panel, Modal, Checkbox, 
          OverlayTrigger, Tooltip,
          FormGroup, Radio } from 'react-bootstrap';

import * as util from '../utils';
import {commify} from '../utils';
import DataTable from './FixedDataTableSortFilt';
//import yaml from 'js-yaml';
//import yamlLoader from 'yaml-configuration-loader';
import domains from '../domains.yml';


export class Domains extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    //let domains = yamlLoader.load('../domains.yml');
    //var domains = require("json!yaml!./domains.yml");
    console.log(domains);
  }
  render() {
    return <div>hi</div>;
  }
}
