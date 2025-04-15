import {MeCacheOptions} from '@mobileye/material/src/lib/services/cache';
import {environment} from 'deep-ui/shared/environments';

// eslint-disable-next-line
export const cacheOptions: MeCacheOptions = {
  persistentKeyPrefix: 'deep',
  isLocalEnv: environment.isDevelopment,
};
