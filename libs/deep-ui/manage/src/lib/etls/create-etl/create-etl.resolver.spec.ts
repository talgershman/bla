import {ActivatedRoute, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {fakeParsingConfigs, fakeServiceNames} from '../view-etl/view-etl.resolver.spec';
import {CreateEtlResolver} from './create-etl.resolver';
import createSpyObj = jasmine.createSpyObj;
import {EtlService, ParsingConfigurationService} from 'deep-ui/shared/core';

describe('CreateEtlResolver', () => {
  let spectator: SpectatorHttp<CreateEtlResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let etlService: SpyObject<EtlService>;
  let parsingConfigurationService: jasmine.SpyObj<ParsingConfigurationService>;

  const createHttp = createHttpFactory({
    service: CreateEtlResolver,
    mocks: [EtlService, ParsingConfigurationService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {},
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    etlService = spectator.inject(EtlService);
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    route = spectator.inject(ActivatedRoute);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve etl', () => {
    etlService.getServiceNames.and.returnValue(of(fakeServiceNames));
    parsingConfigurationService.getLeanMulti.and.returnValue(of(fakeParsingConfigs));

    const fakeViewData = {
      serviceNames: fakeServiceNames,
      parsingConfigs: fakeParsingConfigs,
    };

    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(fakeViewData).toEqual(data);
    });
  });
});
