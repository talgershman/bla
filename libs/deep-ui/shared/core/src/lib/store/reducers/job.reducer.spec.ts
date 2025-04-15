import {jobAPIActions} from '../actions/job.actions';
import {initialState, reducer} from './job.reducer';

describe('Job Reducer', () => {
  describe('set loading', () => {
    it('action - patch job failed - should be false', () => {
      const action = jobAPIActions.patchJobFailed;

      const result = reducer(initialState, action);

      expect(result).toEqual(jasmine.objectContaining({isLoading: false}));
    });

    it('action - patch perfect transform job failed - should be false', () => {
      const action = jobAPIActions.patchPerfectTransformJobFailed;

      const result = reducer(initialState, action);

      expect(result).toEqual(jasmine.objectContaining({isLoading: false}));
    });
  });
});
