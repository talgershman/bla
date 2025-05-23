import {LoadSuccessParams} from '@ag-grid-community/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute} from '@angular/router';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService} from 'deep-ui/shared/core';
import {Datasource} from 'deep-ui/shared/models';
import {getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AgDataSourceTableMestsStandaloneComponent} from './ag-data-source-table-mests-standalone.component';

const datasource1 = getFakePerfectDatasource(true).fakeDataSource;
const datasource2 = getFakePerfectDatasource(true).fakeDataSource;
const fakeDataSourcesResponse: LoadSuccessParams = {
  rowData: [datasource1, datasource2],
  rowCount: 2,
};

describe('AgDataSourceTableMestsStandaloneComponent', () => {
  let spectator: Spectator<AgDataSourceTableMestsStandaloneComponent>;
  let agDatasourceService: SpyObject<AgDatasourceService>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableMestsStandaloneComponent,
    imports: [
      MatDialogModule,
      MatIconModule,
      MatButtonModule,
      MatDatepickerModule,
      MeServerSideTableComponent,
      MeTooltipDirective,
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
    ],
    mocks: [MatDialog, AgDatasourceService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    agDatasourceService = spectator.inject(AgDatasourceService);
    agDatasourceService.getMulti.and.returnValue(of(fakeDataSourcesResponse));
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
        getFakePerfectDatasource(true, {allowedSubTypes: ['objects']}).fakeDataSource,
        getFakePerfectDatasource(true, {allowedSubTypes: ['objects']}).fakeDataSource,
      ];
    });

    it('status inactive - disabled', () => {
      rowNode.data.status = 'inactive';
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });

    it('invalid data sub type - disabled', () => {
      rowNode.data.dataSubType = 'frames';
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });

    it('valid data sub type - enabled', () => {
      rowNode.data.dataSubType = 'objects';
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

    it('rowNode is a group - disabled', () => {
      rowNode.group = true;
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });
  });
});
