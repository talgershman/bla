import {LoadSuccessParams} from '@ag-grid-community/core';
import {Location} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {ActivatedRoute, Router} from '@angular/router';
import {MeAgActionsCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-cell';
import {MeAgCustomHeaderComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-header';
import {MeAgTemplateRendererComponent} from '@mobileye/material/src/lib/components/ag-table/ag-template-renderer';
import {MeAgMultiChipsFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService, DatasourceService} from 'deep-ui/shared/core';
import {Datasource} from 'deep-ui/shared/models';
import {getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AgDataSourceTablePerfectsStandaloneComponent} from './ag-data-source-table-perfects-standalone.component';

const datasource1 = getFakePerfectDatasource(true, {dataType: 'perfects'}).fakeDataSource;
const datasource2 = getFakePerfectDatasource(true, {dataType: 'perfects'}).fakeDataSource;
const fakeDataSourcesResponse: LoadSuccessParams = {
  rowData: [datasource1, datasource2],
  rowCount: 2,
};

describe('AgDataSourceTablePerfectsStandaloneComponent', () => {
  let spectator: Spectator<AgDataSourceTablePerfectsStandaloneComponent>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let router: SpyObject<Router>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTablePerfectsStandaloneComponent,
    imports: [
      MatIconModule,
      MatButtonModule,
      MatDialogModule,
      MeServerSideTableComponent,
      MeTooltipDirective,
      MeAgCustomHeaderComponent,
      MeAgMultiChipsFilterComponent,
      MeAgTemplateRendererComponent,
      MeAgActionsCellComponent,
      MatMenuModule,
      MeAreYouSureDialogComponent,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.PERFECTS,
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
    agDatasourceService = spectator.inject(AgDatasourceService);
    router = spectator.inject(Router);
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
        getFakePerfectDatasource(true, {allowedSubTypes: ['frames']}).fakeDataSource,
        getFakePerfectDatasource(true, {allowedSubTypes: ['frames']}).fakeDataSource,
      ];
    });

    it('status inactive - disabled', () => {
      rowNode.data.status = 'inactive';
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });

    it('invalid data sub type - disabled', () => {
      rowNode.data.dataSubType = 'objects';
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

    it('invalid by FrameIndicators - disabled', () => {
      rowNode.data.dataSubType = 'frames';
      rowNode.data.allowedSubTypes = ['frames'];
      rowNode.data.frameIndicators = ['other'];
      spectator.component.selectedDataSources = [
        getFakePerfectDatasource(true, {
          dataSubType: 'frames',
          allowedSubTypes: ['frames'],
          frameIndicators: ['gfi', 'grab_index'],
        }).fakeDataSource,
        getFakePerfectDatasource(true, {
          dataSubType: 'frames',
          allowedSubTypes: ['frames'],
          frameIndicators: ['gfi', 'grab_index'],
        }).fakeDataSource,
      ];
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(rowNode.rowTooltip).toBe(
        'Data Source must contains at least one of the columns: gfi, grab_index',
      );

      expect(isSelectable).toBe(false);
    });

    it('isWizard true and rowNode is top level - enabled', () => {
      spectator.component.isWizard = true;
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeTruthy();
    });

    it('isWizard true and rowNode is not top level - disabled', () => {
      rowNode.parent = {
        data: {},
      };
      spectator.component.isWizard = true;
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });
  });
});
