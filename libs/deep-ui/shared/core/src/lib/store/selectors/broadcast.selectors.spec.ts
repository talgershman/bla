import {State} from '../reducers/broadcast.reducer';
import {selectIsNewUIVersion} from './broadcast.selectors';

describe('Broadcast Selectors', () => {
  it('empty', () => {
    expect(true).toBeTrue();
  });

  describe('selectIsNewUIVersion', () => {
    it('should show false', () => {
      const initialState: State = {isNewUIVersion: false};

      const result = selectIsNewUIVersion.projector(initialState);

      expect(result).toBeFalse();
    });
  });
});
