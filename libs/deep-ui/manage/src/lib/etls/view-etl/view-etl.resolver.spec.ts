import {ActivatedRoute, convertToParamMap, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {EtlService, ParsingConfigurationService} from 'deep-ui/shared/core';
import {
  getFakeETL,
  getFakeEtlDagService,
  getFakeEtlServiceNames,
  getFakeParsingConfiguration,
} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {ViewEtlResolver} from './view-etl.resolver';

export const fakeServices = [
  getFakeEtlDagService(true),
  getFakeEtlDagService(true, {type: 'dataPrep', version: '1.1.1master'}),
  getFakeEtlDagService(true, {version: '1.2.dev'}),
  getFakeEtlDagService(true, {type: 'dataPrep', version: '1.4.dev'}),
];
export const fakeServiceNames = getFakeEtlServiceNames(fakeServices);
export const fakeParsingConfigs = [getFakeParsingConfiguration(true)];
export const fakeETL = getFakeETL(true, {
  team: 'deep-fpa-objects',
  parsingConfiguration: fakeParsingConfigs[0].id,
  services: {
    [fakeServices[1].id.toString()]: fakeServices[1],
    [fakeServices[0].id.toString()]: fakeServices[0],
  },
  servicesDag: {
    root: [fakeServices[1].id.toString()],
    [fakeServices[1].id]: [fakeServices[0].id.toString()],
    [fakeServices[0].id]: ['BI'],
  },
  sdkStatus: {
    status: 'deprecated',
    msg: 'Version 13.3.12 is deprecated',
  },
});

describe('ViewEtlResolver', () => {
  let spectator: SpectatorHttp<ViewEtlResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let etlService: SpyObject<EtlService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;

  const createHttp = createHttpFactory({
    service: ViewEtlResolver,
    mocks: [EtlService, ParsingConfigurationService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              id: fakeETL.id,
            }),
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    etlService = spectator.inject(EtlService);
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    route = spectator.inject(ActivatedRoute);
    mockSnapshot = jasmine.createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
  });

  it('should resolve etl', () => {
    etlService.getSingle.and.returnValue(of(fakeETL));
    etlService.getServiceNames.and.returnValue(of(fakeServiceNames));
    parsingConfigurationService.getLeanMulti.and.returnValue(of(fakeParsingConfigs));

    const fakeViewData = {
      serviceNames: fakeServiceNames,
      etl: fakeETL,
      parsingConfigs: fakeParsingConfigs,
    };

    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect(fakeViewData).toEqual(data);
    });
  });
});
