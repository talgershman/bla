import {ActivatedRoute, Router, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';

import createSpyObj = jasmine.createSpyObj;
import {DatasourceService} from 'deep-ui/shared/core';
import {getFakeMestDatasource, getFakeQueryJson} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {CreateQueryResolver} from './create-query.resolver';

describe('CreateQueryResolver', () => {
  let spectator: SpectatorHttp<CreateQueryResolver>;
  let activatedRoute: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let datasourceService: SpyObject<DatasourceService>;
  const datasource = getFakeMestDatasource(true).fakeDataSource;
  const routerSpy = createSpyObj<Router>('Router', ['getCurrentNavigation']);

  const createHttp = createHttpFactory({
    service: CreateQueryResolver,
    providers: [
      {
        provide: Router,
        useValue: routerSpy,
      },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {},
        },
      },
    ],
    mocks: [DatasourceService],
  });

  beforeEach(() => {
    spectator = createHttp();
    activatedRoute = spectator.inject(ActivatedRoute);
    datasourceService = spectator.inject(DatasourceService);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
    datasourceService.getSingle.and.returnValue(of(datasource));
  });

  it('regular flow - no passed data', (done) => {
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          onLoadGoToEditQueryIndex: null,
          subQueries: [],
        },
      },
    } as any);
    spectator.service.resolve(activatedRoute.snapshot, mockSnapshot).subscribe((data) => {
      expect({
        onLoadGoToEditQueryIndex: null,
        subQueries: [],
        selectedDataSources: [],
      }).toEqual(data);
      done();
    });
  });

  it('onLoadGoToEditQueryIndex - edit sub query', (done) => {
    const subQueries = getFakeQueryJson(datasource.id);
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          onLoadGoToEditQueryIndex: 0,
          subQueries,
        },
      },
    } as any);

    spectator.service.resolve(activatedRoute.snapshot, mockSnapshot).subscribe((data) => {
      expect({
        onLoadGoToEditQueryIndex: 0,
        subQueries,
        selectedDataSources: [datasource],
      }).toEqual(data);
      done();
    });
  });
});
