import {LoadSuccessParams} from '@ag-grid-community/core';
import {Location} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {ActivatedRoute, Router} from '@angular/router';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService, DatasourceService} from 'deep-ui/shared/core';
import {getFakeOfficialDriveDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AgDataSourceTableOfficialDrivesStandaloneComponent} from './ag-data-source-table-official-drives-standalone.component';

const datasource1 = getFakeOfficialDriveDatasource(true);
const datasource2 = getFakeOfficialDriveDatasource(true);
const fakeDataSourcesResponse: LoadSuccessParams = {
  rowData: [datasource1, datasource2],
  rowCount: 2,
};

describe('AgDataSourceTableOfficialDrivesStandaloneComponent', () => {
  let spectator: Spectator<AgDataSourceTableOfficialDrivesStandaloneComponent>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let router: SpyObject<Router>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableOfficialDrivesStandaloneComponent,
    imports: [MeServerSideTableComponent, MatIconButton, MeTooltipDirective, MatIcon],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.OFFICIAL_DRIVES,
            }),
          },
        },
      },
      MatDialog,
      DataSourceTableBaseService,
    ],
    mocks: [
      AgDatasourceService,
      DatasourceService,
      MeSnackbarService,
      ActivatedRoute,
      Router,
      Location,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
    agDatasourceService = spectator.inject(AgDatasourceService);
    agDatasourceService.getMulti.and.returnValue(of(fakeDataSourcesResponse));
    router.parseUrl.and.returnValue({
      queryParams: {view: DataSourceDynamicViewEnum.OFFICIAL_DRIVES},
    });
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
