import {Location} from '@angular/common';
import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {
  AgDatasourceService,
  DatasourceService,
  DeepUtilService,
  VersionDatasourceService,
} from 'deep-ui/shared/core';
import {Datasource, SelectedSubQuery, VersionDataSource} from 'deep-ui/shared/models';

@Injectable()
export class DataSourceTableBaseService {
  dialog = inject(MatDialog);
  dataSourceService = inject(DatasourceService);
  deepUtilService = inject(DeepUtilService);
  snackbar = inject(MeSnackbarService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  location = inject(Location);
  agDatasourceService = inject(AgDatasourceService);
  versionDatasourceService = inject(VersionDatasourceService);

  queryDataSource(dataSource: Datasource, version?: VersionDataSource): void {
    let query: Partial<SelectedSubQuery>;
    if (!dataSource.versioned) {
      query = {
        dataSource,
        dataSourceId: dataSource.id,
      };
    } else {
      const isLatest = this.versionDatasourceService.isVersionLatest(
        {latestUserVersion: dataSource.latestUserVersion},
        {userFacingVersion: version?.userFacingVersion},
      );
      query = {
        dataSource,
        dataSourceId: dataSource.id,
        ...(version && !isLatest && {version}),
        ...(version && !isLatest && {userFacingVersion: version.userFacingVersion}),
        ...(version && !isLatest && {dataSourceVersionId: version.id}),
      };
    }

    this.router.navigate(['data-lake', 'query'], {
      state: {
        onLoadGoToEditQueryIndex: 0,
        subQueries: [query],
      },
    });
  }
}
