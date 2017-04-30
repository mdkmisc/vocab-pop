DO THIS SOON

// probably not a duck...just selectors?

import { createSelector } from 'reselect'

import * as vocab from '../vocab'

const concepts = createSelector(
  vocab.apis.conceptInfoApi.selectors('conceptInfoApi').results,
  results
  (state,storeName) => vocab.apis.conceptInfoApi.selectors('conceptInfoApi').results(state)(storeName)

const concept = state

