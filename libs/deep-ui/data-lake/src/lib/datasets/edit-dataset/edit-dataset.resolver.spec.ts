import {ActivatedRoute, convertToParamMap, RouterStateSnapshot} from '@angular/router';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {EditDatasetResolver} from './edit-dataset.resolver';
import createSpyObj = jasmine.createSpyObj;
import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {AssetManagerService, DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {getEtlResultsDatasource, getFakeDataset} from 'deep-ui/shared/testing';

const {fakeDataSource} = getEtlResultsDatasource(true);
const dataset = getFakeDataset(true, fakeDataSource);

describe('EditDatasetResolver', () => {
  let spectator: SpectatorHttp<EditDatasetResolver>;
  let route: ActivatedRoute;
  let mockSnapshot: RouterStateSnapshot;
  let datasourceService: SpyObject<DatasourceService>;
  let datasetService: SpyObject<DatasetService>;

  const createHttp = createHttpFactory({
    service: EditDatasetResolver,
    mocks: [DatasourceService, DatasetService, AssetManagerService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              id: dataset.id,
            }),
            data: {
              viewData: {
                dataset,
              },
            },
          },
        },
      },
      MeErrorHandlerService,
    ],
  });

  beforeEach(() => {
    spectator = createHttp();
    datasourceService = spectator.inject(DatasourceService);
    datasetService = spectator.inject(DatasetService);
    route = spectator.inject(ActivatedRoute);
    mockSnapshot = createSpyObj<RouterStateSnapshot>('RouterStateSnapshot', ['toString']);
    datasourceService.getSingle.and.returnValue(of(fakeDataSource));
  });

  it('should resolve dataSources', (done) => {
    datasetService.getSingle.and.returnValue(of(dataset));
    spectator.service.resolve(route.snapshot, mockSnapshot).subscribe((data) => {
      expect({
        dataset,
        selectedDataSources: [fakeDataSource],
      }).toEqual(data);
      done();
    });
  });
});
