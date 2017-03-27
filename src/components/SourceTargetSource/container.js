import { connect } from 'react-redux';
import { browserHistory, } from 'react-router'
import React, { Component } from 'react';
import actions from '../../actions';
import SourceTargetSourceForm from './presenter';
import { get } from 'lodash';

console.error("WAHT THE?", actions);
class FormVals extends Component {
  constructor(props) {
    super(props);
  }
	componentWillMount() {
		//this.props.loadRecs(this.props);
	}

	render() {
		return <SourceTargetSourceForm {...this.props} 
              initialValues={
                {vocabulary_id:'ICD9CM', 
                 concept_codes:'401.1%,401.2,401.3%',}}
              onSubmit={
                data=>{
                  console.clear();
                  console.log("submitted", data, actions, this.props);
                  return actions.sourceTargetSource.loadFromSourceCodes(data);
                }
              }
            />;
	}
              //handleSubmit={actions.loadFromSourceCodes}
}

function mapStateToProps(state) {
  console.log('sourceTargetSource state', state);
  return state.stsReducer;
	//return { user: get(state, 'sourceTargetSource.recs'), };
}

const mapDispatchToProps = {
	//loadRecs: actions.sourceTargetSource.loadFromSourceCodes,
};

export default connect (
	mapStateToProps,
	mapDispatchToProps
)(FormVals);
