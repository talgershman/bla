import {
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  RefreshServerSideParams,
} from '@ag-grid-community/core';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeColumnsOptions,
  MeGroupByItem,
  MeRowNode,
  TeamFilterStateTypes,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  getTableFiltersActiveState,
  MeAgTableApiService,
  setMaxNumConditions,
} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {CommonTableActions} from 'deep-ui/shared/components/src/lib/common';
import {IshowUrlDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/ishow-url-dialog';
import {JsonSnippetComponent} from 'deep-ui/shared/components/src/lib/dialogs/json-snippet';
import {
  DataSourceCustomActions,
  DataSourceDynamicViewEnum,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DeepUtilService} from 'deep-ui/shared/core';
import {
  AllowedStatuesForQuery,
  Datasource,
  DataSourceSelection,
  VersionDataSource,
} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import _intersection from 'lodash-es/intersection';
import _map from 'lodash-es/map';
import {firstValueFrom} from 'rxjs';
import {tap} from 'rxjs/operators';

import {AgDataSourceDatasource} from './ag-data-source.datasource';
import {DataSourceTableBaseService} from './data-source-table-base.service';

@UntilDestroy()
@Directive()
export abstract class AgDataSourceSsrmTableBaseDirective
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('classifierCell', {static: true})
  classifierCell: TemplateRef<any>;

  @ViewChild('statusCell', {static: true})
  statusCell: TemplateRef<any>;

  @Input()
  selectedDataSources: Array<Datasource>;

  @Input()
  selectionMode: boolean;

  @Input()
  tableFilters: Params;

  @Output()
  filtersParamsChanged = new EventEmitter<Params>();

  @Output()
  tableActionClicked = new EventEmitter<MeAgTableActionItemEvent<Datasource>>();

  @Output()
  dataSourceSelectionChanged = new EventEmitter<DataSourceSelection>();

  @Output()
  gridReady = new EventEmitter<MeAgTableApiService<Datasource>>();

  protected dataSourceTableBaseService = inject(DataSourceTableBaseService);
  protected deepUtilService = inject(DeepUtilService);
  protected timerService = inject(MeTimerService);
  protected userPreferencesService = inject(MeUserPreferencesService);
  protected cd = inject(ChangeDetectorRef);
  protected dialog = inject(MatDialog);
  protected ngZone = inject(NgZone);

  clearSelectedRowsFilteredOut = true;

  columns: MeColDef<Datasource>[];

  dataSources: Array<Datasource>;

  rowSelection = 'single';

  teamFilterState: TeamFilterStateTypes;

  agGridDataSource: AgDataSourceDatasource<Datasource>;

  gridApi: GridApi<Datasource>;

  currentGroupByItem: MeGroupByItem;

  readonly rowHeight = 52;

  readonly enableSideBar: string | boolean = true;

  readonly groupDisplayType = 'singleColumn';

  readonly externalFiltersKeys = ['team', 'createdByUsername'];

  readonly ignoredFiltersKeys = ['jobIds'];

  abstract ignoreTeamFilterAttributes: Array<string>;

  abstract autoGroupColumnDef: MeColDef<Datasource> | MeColDef<VersionDataSource>;

  abstract hideTableActions: boolean;

  abstract getColumns: (options: MeColumnsOptions) => MeColDef<Datasource>[];

  abstract viewName: DataSourceDynamicViewEnum;

  abstract dataType: string;

  abstract tableComponentId: string;

  protected tableApiService: MeAgTableApiService<Datasource>;

  protected tableOptions: MeColumnsOptions;

  protected activeParams: Params;

  private isFirstLoad = true;

  private readonly REFRESH_INTERVAL = 60000;
  private readonly SECOND_REFRESH_TIMER = 5000;

  private groupKeysArr: any = {};

  ngOnInit(): void {
    this.agGridDataSource = new AgDataSourceDatasource<Datasource>(
      this.dataSourceTableBaseService.agDatasourceService,
      this.dataType,
    );
    this.tableOptions = {
      templates: {
        classifierCell: this.classifierCell,
        statusCell: this.statusCell,
      },
      showActions: !this.hideTableActions,
      selectionMode: this.selectionMode,
      isIncludedInDeepGroupsOrIsAdmin: this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin.bind(
        this.deepUtilService,
      ),
    };
    this.teamFilterState =
      this.userPreferencesService.getComponentState(this.tableComponentId)?.teamFilterState ||
      this.deepUtilService.getTeamFilterInitState();
    const columns = this.getColumns(this.tableOptions);
    setMaxNumConditions(columns);
    this.columns = columns;

    this.activeParams = {
      ...(this.dataSourceTableBaseService.router.parseUrl(
        this.dataSourceTableBaseService.router.url,
      )?.queryParams || {}),
    };
    if (this.tableFilters) {
      this.activeParams = {
        ...this.activeParams,
        ...this.tableFilters,
      };
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.onFiltersParamsChanged(this.activeParams);
    });
  }

  ngOnDestroy(): void {
    this._clearQueryParams();
  }

  getRowId: GetRowIdFunc = (params: GetRowIdParams<any>) => {
    let currentGroupKey = 'id';
    if (this.groupKeysArr[params.level]) {
      currentGroupKey = this.groupKeysArr[params.level];
    } else {
      const rowGroupsColumns = params.api.getRowGroupColumns();
      //check that level is not leaf
      if (rowGroupsColumns.length > params.level) {
        const currentGroup = rowGroupsColumns[params.level];
        currentGroupKey = currentGroup.getUserProvidedColDef().field;
      }
      this.groupKeysArr[params.level] = currentGroupKey;
    }
    if (params.parentKeys?.length) {
      return `${params.parentKeys.join('-')}-${params.data[currentGroupKey]}`;
    }
    return `${params.data?.[currentGroupKey]}`;
  };

  getChildCount: (data: any) => number = (data: any) => data.childCount;

  isRowSelectable(rowNode: MeRowNode): boolean {
    if (!AllowedStatuesForQuery.includes(rowNode.data.status)) {
      rowNode.rowTooltip = 'Status is not allowed';
      return false;
    }
    const invalidMsg = this.handleSubTypeValidation(
      rowNode.parent?.data?.id ? rowNode.parent.data : rowNode.data,
      rowNode.parent?.data?.id ? rowNode.data : null,
    );
    if (invalidMsg) {
      rowNode.rowTooltip = invalidMsg;
      return false;
    }
    return true;
  }

  onGridReady(tableApiService: MeAgTableApiService<Datasource>): void {
    this.tableApiService = tableApiService;
    this.gridApi = this.tableApiService.getGridApi();
    const filterModel = getTableFiltersActiveState(this.columns, this.activeParams);
    this.gridApi.setFilterModel(filterModel);
    this.setFilterModelForTeamFilterState();
    this.tableApiService.setServerSideDatasource(this.agGridDataSource);
    this._startPollingData();
    this.gridReady.emit(tableApiService);
  }

  onTeamFilterClicked(state: TeamFilterStateTypes): void {
    this.teamFilterState = state;
    this.setFilterModelForTeamFilterState();
  }

  onSelectionChanged(nodes: Array<MeRowNode<any>>): void {
    if (!nodes.length) {
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

  onFiltersParamsChanged(params: Params = null): void {
    const prevParams = {};
    //only for first load we should not remove initial query params
    if (!this.isFirstLoad) {
      const _activeParams: Params = this.activeParams;
      for (const key in _activeParams) {
        if (_activeParams.hasOwnProperty(key)) {
          prevParams[key] = null;
        }
      }
    }
    this.isFirstLoad = false;
    const view = Object.keys(DataSourceDynamicViewEnum).find(
      (key) => DataSourceDynamicViewEnum[key] === this.viewName,
    );
    const nextParams = {
      ...prevParams,
      ...(params || {}),
      view,
    };

    const url = this.dataSourceTableBaseService.router
      .createUrlTree([], {
        queryParams: nextParams,
        queryParamsHandling: 'merge',
      })
      ?.toString();

    this.dataSourceTableBaseService.location?.go(url);
  }

  async onActionClicked(action: MeAgTableActionItemEvent<any>): Promise<void> {
    if (action.id === CommonTableActions.INFO) {
      await this._openInfoDialog(action);
    } else if (action.id === DataSourceCustomActions.QueryDataSource) {
      this.dataSourceTableBaseService.queryDataSource(action.selected);
    } else if (action.id === DataSourceCustomActions.IshowURL) {
      this._openIshowDialogDialog(action.selected);
    }
    this.tableActionClicked.emit(action);
  }

  async onActionClickedRunInZone(action: MeAgTableActionItemEvent<any>): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  copyJobIdToClipboard(event: MouseEvent, id: string): void {
    event.stopPropagation();
    copy(id);
    this.dataSourceTableBaseService.snackbar.onCopyToClipboard();
  }

  onGroupByChanged(item: MeGroupByItem): void {
    this.groupKeysArr = {};
    this.currentGroupByItem = item;
    this.autoGroupColumnDef = {
      ...this.autoGroupColumnDef,
      headerName: item.title.split('Group by : ')[1],
    };
  }

  protected refreshData(params?: RefreshServerSideParams): void {
    this.tableApiService.refreshServerSideData(params);
  }

  protected refreshDataTwice(params?: RefreshServerSideParams): void {
    this.timerService
      .timer(this.SECOND_REFRESH_TIMER)
      .pipe(
        tap(() => {
          this.refreshData(params);
        }),
        untilDestroyed(this),
      )
      .subscribe();
    this.refreshData(params);
  }

  protected handleSubTypeValidation(datasource: Datasource, version: VersionDataSource): string {
    const allowedSubTypes = this._getAllowedSubTypes();
    if (allowedSubTypes.length && !allowedSubTypes.includes(datasource.dataSubType)) {
      return 'Sub type is not allowed';
    }
    const invalidMsg = this._handleSubTypeFrameValidation(datasource, version);
    if (invalidMsg) {
      return invalidMsg;
    }
    return '';
  }

  protected triggerSelectDatasourceChange(selection: DataSourceSelection): void {
    this.dataSourceSelectionChanged.emit(selection);
  }

  private _openIshowDialogDialog(datasource: Datasource) {
    const dialogRef = this.dialog.open(IshowUrlDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.ishowUrl = datasource.datasourceVirtualUrl;
  }

  private _clearQueryParams(): void {
    const params =
      this.dataSourceTableBaseService.router.parseUrl(this.dataSourceTableBaseService.router.url)
        ?.queryParams || {};
    const resetParams = {
      ...params,
    };
    // eslint-disable-next-line
    for (const prob in resetParams) {
      resetParams[prob] = null;
    }
    this.dataSourceTableBaseService.router?.navigate([], {
      queryParams: resetParams,
      queryParamsHandling: 'merge',
    });
  }

  private _startPollingData(): void {
    this.timerService
      .timer(this.REFRESH_INTERVAL, this.REFRESH_INTERVAL)
      .pipe(
        tap(() => {
          this.refreshData(); // default = {purge: false}, all rows at the level getting refreshed are kept until rows are loaded (no 'loading' rows appear), re-fetch all in-memory pages
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private _shouldIgnoreTeamFilter(): boolean {
    const filterModel = this.tableApiService?.getGridApi()?.getFilterModel();
    for (const [key] of Object.entries(filterModel || {})) {
      if (this.ignoreTeamFilterAttributes.includes(key)) {
        return true;
      }
    }
    return false;
  }

  protected setFilterModelForTeamFilterState(): void {
    if (!this.tableApiService) {
      return;
    }
    if (this._shouldIgnoreTeamFilter()) {
      this.tableApiService?.setFilterModel({}, ['createdByUsername', 'team']);
      return;
    }
    switch (this.teamFilterState) {
      case 'me': {
        this.tableApiService.setFilterModel(
          {
            createdByUsername: {
              filterType: 'text',
              type: 'equals',
              filter: this.deepUtilService.getCurrentUser().userName,
            },
          },
          ['team'],
        );
        break;
      }
      case 'my_teams': {
        this.tableApiService.setFilterModel(
          {
            team: {
              filterType: 'text',
              type: 'multi',
              filter: this.deepUtilService.getDeepTeamsWithoutExtra(),
            },
          },
          ['createdByUsername'],
        );
        break;
      }
      case 'none': {
        this.tableApiService.setFilterModel({}, ['createdByUsername', 'team']);
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.teamFilterState;
        throw new Error(`Unhandled _getFilterEntitiesByFilterState case: ${exhaustiveCheck}`);
      }
    }
  }

  private async _openInfoDialog(action: MeAgTableActionItemEvent<Datasource>): Promise<void> {
    const dataSourceData = await firstValueFrom(
      this.dataSourceTableBaseService.dataSourceService.getSingle(
        (action.selected as unknown as VersionDataSource).dataSourceId || action.selected.id,
      ),
    );
    await this._loadJsonSnippetComponent();
    this.dataSourceTableBaseService.dialog.open(JsonSnippetComponent, {
      autoFocus: false,
      restoreFocus: false,
      data: (action.selected as unknown as VersionDataSource).dataSourceId
        ? (dataSourceData as any).datasourceversionSet.find(
            (version: VersionDataSource) =>
              version.id === (action.selected as unknown as VersionDataSource).id,
          )
        : dataSourceData,
      panelClass: 'dialog-panel-overlap',
    });
  }

  private async _loadJsonSnippetComponent(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/json-snippet');
  }

  private _getAllowedSubTypes(): Array<string> {
    const allowedSubTypesArrays = _map(this.selectedDataSources, 'allowedSubTypes');
    return _intersection(...allowedSubTypesArrays);
  }

  private _handleSubTypeFrameValidation(
    dataSource: Datasource,
    version: VersionDataSource,
  ): string {
    if (dataSource.dataSubType !== 'frames') {
      return '';
    }
    const allowedFrameIndicators = this._getAllowedFrameIndicators();
    // all is allowed
    if (allowedFrameIndicators === null) {
      return '';
    }
    const currentFrameIndicators = version?.frameIndicators || dataSource?.frameIndicators || [];
    const isValid = _intersection(allowedFrameIndicators, currentFrameIndicators);
    if (!isValid.length) {
      return `Data Source must contains at least one of the columns: ${allowedFrameIndicators.join(
        ', ',
      )}`;
    }
    return '';
  }

  private _getAllowedFrameIndicators(): Array<string> | null {
    const dataSources = _filter(
      this.selectedDataSources,
      (datasource: Datasource) => datasource.dataSubType === 'frames',
    );
    // no selection was made yet
    if (!dataSources?.length) {
      return null;
    }
    let intersectionArr = dataSources[0].frameIndicators;
    for (const datasource of dataSources) {
      intersectionArr = _intersection(intersectionArr, datasource.frameIndicators);
    }
    return intersectionArr;
  }
}
