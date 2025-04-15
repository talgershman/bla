import {LoadSuccessParams} from '@ag-grid-community/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute, Router} from '@angular/router';
import {MeAgActionsCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-cell';
import {MeAgCustomHeaderComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-header';
import {MeAgTemplateRendererComponent} from '@mobileye/material/src/lib/components/ag-table/ag-template-renderer';
import {MeAgMultiChipsFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService, DatasourceService} from 'deep-ui/shared/core';
import {Datasource} from 'deep-ui/shared/models';
import {getFakeSimulatorDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AgDataSourceTableSimulatorStandaloneComponent} from './ag-data-source-table-simulator-standalone.component';

const datasource1 = getFakeSimulatorDatasource(true, {dataType: 'perfects'}).fakeDataSource;
const datasource2 = getFakeSimulatorDatasource(true, {dataType: 'perfects'}).fakeDataSource;
const fakeDataSourcesResponse: LoadSuccessParams = {
  rowData: [datasource1, datasource2],
  rowCount: 2,
};

describe('AgDataSourceTableSimulatorStandaloneComponent', () => {
  let spectator: Spectator<AgDataSourceTableSimulatorStandaloneComponent>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let router: SpyObject<Router>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableSimulatorStandaloneComponent,
    imports: [
      MatIconModule,
      MatButtonModule,
      MeAgCustomHeaderComponent,
      MeAgMultiChipsFilterComponent,
      MeAgTemplateRendererComponent,
      MeAgActionsCellComponent,
      MeServerSideTableComponent,
      MeTooltipDirective,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.SIMULATOR,
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
      queryParams: {view: DataSourceDynamicViewEnum.PERFECTS},
    });
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('isRowSelectable', () => {
    let rowNode;
    beforeEach(() => {
      rowNode = {
        data: {...datasource1} as Datasource,
      };
      spectator.component.selectionMode = true;
      spectator.component.selectedDataSources = [
        getFakeSimulatorDatasource(true).fakeDataSource,
        getFakeSimulatorDatasource(true).fakeDataSource,
      ];
    });

    it('status inactive - disabled', () => {
      rowNode.data.status = 'inactive';
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });

    it('valid data sub type - enabled', () => {
      rowNode.data.dataSubType = 'frames';
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeTruthy();
    });
  });
});
