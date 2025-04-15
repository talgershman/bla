import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {DeepUtilService} from './deep-util.service';

describe('DeepUtilService', () => {
  let spectator: SpectatorHttp<DeepUtilService>;

  const createHttp = createHttpFactory({
    service: DeepUtilService,
    mocks: [],
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getCurrentUserTeams', () => {
    it('should get raw teams with extra', () => {
      const extraUserGroups = [
        'deep-admin',
        'deep-fpa-object-extra',
        'DEEP-AAA-BBB-server-extra',
        'deep-fpa-REM-server',
      ];
      const key = 'currentUserTeams';
      spectator.service[key] = extraUserGroups;
      const expectResult = [
        'deep-admin',
        'deep-fpa-object-extra',
        'DEEP-AAA-BBB-server-extra',
        'deep-fpa-REM-server',
      ];

      const groups = spectator.service.getCurrentUserTeams();

      expect(expectResult).toEqual(groups);
    });
  });

  describe('getArraySortedByDeepTeams', () => {
    it('should return sorted', () => {
      const arr = [
        {
          team: 'bad-group',
          name: 'a',
        },
        {
          team: 'deep-fpa-objects',
          name: 'b',
        },
        {
          team: 'bad-group-2',
          name: 'c',
        },
        {
          team: 'deep-fpa-objects-server',
          name: 'd',
        },
      ];

      const groups = spectator.service.getArraySortedByDeepTeams(arr);

      expect(groups.map((item) => item.name)).toEqual(['b', 'd', 'a', 'c']);
    });
  });
});
