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
  //console.log('dataservice', action);
  switch (action.type) {
    case 'GET_FROM_SOURCE_CODES':
    case '@@redux-form/SET_SUBMIT_SUCCEEDED':
      let stream = new AppState.ApiStream({
        apiCall: 'codesToSource',
        params: action.params,
        //params: {vocabulary_id, concept_codes}, // get these somehow
        //meta: { statePath },
        //transformResults,
      });
      return stream.subscribe(
        recs => {
          console.log('do something with the recs!', recs);
          /* forget where to get errors -- probably stop using ApiStream?
          if (err) {
            return next({
              type: 'GET_FROM_SOURCE_CODES_ERROR',
              err
            })
          }
          */
          //const data = JSON.parse(res.text)
          next({
            type: 'GET_FROM_SOURCE_CODES_RECEIVED',
            recs,
          });
        });
      break
    default:
      break
  }
};
let API = function(...args) {
  console.error('trying to call api', args);
}
function sourceTargetSourceReducer(something, action) {
  //console.log('trying to reduce sourceTargetSource', {something, action})
  return action;
};
let services = {
                'sourceTargetSource': { 
                  //load: dataService,   // ????
                  //reducer:  sourceTargetSourceReducer,
                },
                API, 
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
