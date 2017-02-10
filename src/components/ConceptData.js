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
//import * as util from '../utils';
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
    this.streamsToWatch = {}; 
    // All,Inv,NoMatch,NonStd, and ONLY current With filt
  }
  render() {
    const {filters} = this.props;
    const {counts, agg, cgdc, concept_groups, dcid_cnts_breakdown} = this.state;
    return  <div style={{width:'100%', height:'100%'}}
                  className="concept-data">
              {React.cloneElement(this.props.children, {
                  filters,
                  counts,
                  agg,
                  concept_groups: cgdc,
                })}
           </div>;
  }
  componentDidMount() {
    const {filters, domain_id} = this.props;

    let params = {  ...filters, 
                    queryName:'concept_groups',
                    //dataRequested: 'not using in this call but still required',
                 }; 
    if (domain_id) params.domain_id = domain_id;
    params.grpset = 'domain_id,standard_concept,vocabulary_id';
    this.requestStream({apiCall:'conceptCounts',dataRequested:'agg',
                        statePath:'agg', queryName:'agg',targetOrSource:'both',});
    this.requestStream({apiCall:'concept_groups', params,
                        statePath:'concept_groups', });
    this.requestStream({apiCall:'dcid_cnts_breakdown', params,
                        statePath:'dcid_cnts_breakdown', });


    this.requestStream({
      apiCall:'conceptCounts',dataRequested:'counts',singleValue:true,
      statePath:'counts.All', queryName:'All',targetOrSource:'both',
      filters: { excludeInvalidConcepts: false, excludeNoMatchingConcepts: false,
                 excludeNonStandardConcepts: false, },
      transformResults:results=>ConceptData.formatCounts(results, 'All'), });
    this.requestStream({
      apiCall:'conceptCounts',dataRequested:'counts',singleValue:true,
      statePath:'counts.Invalid', queryName:'Invalid',targetOrSource:'both',
      filters: { includeFiltersOnly: true, includeInvalidConcepts: true, },
      transformResults:results=>ConceptData.formatCounts(results, 'Invalid'), });
    this.requestStream({
      apiCall:'conceptCounts',dataRequested:'counts',singleValue:true,
      statePath:'counts.No matching concept', queryName:'No matching concept',targetOrSource:'both',
      filters: { includeFiltersOnly: true, includeNoMatchingConcepts: true, },
      transformResults:results=>ConceptData.formatCounts(results, 'No matching concept'), });
    this.requestStream({
      apiCall:'conceptCounts',dataRequested:'counts',singleValue:true,
      statePath:'counts.Non-standard concepts', queryName:'Non-standard concepts',targetOrSource:'both',
      filters: { includeFiltersOnly: true, includeNonStandardConcepts: true, },
      transformResults:results=>ConceptData.formatCounts(results, 'Non-standard concepts'), });
    this.requestStream({apiCall:'conceptCounts',dataRequested:'agg',
                        statePath:'agg', queryName:'agg',targetOrSource:'both',});
  }
  requestStream({apiCall, statePath, queryName, dataRequested, 
            targetOrSource, transformResults, filters=this.props.filters}) {
    const {domain_id} = this.props;
    let params = {...filters, queryName,
                    domain_id, dataRequested,
                    targetOrSource,
                  }; 
    let stream = new AppState.ApiStream({
        apiCall,
        params,
        meta: { statePath },
        transformResults,
      });
    if (this.streamsToWatch[statePath] &&
        this.streamsToWatch[statePath] !== stream) {
      console.log('replacing', statePath);
      this.streamsToWatch[statePath].unsubscribe();
    }
    this.streamsToWatch[statePath] = stream;
    stream.subscribe(this.newData.bind(this));
  }
  componentDidUpdate(prevProps, prevState) {
    // should only need to fetch data if filters change, right?
    if (
           !_.isEqual(prevProps.filters, this.props.filters)
        || !_.isEqual(prevProps.domain_id, this.props.domain_id)
    ) {
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
    _.each(this.streamsToWatch, s => s.unsubscribe());
  }
  newData() {
    let state = Object.assign({}, this.state);
    //console.log('newData', _.keys(this.streamsToWatch));
    _.each(this.streamsToWatch, (stream,name) => {
      if (stream.results && 
          !_.isEqual(_.get(state, stream.meta.statePath), stream.results)) {
        //console.log('newData for', stream.meta.statePath);
        _.set(state, stream.meta.statePath, stream.results);
      }
    })
    if (state.concept_groups && state.dcid_cnts_breakdown && !state.cgdc) {
      state.cgdc = this.combineCgDc(_.cloneDeep(state.concept_groups), state.dcid_cnts_breakdown);
    }
    this.setState(state);
    window.ConceptDataState = state;
  }
  combineCgDc(cg, dc) { // for now just doing sc/dom/voc and desc/children
    let byDgid = _.supergroup(dc.filter(d=>d.drc||d.dsrc),'dcid_grp_id');
    let empty = []; // for debugging convenience, use the same empty array, allows checking w/ _.uniq

    // add descendant concept groups
    let wDc = cg.map(g => Object.assign(g, {dc:(byDgid.lookup(g.dcid_grp_id)||{}).records||empty}));
        
    wDc
      .filter(d=>d.grp === 15)
      .forEach(g => {
      let dcs = g.dc.filter(d=>d.grp===15);
      g.linknodes = dcs.map(d=>d.vals.join(','));

      // add drilldown concept groups
      let deeperGroups=wDc.filter(d=>_.compact(d.vals).join(',').match(g.vals.join(',')+'.'));
      g.drill = _.supergroup(
                    deeperGroups, 
                    [d=>d.grpset.slice(3).join(','), d=>d.vals.slice(3).join(',')]);
    });
    return wDc;
  }
  fetchData() {
    const {filters, domain_id} = this.props;
    //console.log('in Drug.fetchData with filters', filters);
    this.requestStream({
      apiCall:'conceptCounts',dataRequested:'counts',singleValue:true,
      statePath:'counts.With current filters', queryName:'With current filters',targetOrSource:'both',
      filters: { includeFiltersOnly: true, includeNonStandardConcepts: true, },
      transformResults:results=>ConceptData.formatCounts(results, 'With current filters'), });

    this.requestStream({apiCall:'conceptCounts',dataRequested:'agg',
                        statePath:'agg', queryName:'agg',targetOrSource:'both',});
  }
  static formatCounts(dcc, displayName) {
    return {
          'Drug exposures': commify(parseInt(dcc.record_count,10)),
          'Drug concepts': commify(parseInt(dcc.concept_count,10)),
    };
  }
}
