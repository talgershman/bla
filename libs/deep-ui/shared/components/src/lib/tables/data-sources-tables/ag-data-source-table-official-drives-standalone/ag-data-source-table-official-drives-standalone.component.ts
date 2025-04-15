import {GetRowIdFunc, GetRowIdParams, IsRowSelectable} from '@ag-grid-community/core';
import {Component, Input, OnInit} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeRowNode,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {JobsDynamicViewEnum, TAB_VIEW_PARAM} from 'deep-ui/shared/components/src/lib/common';
import {AgDataSourceSsrmTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {
  DataSourceCustomActions,
  DataSourceDynamicViewEnum,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {Subject} from 'rxjs';

import {getOfficialDrivesDatasourceTableColumns} from './ag-data-source-table-official-drives-standalone-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-official-drives-standalone',
  templateUrl: './ag-data-source-table-official-drives-standalone.component.html',
  styleUrls: ['./ag-data-source-table-official-drives-standalone.component.scss'],
  imports: [MeServerSideTableComponent, MatIconButton, MeTooltipDirective, MatIcon],
})
export class AgDataSourceTableOfficialDrivesStandaloneComponent
  extends AgDataSourceSsrmTableBaseDirective
  implements OnInit
{
  @Input()
  triggerTableRefresh: Subject<void>;

  @Input()
  isWizard: boolean;

  readonly ignoreTeamFilterAttributes = [];
  readonly tableComponentId = 'data-source--official-drives';
  readonly dataType = 'official_drives';
  readonly viewName = DataSourceDynamicViewEnum.OFFICIAL_DRIVES;
  readonly getColumns = getOfficialDrivesDatasourceTableColumns;
  readonly hideTableActions = false;
  autoGroupColumnDef: MeColDef<Datasource>;

  override getRowId: GetRowIdFunc = (params: GetRowIdParams<any>) =>
    `${params.data?.jobId || params.data?.id}`;

  override ngOnInit(): void {
    super.ngOnInit();
    this.teamFilterState = 'none';

    this.autoGroupColumnDef = {
      field: 'groupByColumn' as any,
      headerName: 'Drive',
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      flex: 1,
      cellRendererParams: {
        suppressDoubleClickExpand: true,
        innerRenderer: 'meAgTemplateRendererComponent',
        innerRendererParams: {
          meCustomTemplate: this.classifierCell,
        },
      },
    };

    this.triggerTableRefresh
      ?.asObservable()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refreshData());
  }

  override onSelectionChanged(nodes: Array<MeRowNode<any>>): void {
    if (!nodes.length) {
      this.triggerSelectDatasourceChange(null);
      return;
    } else {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].data,
        version: null,
      });
    }
  }

  override onFiltersParamsChanged(params: Params = {}): void {
    this.filtersParamsChanged.emit(params);
  }

  override async onActionClicked(actionEvent: MeAgTableActionItemEvent<Datasource>): Promise<void> {
    const action = actionEvent as unknown as MeAgTableActionItemEvent<Datasource>;
    if (action.id === DataSourceCustomActions.GoToLink) {
      const refJobId = action.selected.jobIds[action.selected.jobIds.length - 1];
      this.dataSourceTableBaseService.router.navigate(['jobs'], {
        queryParams: {[TAB_VIEW_PARAM]: JobsDynamicViewEnum.ETL, jobUuid: refJobId},
      });
    } else {
      await super.onActionClicked(actionEvent);
    }
  }

  override isRowSelectable: IsRowSelectable = (_: MeRowNode): boolean => {
    // this data source table is not shown in query selection
    return true;
  };

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }
}
