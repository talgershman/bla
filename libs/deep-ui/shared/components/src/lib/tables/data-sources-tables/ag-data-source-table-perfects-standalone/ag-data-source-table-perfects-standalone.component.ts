import {IRowNode, IsRowSelectable} from '@ag-grid-community/core';
import {Component, inject, Input, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
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
import {MultipleJobDataRetentionDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/multiple-job-data-retention-dialog';
import {
  AgDataSourceSsrmTableBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {
  DataSourceCustomActions,
  DataSourceDynamicViewEnum,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataRetentionService, PerfectTransformJobsService} from 'deep-ui/shared/core';
import {Datasource, PerfectTransformJobSnakeCase, VersionDataSource} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _map from 'lodash-es/map';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {firstValueFrom, Subject} from 'rxjs';

import {getPerfectsDatasourceTableColumns} from './ag-data-source-table-perfects-standalone-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-perfects-standalone',
  templateUrl: './ag-data-source-table-perfects-standalone.component.html',
  styleUrls: ['./ag-data-source-table-perfects-standalone.component.scss'],
  imports: [MatIconModule, MatButtonModule, MeServerSideTableComponent, MeTooltipDirective],
  providers: [DataSourceTableBaseService],
})
export class AgDataSourceTablePerfectsStandaloneComponent
  extends AgDataSourceSsrmTableBaseDirective
  implements OnInit
{
  @Input()
  hideTableActions: boolean;

  @Input()
  triggerTableRefresh: Subject<void>;

  @Input()
  isWizard: boolean;

  private dataRetentionService = inject(DataRetentionService);
  private perfectTransformJobsService = inject(PerfectTransformJobsService);

  readonly ignoreTeamFilterAttributes = ['id'];
  readonly tableComponentId = 'data-source--perfects';
  readonly dataType = 'perfects';
  readonly viewName = DataSourceDynamicViewEnum.PERFECTS;
  readonly getColumns = getPerfectsDatasourceTableColumns;
  autoGroupColumnDef: MeColDef<Datasource> | MeColDef<VersionDataSource>;

  override ngOnInit(): void {
    super.ngOnInit();

    this.autoGroupColumnDef = {
      field: 'userFacingVersion',
      headerName: 'Name / Version',
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
      minWidth: 150,
      width: 600,
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
    }
    if (nodes[0].group) {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].data,
        version: null,
      });
    } else {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].parent.data,
        version: nodes[0].data,
      });
    }
  }

  override onFiltersParamsChanged(params: Params = {}): void {
    this.setFilterModelForTeamFilterState();
    this.filtersParamsChanged.emit(params);
  }

  override async onActionClicked(actionEvent: MeAgTableActionItemEvent<Datasource>): Promise<void> {
    const action = actionEvent as unknown as MeAgTableActionItemEvent<VersionDataSource>;
    if (action.id === DataSourceCustomActions.GoToLink) {
      const refJobId = action.selected.jobId;
      this.dataSourceTableBaseService.router.navigate(['jobs'], {
        queryParams: {[TAB_VIEW_PARAM]: JobsDynamicViewEnum.PERFECT_TRANSFORM, jobUuid: refJobId},
      });
    } else if (action.id === DataSourceCustomActions.DownloadClipList) {
      const dataSource: any = action.selectedRowNode.parent.data ?? action.selectedRowNode.data;
      this.dataSourceTableBaseService.dataSourceService.downloadClipList(
        dataSource,
        action.selected,
      );
    } else if (action.id === DataSourceCustomActions.QueryDataSource) {
      const group: IRowNode<Datasource> = action.selectedRowNode.group
        ? (action.selectedRowNode as unknown as IRowNode<Datasource>)
        : (action.selectedRowNode.parent as unknown as IRowNode<Datasource>);
      const child: MeRowNode<VersionDataSource> = action.selectedRowNode.group
        ? null
        : action.selectedRowNode;
      this.dataSourceTableBaseService.queryDataSource(group.data, child?.data);
    } else if (action.id === CommonTableActions.DATA_RETENTION) {
      await this._openDataRetentionDialog(actionEvent.selected);
    } else {
      await super.onActionClicked(actionEvent);
    }
  }

  override isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (!this.selectionMode) {
      return true;
    }
    if (this.isWizard) {
      if (rowNode.parent?.data) {
        rowNode.rowTooltip = 'Only top level rows can be selected';
        return false;
      }
      if (rowNode.data.status !== 'active' && rowNode.data.status !== 'needs_sync') {
        rowNode.rowTooltip = 'Status not allowed';
        return false;
      }
      if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(rowNode.data, 'team')) {
        rowNode.rowTooltip = `Data source ${rowNode.data.name} was created by a member of team ${rowNode.data.team}, and only members of that team can create a new version.`;
        return false;
      }
    }

    const currentNodeDataSourceId = rowNode.parent?.data?.id || rowNode.data.id;
    if (_map(this.selectedDataSources, 'id').includes(currentNodeDataSourceId)) {
      rowNode.rowTooltip = 'Data source already selected';
      return false;
    }

    return super.isRowSelectable(rowNode);
  };

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }

  private async _openDataRetentionDialog(datasource: Datasource): Promise<void> {
    await this._loadDataRetentionDialog();
    const currentJob = await this._getJob(datasource);
    const config = this.dataRetentionService.getPerfectTransformDataRetentionConfig();
    //need to get the most update info of job, as it table only refresh every 1 min
    const dialogRef = this.dialog.open(MultipleJobDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.job = currentJob;
    dialogRef.componentInstance.jobIds = datasource.jobIds;
    dialogRef.componentInstance.config = config;
    dialogRef.componentInstance.isPerfectTransform = true;
    dialogRef.beforeClosed().subscribe((_) => this.refreshDataTwice());
  }

  private async _getJob(datasource: Datasource): Promise<PerfectTransformJobSnakeCase> {
    return firstValueFrom(
      this.perfectTransformJobsService.getSingle(datasource.jobIds[datasource.jobIds.length - 1]),
    );
  }

  private async _loadDataRetentionDialog(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/multiple-job-data-retention-dialog');
  }
}
