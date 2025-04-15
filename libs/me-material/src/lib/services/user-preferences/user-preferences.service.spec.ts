import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {CacheOptionsToken, MeCacheService, MeCacheType} from '../cache';
import {MeUserPreferencesService} from './user-preferences.service';

describe('MeUserPreferencesService', () => {
  let spectator: SpectatorService<MeUserPreferencesService>;
  let cacheService: SpyObject<MeCacheService>;
  const cacheOptions = {
    isLocalEnv: false,
    persistentKeyPrefix: 'testing_cache_',
  };

  const createService = createServiceFactory({
    service: MeUserPreferencesService,
    imports: [],
    providers: [
      {provide: CacheOptionsToken, useValue: cacheOptions},
      {
        provide: 'USER_PREFERENCES_OPTIONS',
        useValue: {
          url: 'preferences-base-url',
          user$: of({
            user: 'Demo user',
            userName: 'demo@mobileye.com',
          }),
        },
      },
    ],
    mocks: [MeCacheService],
  });

  beforeEach((): void => {
    spectator = createService();
    cacheService = spectator.inject(MeCacheService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('addUserPreferences', () => {
    it('should add new merged value', () => {
      const key = 'demo@mobileye.com_VERSION_1';
      const prevData = {
        componentState: {
          st1: true,
        },
        navBar: 'collapsed',
      };
      const expectedData = {
        ...prevData,
        newKey: {
          a: 1,
        },
      };
      cacheService.get.and.returnValue(prevData);

      spectator.service['currentUserPreferences'].next(prevData);

      spectator.service.addUserPreferences('newKey', {a: 1});

      expect(cacheService.set).toHaveBeenCalledWith(MeCacheType.LocalStorage, key, expectedData);
    });
  });
});
