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
// @flow
// npm run-script flow
import * as util from '../utils';
import React, { Component } from 'react';
import * as AppState from '../AppState';
//import * as VocabPop from './VocabPop';
import _ from 'supergroup'; // in global space anyway...
import {commify} from '../utils';


export default class ConceptData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      counts: {},
      agg: [],
    };
    //this.streamsRequested = [];
    this.countStreamsToWatch = {}; 
    // All,Inv,NoMatch,NonStd, and ONLY current With filt
  }
  render() {
    const {filters} = this.props;
    const {counts, agg, classes} = this.state;
    return <div>
              {React.cloneElement(this.props.children, {
                  filters,
                  counts,
                  agg,
                  classes,
                })}
           </div>;
  }
  componentDidMount() {
    this.countSub( 'All', {
        excludeInvalidConcepts: false,
        excludeNoMatchingConcepts: false,
        excludeNonStandardConcepts: false, });
    this.countSub( 'Invalid', {
        includeFiltersOnly: true,
        includeInvalidConcepts: true, });
    this.countSub( 'No matching concept', {
        includeFiltersOnly: true,
        includeNoMatchingConcepts: true, });
    this.countSub( 'Non-standard concepts', {
        includeFiltersOnly: true,
        includeNonStandardConcepts: true, });

    this.countsSubscriber = new AppState.StreamsSubscriber(
      streams=>this.streamsCallback(streams,'counts'));
    this.aggSubscriber = new AppState.StreamsSubscriber(
      streams=>this.streamsCallback(streams,'agg'));
    this.fetchData();
  }
  componentDidUpdate(prevProps, prevState) {
    // should only need to fetch data if filters change, right?
    if (!_.isEqual(prevProps.filters, this.props.filters)) {
      this.fetchData();
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    //let equal = _.isEqual(this.state.counts, nextState.counts);
    let stateChange = !_.isEqual(this.state, nextState);
    let propsChange = !_.isEqual(this.props, nextProps);
    //console.log(this.state, nextState, 'stateChange', stateChange);
    //console.log(this.props, nextProps, 'propsChange', propsChange);
    return stateChange || propsChange;
  }
  componentWillUnmount() {
    //AppState.unsubscribe(this);
    this.countsSubscriber.unsubscribe();
    this.aggSubscriber.unsubscribe();
  }
  countSub(displayName, filters) {
    let params = {  ...filters, 
                    queryName:displayName,
                    dataRequested: 'counts',
                 }; 
    if (this.props.domain_id)
      params.domain_id = this.props.domain_id;
    let stream = new AppState.ApiStream({
        apiCall: 'conceptCounts', 
        params,
        singleValue: true,
        transformResults: 
          (results) => ConceptData.formatCounts(results, displayName),
        meta: {
          statePath: `counts.${displayName}`,
        }
      });
    this.countStreamsToWatch[displayName] = stream;
    //if (stream.newInstance) this.streamsRequested.push(stream);
  }
  fetchData() {
    const {filters, domain_id} = this.props;
    //console.log('in Drug.fetchData with filters', filters);
    this.countSub('With current filters', filters);
    this.countsSubscriber.filter( stream => 
        _.includes( _.values(this.countStreamsToWatch), 
                   stream));

    let params = {...filters, queryName: 'agg',
                    dataRequested: 'agg',
                    targetOrSource: 'both',
                  }; 
    if (this.props.domain_id)
      params.domain_id = this.props.domain_id;
    let aggStream = new AppState.ApiStream({
        apiCall: 'conceptCounts', 
        meta: {
          statePath: `agg`,
        },
        transformResults: 
          results => results.map(
            rec => {
              rec.record_count = parseInt(rec.record_count,10);
              rec.concept_count = parseInt(rec.concept_count,10);
              return rec;
            }),
      });
    if (this.aggStream !== aggStream) {
      this.aggStream = aggStream;
      this.aggSubscriber.filter(stream => aggStream === stream);
    } else {
      console.log('created same aggStream');
    }

    params = {  ...filters, 
                    queryName:'classes',
                    dataRequested: 'not using in this call but still required',
                 }; 
    if (this.props.domain_id)
      params.domain_id = this.props.domain_id;
    let classRelStream = new AppState.ApiStream({
        //apiCall: 'classRelations', 
        apiCall: 'classPedigree', 
        params,
        meta: {
          statePath: `classes`,
        },
        /*
        transformResults: 
          results => results.map(
            rec => {
              rec.record_count = parseInt(rec.record_count,10);
              rec.concept_count = parseInt(rec.concept_count,10);
              return rec;
            }),
        */
      });
    if (this.classRelStream !== classRelStream) {
      this.classRelStream = classRelStream;
      this.aggSubscriber.filter(stream => classRelStream === stream);
    } else {
      console.log('created same classRelStream');
    }
  }
  streamsCallback(streams, subName) {
    //console.log(`Drug ${subName} streamsSubscriber`, streams);
    let state = _.merge({}, this.state);
    streams.forEach(stream => {
      _.set(state, stream.meta.statePath, stream.results);
    })
    this.setState(state);
  }
  static formatCounts(dcc, displayName) {
    return {
          'Drug exposures': commify(parseInt(dcc.record_count,10)),
          'Drug concepts': commify(parseInt(dcc.concept_count,10)),
    };
  }
}
