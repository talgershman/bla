import {ActivatedRoute, convertToParamMap, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {of} from 'rxjs';

import {ViewParsingConfigurationResolver} from './view-parsing-configuration.resolver';
import createSpyObj = jasmine.createSpyObj;
import {ClipListService, ParsingConfigurationService} from 'deep-ui/shared/core';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';

const fakeParsingConfiguration = getFakeParsingConfiguration(true);

describe('ViewParsingConfigurationResolver', () => {
  let spectator: SpectatorHttp<ViewParsingConfigurationResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let parsingConfigurationService: jasmine.SpyObj<ParsingConfigurationService>;

  const createHttp = createHttpFactory({
    service: ViewParsingConfigurationResolver,
    mocks: [ClipListService, ParsingConfigurationService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              id: fakeParsingConfiguration.id,
            }),
            data: fakeParsingConfiguration,
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    route = spectator.inject(ActivatedRoute);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve parsing configuration', () => {
    parsingConfigurationService.getSingle.and.returnValue(of(fakeParsingConfiguration));
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(fakeParsingConfiguration).toEqual(data);
    });
  });
});
