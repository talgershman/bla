// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js';
import 'zone.js/testing';

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {getTestBed} from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {defineGlobalsInjections} from '@ngneat/spectator';

import env from './dynamic_envs';

defineGlobalsInjections({
  imports: [HttpClientTestingModule],
  providers: [
    {
      provide: 'AG_GRID_LICENSE',
      useValue: env.agGridLicense,
    },
  ],
});

// First, initialize the Angular testing environment.
getTestBed().resetTestEnvironment();
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: {
    destroyAfterEach: false,
  },
});
