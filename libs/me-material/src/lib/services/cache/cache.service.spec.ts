import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeWindowService} from '../window/window.service';
import {MeCacheService} from './cache.service';
import {CacheOptionsToken, MeCacheType} from './cache-entities';

describe('MeCacheService', () => {
  let spectator: SpectatorService<MeCacheService>;
  const key = 'testing_cache_';
  const cacheOptions = {
    isLocalEnv: false,
    persistentKeyPrefix: key,
  };
  const getServiceKey = (localKey: string): string => {
    return `${key}${localKey}`;
  };

  const createService = createServiceFactory({
    service: MeCacheService,
    providers: [MeWindowService, {provide: CacheOptionsToken, useValue: cacheOptions}],
  });

  beforeEach((): void => {
    spectator = createService();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('get', () => {
    const dummyData = {a: '1%$#fsdf', b: 4445, 'sdf-fg': 45};

    it('should retrieve from application cache', () => {
      const testKey = 'get_app';
      spectator.service.cacheObject[testKey] = dummyData;

      const data = spectator.service.get(MeCacheType.Application, testKey, {
        persistent: false,
      });

      expect(data).toEqual(dummyData);
    });

    it('should retrieve from session cache', () => {
      const testKey = 'get_session';
      const encodedData = JSON.stringify(dummyData);
      sessionStorage.setItem(testKey, encodedData);

      const data = spectator.service.get(MeCacheType.SessionStorage, testKey, {
        persistent: false,
      });

      expect(data).toEqual(dummyData);
    });

    it('should retrieve from storage cache', () => {
      const testKey = 'get_local';
      const encodedData = JSON.stringify(dummyData);
      localStorage.setItem(testKey, encodedData);

      const data = spectator.service.get(MeCacheType.LocalStorage, testKey, {
        persistent: false,
      });

      expect(data).toEqual(dummyData);
    });
  });

  describe('set', () => {
    const dummyData = {a: '1%$#dfg', b: 45};

    it('should presist to application cache', () => {
      const testKey = 'set_app';
      const localKey = getServiceKey(testKey);

      spectator.service.set(MeCacheType.Application, testKey, dummyData, {
        persistent: true,
      });

      const testedData = spectator.service.cacheObject[localKey];

      expect(dummyData).toEqual(testedData);
    });

    it('should presist to session cache', () => {
      const testKey = 'set_session';
      const localKey = getServiceKey(testKey);

      spectator.service.set(MeCacheType.SessionStorage, testKey, dummyData, {
        persistent: true,
      });

      const testedData = JSON.parse(sessionStorage.getItem(localKey));

      expect(dummyData).toEqual(testedData);
    });

    it('should presist to localStorage cache', () => {
      const testKey = 'set_storage';
      const localKey = getServiceKey(testKey);

      spectator.service.set(MeCacheType.LocalStorage, testKey, dummyData, {
        persistent: true,
      });

      const testedData = JSON.parse(localStorage.getItem(localKey));

      expect(dummyData).toEqual(testedData);
    });
  });

  describe('remove', () => {
    const dummyData = {a: '1%$#fsdf', b: 'zzz', bla: {a: 45}};

    it('should remove item from application', () => {
      const testKey = 'remove_app';
      spectator.service.cacheObject[key] = dummyData;

      spectator.service.remove(MeCacheType.Application, testKey);
      const data = spectator.service.cacheObject[testKey];

      expect(data).toBeUndefined();
    });

    it('should remove item from session', () => {
      const testKey = 'remove_session';
      const encodedData = JSON.stringify(dummyData);
      sessionStorage.setItem(testKey, encodedData);

      spectator.service.remove(MeCacheType.SessionStorage, testKey);
      const data = sessionStorage.getItem(testKey);

      expect(data).toBeNull();
    });

    it('should remove item from localStorage', () => {
      const testKey = 'remove_storage';
      const encodedData = JSON.stringify(dummyData);
      sessionStorage.setItem(key, encodedData);

      spectator.service.remove(MeCacheType.SessionStorage, testKey);
      const data = localStorage.getItem(testKey);

      expect(data).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache types', () => {
      const dummyData = {a: '1%$#fsdf', b: 'zzz', bla: {a: 45}};
      const testKey = 'clear_cache';
      sessionStorage.setItem(testKey, JSON.stringify(dummyData));
      localStorage.setItem(testKey, JSON.stringify(dummyData));
      spectator.service.cacheObject[testKey] = dummyData;
      spectator.service.cacheObject[`${testKey}1`] = dummyData;

      spectator.service.clearCache();

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      expect(Object.keys(spectator.service.cacheObject).length).toBe(0);
    });
  });

  describe('clearCacheForPartialKey', () => {
    const dummyData = {a: '1%$#fsdf', b: 'zzz', bla: {a: 45}};
    it('should clear only partial', () => {
      const testKey = 'clear_cache_partial';
      const dummyDataStr = JSON.stringify(dummyData);
      sessionStorage.setItem(testKey, dummyDataStr);
      sessionStorage.setItem('123', dummyDataStr);
      localStorage.setItem(testKey, dummyDataStr);
      localStorage.setItem('123', dummyDataStr);
      spectator.service.cacheObject[testKey] = dummyData;
      spectator.service.cacheObject['123'] = dummyData;

      spectator.service.clearCacheForPartialKey(MeCacheType.LocalStorage, 'clear');

      expect(localStorage.length).toBe(1);
      expect(sessionStorage.length).toBe(2);
      expect(Object.keys(spectator.service.cacheObject).length).toBe(2);

      spectator.service.clearCacheForPartialKey(MeCacheType.SessionStorage, 'clear');

      expect(localStorage.length).toBe(1);
      expect(sessionStorage.length).toBe(1);
      expect(Object.keys(spectator.service.cacheObject).length).toBe(2);

      spectator.service.clearCacheForPartialKey(MeCacheType.Application, 'clear');

      expect(localStorage.length).toBe(1);
      expect(sessionStorage.length).toBe(1);
      expect(Object.keys(spectator.service.cacheObject).length).toBe(1);
    });
  });
});
