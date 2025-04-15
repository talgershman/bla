import {
  CheckboxSelectionCallback,
  CheckboxSelectionCallbackParams,
  IServerSideGroupSelectionState,
  IsRowSelectable,
  RowClassParams,
} from '@ag-grid-community/core';
import {GroupSelectionMode} from '@ag-grid-community/core/dist/types/src/entities/gridOptions';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeGroupByItem,
  MeRowNode,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {EnrichTable, EnrichTableRow} from '@mobileye/material/src/lib/components/enrich-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {
  formatDateFullOrReturnBlank,
  formatDateShortWithPermanent,
} from '@mobileye/material/src/lib/utils';
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
import {Datasource, ETLJobSnakeCase} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _map from 'lodash-es/map';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {firstValueFrom, Subject} from 'rxjs';

import {AgDataSourceTableEtlResultsStandaloneService} from './ag-data-source-table-etl-results-standalone.service';
import {getEtlResultsDatasourceTableColumns} from './ag-data-source-table-etl-results-standalone-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-etl-results-standalone',
  templateUrl: './ag-data-source-table-etl-results-standalone.component.html',
  styleUrls: ['./ag-data-source-table-etl-results-standalone.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MeServerSideTableComponent,
    MeTooltipDirective,
  ],
  providers: [DataSourceTableBaseService, AgDataSourceTableEtlResultsStandaloneService],
})
export class AgDataSourceTableEtlResultsStandaloneComponent
  extends AgDataSourceSsrmTableBaseDirective
  implements OnInit
{
  @Input()
  hideTableActions: boolean;

  @Input()
  triggerTableRefresh: Subject<void>;

  @Output()
  dataSourceMultiSelectionsChanged = new EventEmitter<Array<IServerSideGroupSelectionState>>();

  private etlJobService = inject(EtlJobService);
  private dataRetentionService = inject(DataRetentionService);
  private agDataSourceTableEtlResultsStandaloneService = inject(
    AgDataSourceTableEtlResultsStandaloneService,
  );

  readonly groupByOptions: Array<MeGroupByItem> = [
    {
      groups: [
        {
          colId: 'etlNameGroup',
          field: 'etlName',
        },
        {
          colId: 'nicknameGroup',
          field: 'nickname',
        },
      ],
      title: 'Group by : ETL / Output path',
    },
    {
      groups: [
        {
          colId: 'etlNameGroup',
          field: 'etlName',
        },
        {
          colId: 'tagsGroup',
          field: 'tags',
        },
      ],
      title: 'Group by : ETL / Tag',
    },
  ];

  readonly ignoreTeamFilterAttributes = ['id'];
  readonly tableComponentId = 'data-source--etl-results';
  readonly dataType = 'etl_results';
  readonly viewName = DataSourceDynamicViewEnum.ETL_RESULTS;
  readonly getColumns = getEtlResultsDatasourceTableColumns;
  readonly rowClassRules = {
    'row-disabled': (params: RowClassParams<Datasource>) =>
      !params.node.selectable && params.node.level > 1,
    'row-regular-cursor': (params: RowClassParams<Datasource>) =>
      !params.node.selectable && params.node.level < 2,
  };
  autoGroupColumnDef: MeColDef<Datasource>;
  initialGroupByParam: string;
  checkboxes: WritableSignal<boolean | CheckboxSelectionCallback> = signal(false);
  hideDisabledCheckboxes: WritableSignal<boolean> = signal(false);
  groupSelects: WritableSignal<GroupSelectionMode> = signal('descendants');

  override ngOnInit(): void {
    super.ngOnInit();

    this.initialGroupByParam = this.activeParams.groupBy;

    this._setSelectionOptions();

    this.autoGroupColumnDef = {
      field: 'name',
      headerName: '',
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
      if (rowNode.level === 0) {
        rowNode.rowTooltip = 'Enabled only when selecting bottom level data source or sub group';
        return false;
      }
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
      await this._openDataRetentionDialog(action.selected);
    } else {
      await super.onActionClicked(action);
    }
  }

  override onSelectionChanged(nodes: Array<MeRowNode<any>>): void {
    if (!nodes.length || nodes[0].group) {
      this.triggerSelectDatasourceChange({
        dataSource: null,
        version: null,
      });
      return;
    }
    if (!nodes[0].group) {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].data,
        version: null,
      });
    }
  }

  override onFiltersParamsChanged(params: Params = {}): void {
    this.setFilterModelForTeamFilterState();
    this.filtersParamsChanged.emit(params);
  }

  onServerSideSelectionStateChanged(event: IServerSideGroupSelectionState): void {
    const rowNodes = this.agDataSourceTableEtlResultsStandaloneService.getSelectedSubGroupsAndDs(
      event,
      this.gridApi,
    );
    if (!rowNodes.length) {
      this.dataSourceMultiSelectionsChanged.emit([]);
    } else {
      this.dataSourceMultiSelectionsChanged.emit(rowNodes);
    }
  }

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }

  private _checkboxSelectionCallback = (params: CheckboxSelectionCallbackParams): boolean => {
    return params.node.level > 0;
  };

  private async _openDataRetentionDialog(datasource: Datasource): Promise<void> {
    const dsToBeAffected = await firstValueFrom(
      this.dataSourceTableBaseService.dataSourceService.getJobIds(datasource.jobIds, this.dataType),
    );
    await this._loadDataRetentionDialog();
    const currentJob = await this._getJob(datasource);
    const config = this.dataRetentionService.getEtlResultsDataRetentionConfig();
    //need to get the most update info of job, as it table only refresh every 1 min
    const dialogRef = this.dialog.open(SingleJobDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: ['dialog-panel-overlap', 'dialog-retention-etl-results-standalone'],
    });
    dialogRef.componentInstance.job = currentJob;
    dialogRef.componentInstance.config = config;
    dialogRef.componentInstance.tableDescription = `<div>The data sources below, created by job: <span class='mat-title-medium text-sys-error'>${datasource.jobIds[0]}</span> will be affected:  <br/><br /></div>`;
    dialogRef.componentInstance.table = this._getEnrichTable(dsToBeAffected);
    dialogRef.beforeClosed().subscribe((_) => this.refreshDataTwice());
  }

  private async _getJob(datasource: Datasource): Promise<ETLJobSnakeCase> {
    return firstValueFrom(
      this.etlJobService.getSingle(datasource.jobIds[datasource.jobIds.length - 1]),
    );
  }

  private async _loadDataRetentionDialog(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/single-job-data-retention-dialog');
  }

  private _getEnrichTable(datasources: Array<Datasource>): EnrichTable {
    const headers: EnrichTableRow = {
      cells: [
        {
          text: 'Name',
        },
        {
          text: 'Created By',
        },
        {
          text: 'Expires At',
        },
        {
          text: 'Creation Date',
        },
      ],
    };

    const rows: Array<EnrichTableRow> = [];

    datasources.forEach((ds: Datasource) =>
      rows.push({
        cells: [
          {
            text: ds.name,
            classes: ['truncated-cell', 'min-w-80'],
          },
          {
            text: ds.createdBy,
            classes: ['min-w-16'],
          },
          {
            text: formatDateShortWithPermanent(ds.expirationDate),
            classes: ['min-w-16'],
          },
          {
            text: formatDateFullOrReturnBlank(ds.createdAt),
            classes: ['max-w-24'],
          },
        ],
      }),
    );

    return {
      headers,
      rows,
    };
  }

  private _setSelectionOptions(): void {
    if (!this.selectionMode) {
      this.checkboxes.set(this._checkboxSelectionCallback);
      this.rowSelection = 'multiple';
      this.clearSelectedRowsFilteredOut = false;
    } else {
      this.rowSelection = 'single';
      this.clearSelectedRowsFilteredOut = true;
    }
  }
}
