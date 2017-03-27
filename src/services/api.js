//import feathers from 'feathers/client';
//import hooks from 'feathers-hooks';
//import rest from 'feathers-rest/client';
//import superagent from 'superagent';
//import reduxifyServices from 'feathers-reduxify-services';
import * as AppState from '../AppState';
/*
let API = feathers()
	.configure(rest('/api').superagent(superagent))
	.configure(hooks());
*/
const dataService = store => next => action => {
	next(action)
	switch (action.type) {
	case 'GET_TODO_DATA':
    let stream = new AppState.ApiStream({
      apiCall: 'codesToSource',
      params: { concept_codes: '401.1%,401.2,401.3% 706% 401',
                vocabulary_id: 'ICD9CM' },
      //params: {vocabulary_id, concept_codes}, // get these somehow
      //meta: { statePath },
      //transformResults,
    });
    stream.subscribe(
      recs => {
        console.log('do something with the recs!', recs);
        /* forget where to get errors -- probably stop using ApiStream?
				if (err) {
					return next({
						type: 'GET_TODO_DATA_ERROR',
						err
					})
				}
        */
				//const data = JSON.parse(res.text)
				next({
					type: 'GET_TODO_DATA_RECEIVED',
					recs,
				});
      });
		break
	default:
		break
	}
};
let API = function(...args) {
  console.log('trying to call api', args);
}
function sourceTargetSourceReducer(something, action) {
  console.log('trying to reduce sourceTargetSource', {something, action})
  return action;
};
let services = {
                API, 
                'sourceTargetSource': { 
                  get: dataService,   // ????
                  reducer:  sourceTargetSourceReducer,
                },
};
export default API;
export {
	services, dataService,
};
/*
let services = reduxifyServices(
	API,
	{
		'sourceTargetSource': 'sourceTargetSource',
	}
);
*/
/*
//import request from 'superagent'



export default dataService
*/
