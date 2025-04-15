import {State} from '../reducers/session.reducer';
import {isUserAdminSelector, userTeamsSelector} from './session.selectors';

describe('Job Selectors', () => {
  it('empty', () => {
    expect(true).toBeTrue();
  });

  describe('isUserAdminSelector', () => {
    it('should show true', () => {
      const initialState: State = {
        teams: ['deep-admin'],
        user: {
          userName: 'blabla@mobileye.com',
          name: 'bla bla',
        },
        isAdmin: true,
        rawTeams: [],
      };

      const result = isUserAdminSelector.projector(initialState);

      expect(result).toBeTrue();
    });
  });

  describe('userTeamsSelector', () => {
    it('show show user deep teams', () => {
      const expectedTeams = ['deep-admin', 'deep-fpa-objects'];
      const initialState: State = {
        teams: expectedTeams,
        user: {
          userName: 'blabla@mobileye.com',
          name: 'bla bla',
        },
        isAdmin: true,
        rawTeams: [],
      };

      const result = userTeamsSelector.projector(initialState);

      expect(result).toEqual(expectedTeams);
    });
  });
});
