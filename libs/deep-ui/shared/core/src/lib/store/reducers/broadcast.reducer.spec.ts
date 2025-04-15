import {broadcastEffectsActions} from '../actions/broadcast.actions';
import {initialState, reducer} from './broadcast.reducer';

describe('Broadcast Reducer', () => {
  describe('new UI version', () => {
    it('action - Update Other Tabs', () => {
      const action = broadcastEffectsActions.updateOtherTabs;

      const result = reducer(initialState, action);

      expect(result).toEqual(jasmine.objectContaining({isNewUIVersion: true}));
    });
  });
});
