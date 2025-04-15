import {inject, Injectable} from '@angular/core';
import {MeWindowService} from '@mobileye/material/src/lib/services/window';
import {b64DecodeUnicode} from '@mobileye/material/src/lib/utils';

import {CacheOptionsToken, MeCacheEntities, MeCacheOptions, MeCacheType} from './cache-entities';

@Injectable()
export class MeCacheService {
  private cacheOptions = inject<MeCacheOptions>(CacheOptionsToken);
  private windowService = inject(MeWindowService);

  cacheObject: any = {};
  inMemoryStorageCache: any = {
    localStorage: {},
    sessionStorage: {},
  };

  /**
   * Retrieve data by key
   *
   * @param cacheType - cacheType (Application, SessionStorage, LocalStorage)
   * @param keyName - string keyName
   * @param persistent - is persistent
   */
  get(cacheType: MeCacheType, keyName: string, {persistent = false}: MeCacheEntities = {}): any {
    let cacheTypeValue = cacheType;
    if (this.cacheOptions.isLocalEnv && !persistent) {
      cacheTypeValue = MeCacheType.SessionStorage;
    }

    const keyNameValue = persistent
      ? `${this.cacheOptions.persistentKeyPrefix}${keyName}`
      : keyName;
    let data = null;
    let rawLSData = null;
    switch (cacheTypeValue) {
      case MeCacheType.Application:
        if (this.cacheObject[keyNameValue]) {
          data = this.cacheObject[keyNameValue];
        }
        break;
      case MeCacheType.LocalStorage:
        if (this.inMemoryStorageCache.localStorage[keyNameValue]) {
          data = this.inMemoryStorageCache.localStorage[keyNameValue];
        } else {
          rawLSData = this.windowService.nativeWindow.localStorage.getItem(keyNameValue);
          const value = this._checkAndReplaceEncodedData(rawLSData, keyNameValue);
          data = JSON.parse(value);
        }
        break;
      case MeCacheType.SessionStorage:
        if (this.inMemoryStorageCache.sessionStorage[keyNameValue]) {
          data = this.inMemoryStorageCache.sessionStorage[keyNameValue];
        } else {
          rawLSData = this.windowService.nativeWindow.sessionStorage.getItem(keyNameValue);
          const value = this._checkAndReplaceEncodedData(rawLSData, keyNameValue);
          data = JSON.parse(value);
        }
        break;
      default:
    }
    return data;
  }

  /**
   * Set data in cache
   *
   * @param cacheType - cacheType (Application, SessionStorage, LocalStorage)
   * @param keyName - string keyName
   * @param data - data to cache
   */
  set(
    cacheType: MeCacheType,
    keyName: string,
    data: any,
    {persistent = false}: MeCacheEntities = {},
  ): void {
    let cacheTypeValue = cacheType;
    if (this.cacheOptions.isLocalEnv && !persistent) {
      cacheTypeValue = MeCacheType.SessionStorage;
    }

    const keyNameValue = persistent
      ? `${this.cacheOptions.persistentKeyPrefix}${keyName}`
      : keyName;
    switch (cacheTypeValue) {
      case MeCacheType.Application:
        this.cacheObject[keyNameValue] = data;
        break;
      case MeCacheType.LocalStorage:
        this.inMemoryStorageCache.localStorage[keyNameValue] = data;
        this.windowService.nativeWindow.localStorage.setItem(keyNameValue, JSON.stringify(data));
        break;
      case MeCacheType.SessionStorage:
        this.inMemoryStorageCache.sessionStorage[keyNameValue] = data;
        this.windowService.nativeWindow.sessionStorage.setItem(keyNameValue, JSON.stringify(data));
        break;
      default:
    }
  }

  /**
   * remove data by key
   *
   * @param cacheType - cacheType (None, Application, SessionStorage, LocalStorage)
   * @param keyName - string keyName
   */
  remove(
    cacheType: MeCacheType,
    keyName: string,
    {persistent = false}: MeCacheEntities = {},
  ): void {
    let cacheTypeValue = cacheType;
    if (this.cacheOptions.isLocalEnv && !persistent) {
      cacheTypeValue = MeCacheType.SessionStorage;
    }
    const keyNameValue = persistent
      ? `${this.cacheOptions.persistentKeyPrefix}${keyName}`
      : keyName;
    switch (cacheTypeValue) {
      case MeCacheType.Application:
        if (this.cacheObject[keyNameValue]) {
          // remove key from application cache if exist
          delete this.cacheObject[keyNameValue];
        }
        break;
      case MeCacheType.LocalStorage:
        this.windowService.nativeWindow.localStorage.removeItem(keyNameValue);
        break;
      case MeCacheType.SessionStorage:
        this.windowService.nativeWindow.sessionStorage.removeItem(keyNameValue);
        break;
      default:
    }
  }

  /**
   * Clear Cache in all cached objects
   */
  clearCache(): void {
    this.cacheObject = {};
    this._clearLocalStorage();
    sessionStorage.clear();
  }

  /**
   * Clear Cache, for keys that start with partial key, in all cached objects
   */
  clearCacheForPartialKey(cacheType, partialKey): void {
    let cacheTypeValue = cacheType;
    if (this.cacheOptions.isLocalEnv) {
      cacheTypeValue = MeCacheType.SessionStorage;
    }

    let keys = [];
    switch (cacheTypeValue) {
      case MeCacheType.Application:
        keys = Object.keys(this.cacheObject);
        break;
      case MeCacheType.LocalStorage:
        keys = Object.keys(this.windowService.nativeWindow.localStorage);
        break;
      case MeCacheType.SessionStorage:
        keys = Object.keys(this.windowService.nativeWindow.sessionStorage);
        break;
      default:
    }
    keys.forEach((key) => {
      if (key.startsWith(partialKey)) {
        this.remove(cacheTypeValue, key);
      }
    });
  }

  private _clearLocalStorage(): void {
    const keys = Object.keys(localStorage);
    const persistentItems = [];
    // save persistent values
    keys.forEach((key) => {
      if (key.startsWith(this.cacheOptions.persistentKeyPrefix)) {
        persistentItems.push({key, value: localStorage.getItem(key)});
      }
    });

    // clear cache
    localStorage.clear();

    // restore persistent values
    persistentItems.forEach((item) => {
      localStorage.setItem(item.key, item.value);
    });
  }

  private _isBase64(str: string): boolean {
    if (!str) {
      return false;
    }
    // Check if it matches the Base64 pattern
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

    // Check length and match pattern
    return str.length % 4 === 0 && base64Pattern.test(str);
  }

  private _checkAndReplaceEncodedData(str: string, key: string): string {
    if (this._isBase64(str)) {
      const data = b64DecodeUnicode(str);
      this.set(MeCacheType.LocalStorage, key, data);
      return data;
    }
    return str;
  }
}
