import {IsRowSelectable, RowClassParams} from '@ag-grid-community/core';
import {Component, inject, Input, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeRowNode,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  CommonTableActions,
  JobsDynamicViewEnum,
  TAB_VIEW_PARAM,
} from 'deep-ui/shared/components/src/lib/common';
import {SingleJobDataRetentionDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/single-job-data-retention-dialog';
import {
  AgDataSourceSsrmTableBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {
  DataSourceCustomActions,
  DataSourceDynamicViewEnum,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataRetentionService, EtlJobService} from 'deep-ui/shared/core';
import {Datasource, ETLJobSnakeCase, MestDatasourceGroup} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _map from 'lodash-es/map';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {firstValueFrom, Subject} from 'rxjs';

import {getMestsDatasourceTableColumns} from './ag-data-source-table-mests-standalone-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-mests-standalone',
  templateUrl: './ag-data-source-table-mests-standalone.component.html',
  styleUrls: ['./ag-data-source-table-mests-standalone.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MeServerSideTableComponent,
    MeTooltipDirective,
  ],
  providers: [DataSourceTableBaseService],
})
export class AgDataSourceTableMestsStandaloneComponent
  extends AgDataSourceSsrmTableBaseDirective
  implements OnInit
{
  @Input()
  hideTableActions: boolean;

  @Input()
  triggerTableRefresh: Subject<void>;

  private etlJobService = inject(EtlJobService);
  private dataRetentionService = inject(DataRetentionService);

  readonly ignoreTeamFilterAttributes = ['id'];
  readonly tableComponentId = 'data-source--mest';
  readonly dataType = 'itrks';
  readonly viewName: DataSourceDynamicViewEnum;
  readonly getColumns = getMestsDatasourceTableColumns;
  readonly rowClassRules = {
    'row-disabled': (params: RowClassParams<Datasource>) =>
      !params.node.selectable && params.node.level,
    'row-regular-cursor': (params: RowClassParams<Datasource>) =>
      !params.node.selectable && !params.node.level,
  };
  autoGroupColumnDef: MeColDef<Datasource>;

  override ngOnInit(): void {
    super.ngOnInit();

    this.autoGroupColumnDef = {
      field: 'name',
      headerName: 'Job Id / Name',
      minWidth: 320,
      width: 400,
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
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
      .subscribe(() => this.refreshDataTwice());
  }

  override isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (!this.selectionMode) {
      return true;
    }

    if (rowNode.group) {
      rowNode.rowTooltip = '';
      return false;
    }

    if (_map(this.selectedDataSources, 'id').includes(rowNode.data.id)) {
      rowNode.rowTooltip = 'Already selected';
      return false;
    }

    return super.isRowSelectable(rowNode);
  };

  override async onActionClicked(action: MeAgTableActionItemEvent<Datasource>): Promise<void> {
    if (action.id === DataSourceCustomActions.GoToLink) {
      const refJobId = action.selected.jobIds[action.selected.jobIds.length - 1];
      this.dataSourceTableBaseService.router.navigate(['jobs'], {
        queryParams: {[TAB_VIEW_PARAM]: JobsDynamicViewEnum.ETL, jobUuid: refJobId},
      });
    } else if (action.id === DataSourceCustomActions.DownloadClipList) {
      const dataSource: Datasource = action.selectedRowNode.data;
      this.dataSourceTableBaseService.dataSourceService.downloadClipList(dataSource);
    } else if (action.id === CommonTableActions.DATA_RETENTION) {
      await this._openDataRetentionDialog(action.selected as unknown as MestDatasourceGroup);
    } else {
      await super.onActionClicked(action);
    }
  }

  override onSelectionChanged(nodes: Array<MeRowNode<any>>): void {
    if (!nodes.length) {
      this.triggerSelectDatasourceChange({
        dataSource: null,
        version: null,
        mestGroup: null,
      });
      return;
    }
    if (!nodes[0].group) {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].data,
        version: null,
        mestGroup: nodes[0].parent.data,
      });
    } else {
      this.triggerSelectDatasourceChange({
        dataSource: null,
        version: null,
        mestGroup: nodes[0].data,
      });
    }
  }

  override onFiltersParamsChanged(params: Params = {}): void {
    this.setFilterModelForTeamFilterState();
    this.filtersParamsChanged.emit(params);
  }

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }

  private async _openDataRetentionDialog(mestDatasourceGroup: MestDatasourceGroup): Promise<void> {
    await this._loadDataRetentionDialog();
    const currentJob = await this._getJob(mestDatasourceGroup);
    const config = this.dataRetentionService.getMestDataRetentionConfig();
    //need to get the most update info of job, as it table only refresh every 1 min
    const dialogRef = this.dialog.open(SingleJobDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.job = currentJob;
    dialogRef.componentInstance.config = config;
    dialogRef.beforeClosed().subscribe((_) => this.refreshDataTwice());
  }

  private async _getJob(mestDatasourceGroup: MestDatasourceGroup): Promise<ETLJobSnakeCase> {
    return firstValueFrom(this.etlJobService.getSingle(mestDatasourceGroup.jobId));
  }

  private async _loadDataRetentionDialog(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/single-job-data-retention-dialog');
  }
}
