import {loadTechnologiesAPIActions} from '../actions/common.actions';
import {initialState, reducer} from './common.reducer';

describe('Common Reducer', () => {
  describe('load technologies', () => {
    it('action - load technologies success - should set state', () => {
      const fakeTechnologies = ['AV', 'TFL'];
      const action = loadTechnologiesAPIActions.loadTechnologiesSuccess({
        technologies: fakeTechnologies,
      });

      const result = reducer(initialState, action);

      expect(result).toEqual(
        jasmine.objectContaining({isTechnologiesLoaded: true, technologies: fakeTechnologies})
      );
    });
  });
});
