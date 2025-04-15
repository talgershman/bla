import {ActivatedRoute, Router, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';

import {CreateDatasetResolver} from './create-dataset.resolver';
import createSpyObj = jasmine.createSpyObj;
import {RouterTestingModule} from '@angular/router/testing';
import {DatasourceService} from 'deep-ui/shared/core';
import {getFakeDataset, getFakeMestDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

describe('CreateDatasetResolver', () => {
  let spectator: SpectatorHttp<CreateDatasetResolver>;
  let activatedRoute: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let datasourceService: SpyObject<DatasourceService>;
  const routerSpy = createSpyObj<Router>('Router', ['getCurrentNavigation']);

  const createHttp = createHttpFactory({
    service: CreateDatasetResolver,
    imports: [RouterTestingModule],
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
  });

  it('regular flow - no passed data', (done) => {
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          dataset: null,
        },
      },
    } as any);
    spectator.service.resolve(activatedRoute.snapshot, mockSnapshot).subscribe((data) => {
      expect({
        dataset: null,
        selectedDataSources: null,
      }).toEqual(data);
      done();
    });
  });

  it('redirect from create query - pass data', (done) => {
    const dataset = {
      numberOfClips: 1,
      queryJson: {bla: true},
      queryString: 'the query string',
      pathOnS3: 'the path string',
    };
    const selectedDataSources = [
      getFakeMestDatasource(true).fakeDataSource,
      getFakeMestDatasource(true).fakeDataSource,
    ];
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          selectedDataSources,
          queryDashboard: {
            ...dataset,
          },
        },
      },
    } as any);

    spectator.service.resolve(activatedRoute.snapshot, mockSnapshot).subscribe((data) => {
      expect({
        dataset: {
          ...dataset,
        },
        selectedDataSources,
      }).toEqual(data);
      done();
    });
  });

  it('redirect from duplicate data - pass data', (done) => {
    const datasource = getFakeMestDatasource(true).fakeDataSource;
    datasourceService.getSingle.and.returnValue(of(datasource));
    const dataset = getFakeDataset(true, datasource);
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: {
        state: {
          dataset,
        },
      },
    } as any);
    spectator.service.resolve(activatedRoute.snapshot, mockSnapshot).subscribe((data) => {
      expect({
        dataset,
        selectedDataSources: [datasource],
      }).toEqual(data);
      done();
    });
  });
});
