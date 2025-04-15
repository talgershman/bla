import {createReducer} from '@ngrx/store';
import {immerOn} from 'ngrx-immer/store';

import {jobAPIActions} from '../actions/job.actions';

export const jobFeatureKey = '[Job Feature]';

export interface State {
  isLoading: boolean;
}

export const initialState: State = {
  isLoading: false,
};

export const reducer = createReducer(
  initialState,
  immerOn(
    jobAPIActions.patchJobFromDialogFinished,
    jobAPIActions.patchJobSuccess,
    jobAPIActions.patchJobFailed,
    jobAPIActions.patchPerfectTransformJobSuccess,
    jobAPIActions.patchPerfectTransformJobFailed,
    jobAPIActions.patchJobsDataRetentionSuccess,
    jobAPIActions.patchJobsDataRetentionFailed,
    jobAPIActions.patchPerfectTransformJobsDataRetentionSuccess,
    jobAPIActions.patchPerfectTransformJobsDataRetentionFailed,
    jobAPIActions.patchDatasetDataRetentionSuccess,
    jobAPIActions.patchDatasetDataRetentionFailed,
    (state) => {
      state.isLoading = false;
    }
  ),
  immerOn(
    jobAPIActions.patchJobFromDialog,
    jobAPIActions.patchPerfectTransformJobFromDialog,
    jobAPIActions.patchJobsDataRetentionFromDialog,
    jobAPIActions.patchPerfectTransformJobsDataRetentionFromDialog,
    jobAPIActions.patchDatasetDataRetention,
    (state) => {
      state.isLoading = true;
    }
  )
);
