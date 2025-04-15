import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAgActionsCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-cell';
import {MeAgCustomHeaderComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-header';
import {MeAgTemplateRendererComponent} from '@mobileye/material/src/lib/components/ag-table/ag-template-renderer';
import {
  MeAgTableActionItemEvent,
  MeRowNode,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAgMultiChipsFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableEtlResultsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-etl-results-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService, DatasourceService} from 'deep-ui/shared/core';
import {Datasource} from 'deep-ui/shared/models';
import {getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of, timer} from 'rxjs';

import {AgDataSourceTableEtlResultsComponent} from './ag-data-source-table-etl-results.component';
import {AgDataSourceTableEtlResultsService} from './ag-data-source-table-etl-results.service';

describe('AgDataSourceTableEtlResultsComponent', () => {
  let spectator: Spectator<AgDataSourceTableEtlResultsComponent>;
  let datasourceService: SpyObject<DatasourceService>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableEtlResultsComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      MeTooltipDirective,
      RouterTestingModule,
      AgDataSourceTableEtlResultsStandaloneComponent,
      MePortalSrcDirective,
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
              view: DataSourceDynamicViewEnum.ETL_RESULTS,
            }),
          },
        },
      },
      DataSourceTableBaseService,
      MeAgTableApiService,
      MatDialog,
      AgDataSourceTableEtlResultsService,
    ],
    mocks: [DatasourceService, MeLoadingService, AgDatasourceService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    datasourceService = spectator.inject(DatasourceService);
    agDatasourceService = spectator.inject(AgDatasourceService);
    agDatasourceService.getMulti.and.returnValue(of({rowData: [], rowCount: 0}));
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onTableActionClicked', () => {
    const rowNode = {
      data: getFakePerfectDatasource(true).fakeDataSource,
    } as MeRowNode;
    const action: MeAgTableActionItemEvent<Datasource> = {
      title: '',
      id: '',
      selected: rowNode.data,
      selectedRowNode: rowNode,
    };
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000; // 10 seconds

    it('should delete', async () => {
      datasourceService.getJobIds.and.returnValue(of([]));
      datasourceService.delete.and.returnValue(timer(1000));
      action.id = 'delete';
      spectator.detectChanges();
      spectator.detectComponentChanges();

      await spectator.component.onDeleteActionClicked({dataSource: rowNode.data});

      spectator.detectChanges();
      spectator.detectComponentChanges();
      await spectator.fixture.whenStable();
      // close warning dialog
      await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Delete'});
      spectator.detectChanges();
      spectator.detectComponentChanges();

      expect(datasourceService.delete).toHaveBeenCalledWith(
        action.selected.id,
        action.selected.name,
      );
    });
  });
});
