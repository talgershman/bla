import {inject, ModuleWithProviders, NgModule} from '@angular/core';

import {MeCacheService} from './cache.service';
import {CacheOptionsToken, MeCacheOptions} from './cache-entities';

@NgModule({
  declarations: [],
  imports: [],
})
export class MeCacheModule {
  constructor() {
    const parentModule = inject(MeCacheModule, {optional: true, skipSelf: true});

    if (parentModule) {
      const msg = 'MeCacheModule is already loaded. Import it in the AppModule only';
      // eslint-disable-next-line
      console.error(msg);
      throw new Error(msg);
    }
  }

  static forRoot(cacheOptions: MeCacheOptions): ModuleWithProviders<MeCacheModule> {
    return {
      ngModule: MeCacheModule,
      providers: [MeCacheService, {provide: CacheOptionsToken, useValue: cacheOptions}],
    };
  }
}
