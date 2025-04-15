import {Location} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator';
import {
  AgDatasourceService,
  DatasourceService,
  DeepUtilService,
  VersionDatasourceService,
} from 'deep-ui/shared/core';
import {Datasource, VersionDataSource} from 'deep-ui/shared/models';
import {
  getFakeMestDatasource,
  getFakePerfectDatasource,
  getFakeVersionDataSource,
} from 'deep-ui/shared/testing';

import {DataSourceTableBaseService} from './data-source-table-base.service';

describe('DataSourceTableBaseService', () => {
  let spectator: SpectatorService<DataSourceTableBaseService>;
  let service: DataSourceTableBaseService;
  let routerService: SpyObject<Router>;
  let fakeDataSource: Datasource;
  let fakeVersions: Array<VersionDataSource>;

  const createService = createServiceFactory({
    service: DataSourceTableBaseService,
    mocks: [
      MatDialog,
      DatasourceService,
      DeepUtilService,
      MeSnackbarService,
      ActivatedRoute,
      Router,
      Location,
      AgDatasourceService,
    ],
    providers: [VersionDatasourceService],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(DataSourceTableBaseService);
    routerService = spectator.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('queryDataSource', () => {
    beforeEach(() => {
      fakeVersions = [
        getFakeVersionDataSource(true, {userFacingVersion: '1'}),
        getFakeVersionDataSource(true, {userFacingVersion: '2'}),
      ];
      fakeDataSource = getFakePerfectDatasource(true, {
        datasourceversionSet: fakeVersions,
        latestUserVersion: fakeVersions[1].userFacingVersion,
      }).fakeDataSource;
    });

    it('handle version data source - latest version', () => {
      service.queryDataSource(fakeDataSource, fakeVersions[1]);

      expect(routerService.navigate).toHaveBeenCalledWith(['data-lake', 'query'], {
        state: {
          onLoadGoToEditQueryIndex: 0,
          subQueries: [
            {
              dataSource: fakeDataSource,
              dataSourceId: fakeDataSource.id,
            },
          ],
        },
      });
    });

    it('handle version data source - fixed version', () => {
      service.queryDataSource(fakeDataSource, fakeVersions[0]);

      expect(routerService.navigate).toHaveBeenCalledWith(['data-lake', 'query'], {
        state: {
          onLoadGoToEditQueryIndex: 0,
          subQueries: [
            {
              dataSource: fakeDataSource,
              dataSourceId: fakeDataSource.id,
              version: fakeVersions[0],
              userFacingVersion: fakeVersions[0].userFacingVersion,
              dataSourceVersionId: fakeVersions[0].id,
            },
          ],
        },
      });
    });

    it('handle none version data source', () => {
      const fakeMESTDataSource: Datasource = getFakeMestDatasource(true).fakeDataSource;

      service.queryDataSource(fakeMESTDataSource);

      expect(routerService.navigate).toHaveBeenCalledWith(['data-lake', 'query'], {
        state: {
          onLoadGoToEditQueryIndex: 0,
          subQueries: [
            {
              dataSource: fakeMESTDataSource,
              dataSourceId: fakeMESTDataSource.id,
            },
          ],
        },
      });
    });
  });
});
