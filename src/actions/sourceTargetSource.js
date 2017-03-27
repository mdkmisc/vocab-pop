import { services } from '../services/api';
import { browserHistory, } from 'react-router'

function loadFromSourceCodes(p) {
  let {vocabulary_id, concept_codes} = p;
  console.log("IN LOADFROMSOURCECODES", p);
  debugger;
  browserHistory.push({vocabulary_id, concept_codes});
  return services.sourceTargetSource.load(p);
}

export default {
  loadFromSourceCodes,
};
