import {InjectionToken} from '@angular/core';

export interface MeCacheOptions {
  isLocalEnv: boolean;
  persistentKeyPrefix: string;
}

export const CacheOptionsToken = new InjectionToken<MeCacheOptions>('CacheOptions');

export interface MeCacheEntities {
  persistent?: boolean;
}

export enum MeCacheType {
  Application = 1,
  SessionStorage = 2,
  LocalStorage = 3,
}
