import {createFeatureSelector, createSelector} from '@ngrx/store';

import {jobFeatureKey, State} from '../reducers/job.reducer';

export const selectJobState = createFeatureSelector<State>(jobFeatureKey);

export const isPatchJobLoading = createSelector(selectJobState, (state: State) => state.isLoading);
