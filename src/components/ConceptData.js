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
//import * as util from '../utils';
import React, { Component } from 'react';
import Rx from 'rxjs/Rx';
import * as AppState from '../AppState';
//import * as VocabPop from './VocabPop';
import _ from 'supergroup'; // in global space anyway...
import {commify} from '../utils';

export function firstLastEvent(rxSubj, ms) {
  return (Rx.Observable.merge(rxSubj.debounceTime(ms), rxSubj.throttleTime(ms))
          .distinctUntilChanged());
}

export class DataWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { };
    this.streamsToWatch = {}; 
  }
  render() {
    let props = Object.assign({}, this.props, this.state);
    //console.log('DataWrapper', props);
    let classNames = props.classNames || '';
    delete props.classNames;
    return  <div className={'data-wrapper ' + classNames}>
              {React.cloneElement(this.props.children, props)}
           </div>;
  }
  requestStream(opts, apiParams) {
    let {apiCall, statePath, transformResults=d=>d} = opts;
    statePath = statePath || apiCall;
    let stream = new AppState.ApiStream({
        apiCall,
        params:apiParams,
        meta: { statePath },
        transformResults,
      });
    if (this.streamsToWatch[statePath] &&
        this.streamsToWatch[statePath] !== stream) {
      //console.log('replacing', statePath);
      this.streamsToWatch[statePath].unsubscribe();
    }
    this.streamsToWatch[statePath] = stream;
    stream.subscribe(this.newData);
  }
  componentDidMount() {
    this.newData = this.newData.bind(this);
    this.newPropsSubj = new Rx.BehaviorSubject();
    this.newPropsSub = firstLastEvent(this.newPropsSubj, 200)
                          .subscribe(calls => this.fetchData())
    this.setState({forceUpdate:true});
  }
  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevProps.calls, this.props.calls)) {
      this.newPropsSubj.next(this.props.calls);
    }
  }
  componentWillUnmount() {
    _.each(this.streamsToWatch, s => s.unsubscribe());
    this.newPropsSubj.unsubscribe();
  }
  newData() {
    const {parentCb=d=>d} = this.props;
    let state = Object.assign({}, this.state);
    console.log('newData', _.keys(this.streamsToWatch));
    _.each(this.streamsToWatch, (stream,name) => {
      if (stream.results && 
          !_.isEqual(_.get(state, stream.meta.statePath), stream.results)) {
        //console.log('newData for', stream.meta.statePath);
        _.set(state, stream.meta.statePath, stream.results);
      }
    })
    /*
    if (state.concept_groups && state.dcid_cnts_breakdown && !state.concept_groups_d) {
      state.concept_groups_d = this.combineCgDc(_.cloneDeep(state.concept_groups), state.dcid_cnts_breakdown);
      state.vocgroups = this.vocgroups(_.cloneDeep(state.concept_groups), state.dcid_cnts_breakdown);
    }
    */
    //window.ConceptDataState = state;
    this.setState(state); // make a way to cancel if obsolete
    parentCb(state);
  }
  fetchData() {
    const {calls} = this.props;
    //console.log('fetching data', calls[0].apiParams.concept_id);
    calls.forEach(ac=>{
      let {apiParams, ...opts} = ac;
      this.requestStream(opts, apiParams);
    });
  }
  shouldComponentUpdate(nextProps, nextState) {
    let stateChange = !_.isEqual(this.state, nextState);
    let propsChange = !_.isEqual(this.props, nextProps);
    return stateChange || propsChange;
  }
}
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
    //const {filters} = this.props;
    //const {counts, agg, concept_groups_d, concept_groups, dcid_cnts_breakdown, vocgroups} = this.state;
    let props = Object.assign({}, this.props, this.state);
    let classNames = props.classNames || '';
    delete props.classNames;
    //filters, counts, agg, concept_groups: concept_groups_d, vocgroups,
    return  <div className={'concept-data ' + classNames}>
              {React.cloneElement(this.props.children, props)}
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
      //console.log('replacing', statePath);
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
    if (state.concept_groups && state.dcid_cnts_breakdown && !state.concept_groups_d) {
      state.concept_groups_d = this.combineCgDc(_.cloneDeep(state.concept_groups), state.dcid_cnts_breakdown);
      state.vocgroups = this.vocgroups(_.cloneDeep(state.concept_groups), state.dcid_cnts_breakdown);
    }
    window.ConceptDataState = state;
    this.setState(state);
  }
  vocgroups(cgs, dcnts) {
    let byDcgId = _.supergroup(dcnts.filter(d=>d.grp===7), 'dcid_grp_id')
    let empty = []; // for debugging convenience, use the same empty array, allows checking w/ _.uniq
    let vgs = cgs
              .filter(cg=>cg.grp===7)
              .map( // add descendant concept groups to each concept group
                  cg => Object.assign(cg, 
                          {dcgs:(byDcgId.lookup(cg.dcid_grp_id)||{}).records||empty}));
        
    return vgs;
    //let sg = _.supergroup(vgs, ["standard_concept", "domain_id", "vocabulary_id", "class_concept_id"]);
    //debugger;
  }
  combineCgDc(cgs, dcnts) { // for now just doing sc/dom/voc and desc/children
    // this will all need optimization
    let byDgid = _.supergroup(dcnts.filter(d=>d.drc||d.dsrc),'dcid_grp_id');
    let empty = []; // for debugging convenience, use the same empty array, allows checking w/ _.uniq

    cgs = cgs.map( // add descendant concept groups to each concept group
      cg => Object.assign(cg, {dcgs:(byDgid.lookup(cg.dcid_grp_id)||{}).records||empty}));
        
    cgs // add linknodes and drill info
        // for now just do this to sc/dom/voc....but this will get more complex
      .filter(d=>d.grp === 15)  
      .forEach(cg => {
        let dcs = cg.dcgs.filter(d=>d.grp===15);
        // link nodes are only the descendant concept groups at the same level (sc/dom/voc)
        cg.linknodes = dcs.map(d=>d.vals.join(','));

        let deeperGroups= cgs.filter(
          // for deeper groupings...
          // like sc/dom/voc/tbl/col/coltype, this would just be the tbl/col/coltype vals
          d=>( d.grpset.length > cg.grpset.length &&
                d.grpset.slice(cg.grpset.length).join(',') === cg.grpset.join(',') &&
                d.vals.slice(cg.grpset.length).join(',') === cg.vals.join(',')
              ));
        // so cg.drill is a supergroup of the values deeper than the level of this cg
        // first level is grouping, like 'tbl,col,coltype'
        // then each distinct set of deeperGroup vals in that grouping, like
        // 'drug_exposure,drug_concept_id,target'
        cg.drill = _.supergroup(deeperGroups, 
                                d=>d.grpset.slice(cg.grpset.length).join(','),
                                {dimName:'subgroups'});
        cg.drill.addLevel(d=>d.vals.slice(3).join(','), {dimName:'subvals'});
        cg.drill.leafNodes().forEach(
          drillGroup => { if (drillGroup.records.length !== 1)
                            throw new Error("unexpected") });
      });
    return cgs;
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
