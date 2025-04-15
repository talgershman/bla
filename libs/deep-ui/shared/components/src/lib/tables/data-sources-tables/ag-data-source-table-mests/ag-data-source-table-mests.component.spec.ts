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
import {AgDataSourceTableMestsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-mests-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceService} from 'deep-ui/shared/core';
import {MestDatasourceGroup} from 'deep-ui/shared/models';
import {getFakeMestDatasourceGroup} from 'deep-ui/shared/testing';
import {of, timer} from 'rxjs';

import {AgDataSourceTableMestsComponent} from './ag-data-source-table-mests.component';

describe('AgDataSourceTableMestsComponent', () => {
  let spectator: Spectator<AgDataSourceTableMestsComponent>;
  let datasourceService: SpyObject<DatasourceService>;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableMestsComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      MeTooltipDirective,
      RouterTestingModule,
      AgDataSourceTableMestsStandaloneComponent,
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
              view: DataSourceDynamicViewEnum.MESTS,
            }),
          },
        },
      },
      DataSourceTableBaseService,
      MeAgTableApiService,
      MatDialog,
    ],
    mocks: [DatasourceService, MeLoadingService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    datasourceService = spectator.inject(DatasourceService);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onTableActionClicked', () => {
    const rowNode = {
      data: getFakeMestDatasourceGroup(true),
    } as MeRowNode;
    const action: MeAgTableActionItemEvent<MestDatasourceGroup> = {
      title: '',
      id: '',
      selected: rowNode.data,
      selectedRowNode: rowNode,
    };

    it('should delete', async () => {
      datasourceService.delete.and.returnValue(timer(1000));
      action.id = 'delete';
      spectator.detectChanges();
      spectator.detectComponentChanges();
      await spectator.fixture.whenStable();
      await spectator.component.onDeleteActionClicked({dataSource: null, mestGroup: rowNode.data});

      // close warning dialog
      await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Delete'});

      expect(datasourceService.delete).toHaveBeenCalledWith(
        action.selected.sampleDataSourceId,
        action.selected.jobId,
      );
    });
  });
});
