import {Directive} from '@angular/core';
import {Router} from '@angular/router';
import {MeColDef, MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {createDirectiveFactory, SpectatorDirective, SpyObject} from '@ngneat/spectator';
import {getPerfectsDatasourceTableColumns} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-perfects-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DeepUtilService} from 'deep-ui/shared/core';
import {Datasource, FrameIndicatorsTypesEnum} from 'deep-ui/shared/models';
import {getFakePerfectDatasource} from 'deep-ui/shared/testing';

import {AgDataSourceSsrmTableBaseDirective} from './ag-data-source-ssrm-table-base.directive';
import {DataSourceTableBaseService} from './data-source-table-base.service';

@Directive({
  selector: '[deTestSsrmTable]',
  standalone: false,
})
export class TestDirective extends AgDataSourceSsrmTableBaseDirective {
  autoGroupColumnDef: MeColDef<Datasource> = null;
  dataType = 'perfects';
  readonly getColumns = getPerfectsDatasourceTableColumns;
  hideTableActions = false;
  tableComponentId = 'table-1';
  ignoreTeamFilterAttributes = [];
  viewName: DataSourceDynamicViewEnum.PERFECTS;
}

describe('AgDataSourceSsrmTableBaseDirective', () => {
  let spectator: SpectatorDirective<TestDirective>;
  let service: DataSourceTableBaseService;
  let router: SpyObject<Router>;
  const createDirective = createDirectiveFactory({
    directive: TestDirective,
    mocks: [DataSourceTableBaseService, DeepUtilService, Router],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createDirective(`<div deTestSsrmTable></div>`, {
      hostProps: {
        changeDetection: false,
      },
    });
    router = spectator.inject(Router);
    service = spectator.inject(DataSourceTableBaseService);
    service.router = router;
    router.parseUrl.and.returnValue({
      queryParams: {view: DataSourceDynamicViewEnum.PERFECTS},
    });
  });

  describe('isRowSelectable', () => {
    describe('version row -', () => {
      it('sub type valid', () => {
        const {fakeDataSource, fakeVersionDataSource} = getFakePerfectDatasource(true, {
          dataSubType: 'frames',
        });
        const rowNode: Partial<MeRowNode> = {
          parent: {
            data: fakeDataSource,
          } as any,
          data: fakeVersionDataSource,
        };
        spectator.directive.selectedDataSources = [
          getFakePerfectDatasource(true, {dataSubType: 'frames', allowedSubTypes: ['frames']})
            .fakeDataSource,
        ];
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(isSelectable).toBeTrue();
      });

      it('sub type invalid', () => {
        const {fakeDataSource, fakeVersionDataSource} = getFakePerfectDatasource(true, {
          dataSubType: 'frames',
        });
        const rowNode: Partial<MeRowNode> = {
          parent: {
            data: fakeDataSource,
          } as any,
          data: fakeVersionDataSource,
        };
        spectator.directive.selectedDataSources = [
          getFakePerfectDatasource(true, {dataSubType: 'events', allowedSubTypes: ['events']})
            .fakeDataSource,
        ];
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(rowNode.rowTooltip).toBe('Sub type is not allowed');
        expect(isSelectable).toBeFalse();
      });

      it('frame indicator invalid', () => {
        const {fakeDataSource, fakeVersionDataSource} = getFakePerfectDatasource(true, {
          dataSubType: 'frames',
        });
        const rowNode: Partial<MeRowNode> = {
          parent: {
            data: fakeDataSource,
          } as any,
          data: fakeVersionDataSource,
        };
        fakeVersionDataSource.frameIndicators = [FrameIndicatorsTypesEnum.grab_index];

        spectator.directive.selectedDataSources = [
          getFakePerfectDatasource(true, {dataSubType: 'frames', allowedSubTypes: ['frames']})
            .fakeDataSource,
        ];
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(rowNode.rowTooltip).toBe(
          'Data Source must contains at least one of the columns: gfi',
        );

        expect(isSelectable).toBeFalse();
      });
    });

    describe('data source row -', () => {
      it('invalid status', () => {
        const {fakeDataSource} = getFakePerfectDatasource(true, {
          status: 'updating',
          dataSubType: 'frames',
        });
        const rowNode: Partial<MeRowNode> = {
          data: fakeDataSource,
        };
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(rowNode.rowTooltip).toBe('Status is not allowed');
        expect(isSelectable).toBeFalse();
      });

      it('frame indicator invalid', () => {
        const {fakeDataSource} = getFakePerfectDatasource(true, {
          dataSubType: 'frames',
          frameIndicators: [FrameIndicatorsTypesEnum.grab_index],
        });
        const rowNode: Partial<MeRowNode> = {
          data: fakeDataSource,
        };

        spectator.directive.selectedDataSources = [
          getFakePerfectDatasource(true, {dataSubType: 'frames', allowedSubTypes: ['frames']})
            .fakeDataSource,
        ];
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(rowNode.rowTooltip).toBe(
          'Data Source must contains at least one of the columns: gfi',
        );

        expect(isSelectable).toBeFalse();
      });

      it('sub type invalid', () => {
        const {fakeDataSource} = getFakePerfectDatasource(true, {
          dataSubType: 'frames',
        });
        const rowNode: Partial<MeRowNode> = {
          data: fakeDataSource,
        };
        spectator.directive.selectedDataSources = [
          getFakePerfectDatasource(true, {dataSubType: 'events', allowedSubTypes: ['events']})
            .fakeDataSource,
        ];
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(rowNode.rowTooltip).toBe('Sub type is not allowed');
        expect(isSelectable).toBeFalse();
      });

      it('sub type valid', () => {
        const {fakeDataSource} = getFakePerfectDatasource(true, {
          dataSubType: 'frames',
        });
        const rowNode: Partial<MeRowNode> = {
          data: fakeDataSource,
        };
        spectator.directive.selectedDataSources = [
          getFakePerfectDatasource(true, {dataSubType: 'frames', allowedSubTypes: ['frames']})
            .fakeDataSource,
        ];
        const isSelectable = spectator.directive.isRowSelectable(rowNode as any);

        expect(isSelectable).toBeTrue();
      });
    });
  });
});
