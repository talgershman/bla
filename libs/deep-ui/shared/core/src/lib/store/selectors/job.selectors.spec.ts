import {State} from '../reducers/job.reducer';
import {isPatchJobLoading} from './job.selectors';

describe('Job Selectors', () => {
  it('empty', () => {
    expect(true).toBeTrue();
  });

  describe('isPatchJobLoading', () => {
    it('should show false', () => {
      const initialState: State = {
        isLoading: false,
      };

      const result = isPatchJobLoading.projector(initialState);

      expect(result).toBeFalse();
    });

    it('should show true', () => {
      const initialState: State = {
        isLoading: true,
      };

      const result = isPatchJobLoading.projector(initialState);

      expect(result).toBeTrue();
    });
  });
});
