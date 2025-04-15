// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js';
import 'zone.js/testing';

import {getTestBed} from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {defineGlobalsInjections} from '@ngneat/spectator';

// eslint-disable-next-line
import {config} from '../../../test-base';

defineGlobalsInjections(config);

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: {
    destroyAfterEach: false,
  },
});
