import { browserHistory, } from 'react-router'
import * as AppState from '../../AppState'
import Rx from 'rxjs/Rx'
import * as myrouter from '../myrouter'

/* eslint-disable */
//export const NEW_PARAMS = 'NEW_PARAMS';
export const VOCABULARY_ID = 'VOCABULARY_ID';
export const CONCEPT_CODES = 'CONCEPT_CODES';

export const LOAD_FROM_SOURCECODES = 'LOAD_FROM_SOURCECODES';
export const LOAD_FROM_SOURCECODES_FULFILLED = 'LOAD_FROM_SOURCECODES_FULFILLED';
export const LOAD_FROM_SOURCECODES_REJECTED = 'LOAD_FROM_SOURCECODES_REJECTED';

export const LOAD_VOCABS = 'LOAD_VOCABS';
export const LOAD_VOCABS_FULFILLED = 'LOAD_VOCABS_FULFILLED';
export const LOAD_VOCABS_REJECTED = 'LOAD_VOCABS_REJECTED';



let someDefaultVals = {
      vocabulary_id:'ICD9CM', 
      concept_codes:'401.1%,401.2,401.3%',
    }
let apiCallsProcessed: 0 // just to force refreshes without having to specify everyything in connect
export default (state=someDefaultVals, action) => {
  //console.log('sourceTargetSource REDUCER', {state, action})
  switch (action.type) {
    /*
    case NEW_PARAMS:
      change url here
      return {
        ...state,
        values: action.payload,
      };
      */
    case LOAD_FROM_SOURCECODES:
    case VOCABULARY_ID:
    case CONCEPT_CODES:
      return {
        ...state,
        fromSrcErr: undefined,
        values: action.payload,
        recs:undefined,
        isPending: true,
      };
    case LOAD_FROM_SOURCECODES_FULFILLED:
      let recs = action.payload
      if (recs.length) {
        return { ...state, isPending: false, recs, apiCallsProcessed:++apiCallsProcessed }
      }
      return { ...state, isPending: false, recs:undefined,
        fromSrcErr: {statusText: 'No matching concepts'},
        apiCallsProcessed:++apiCallsProcessed };
    case LOAD_FROM_SOURCECODES_REJECTED:
      return {
        ...state,
        isPending: false,
        fromSrcErr: action.payload,
        apiCallsProcessed:++apiCallsProcessed,
      };


    case LOAD_VOCABS:
      return {
        ...state,
        vocabErr: undefined,
        vocabPernding: true,
        values: action.payload,
        vocabs:undefined,
      };
    case LOAD_VOCABS_FULFILLED:
      let vocabs = action.payload
      return { ...state, vocabs,
                apiCallsProcessed:++apiCallsProcessed,
                vocabPending: false }
    case LOAD_VOCABS_REJECTED:
      return {
        ...state, vocabPending: false,
        vocabErr: action.payload,
        apiCallsProcessed:++apiCallsProcessed,
      };
    default:
      return state
  }
}

export const loadFromSourceCodes = (
    (values) => {
      console.log('LOAD_FROM_SOU..', values)
      return ({ type: LOAD_FROM_SOURCECODES, 
                   payload: values })
    }
)
export const loadedFromSourceCodesFulfilled = 
    (payload) => ({ type: LOAD_FROM_SOURCECODES_FULFILLED, 
                   payload})

export const loadFromSourceCodesEpic =
  (action$) => {
    console.log(action$)
    return (
      action$.filter(
        action=>_.includes([
          VOCABULARY_ID,CONCEPT_CODES,LOAD_FROM_SOURCECODES
        ], action.type)
      )
      .switchMap(action => {
        let {type, payload} = action
        let {vocabulary_id, concept_codes} = payload
        let stream = new AppState.ApiStream({
          apiCall: 'codesToSource',
          params: payload,
          wantRxAjax: true,
        })
        return (
          stream.rxAjax
            .flatMap(response =>
              Rx.Observable.concat(
                Rx.Observable.of(
                  { type: myrouter.QUERY_PARAMS, 
                    payload: {vocabulary_id,concept_codes}}),
                Rx.Observable.of(loadedFromSourceCodesFulfilled(response))
              )
            )
            .catch(error => {
              return Rx.Observable.of({
                        type: LOAD_FROM_SOURCECODES_REJECTED,
                        payload: error.xhr.response,
                        error: true
                      })
            })
        )
      })
  //browserHistory.push({vocabulary_id, concept_codes})
  )}

export const loadVocabs = (
    (values) => ({ type: LOAD_VOCABS, payload: values }))
export const loadedVocabsFulfilled = 
    (payload) => ({ type: LOAD_VOCABS_FULFILLED, 
                   payload})
export const loadVocabsEpic =
  (action$) => (
    action$.ofType(LOAD_VOCABS)
      .mergeMap(action => {
        let stream = new AppState.ApiStream({
          apiCall: 'vocabularies',
          params: {},
          wantRxAjax: true,
        })
        return (
          stream.rxAjax
            .map(response => loadedVocabsFulfilled(response))
            .catch(error => {
              return Rx.Observable.of({
                        type: LOAD_VOCABS_REJECTED,
                        payload: error.xhr.response,
                        error: true
                      })
            }))
      })
  )

// later...
//dispatch(fetchUser('torvalds'));


  //return services.sourceTargetSource.load(values)

