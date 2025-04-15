import {ClientSideRowModelStep, GridApi, IsRowSelectable} from '@ag-grid-community/core';
import {
  ChangeDetectorRef,
  Component,
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
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {Params} from '@angular/router';
import {MeClientSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/client-side-table';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeColumnsOptions,
  MeRowNode,
  TeamFilterStateTypes,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  getTableFiltersActiveState,
  MeAgTableApiService,
  setMaxNumConditions,
} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {CommonTableActions} from 'deep-ui/shared/components/src/lib/common';
import {JsonSnippetComponent} from 'deep-ui/shared/components/src/lib/dialogs/json-snippet';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {
  DataSourceCustomActions,
  DataSourceDynamicViewEnum,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DeepUtilService} from 'deep-ui/shared/core';
import {Datasource, DataSourceSelection} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _filter from 'lodash-es/filter';
import _map from 'lodash-es/map';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {firstValueFrom} from 'rxjs';

import {getDeSearchDatasourceTableColumns} from './ag-data-source-table-de-search-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-de-search',
  templateUrl: './ag-data-source-table-de-search.component.html',
  styleUrls: ['./ag-data-source-table-de-search.component.scss'],
  providers: [DataSourceTableBaseService],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MeTooltipDirective,
    MeClientSideTableComponent,
  ],
})
export class AgDataSourceTableDeSearchComponent implements OnInit, OnDestroy {
  @Input()
  hideTableActions: boolean;

  @ViewChild('classifierCell', {static: false})
  classifierCell: TemplateRef<any>;

  @ViewChild('statusCell', {static: false})
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

  protected dataSourceTableBaseService = inject(DataSourceTableBaseService);
  protected deepUtilService = inject(DeepUtilService);
  protected timerService = inject(MeTimerService);
  protected userPreferencesService = inject(MeUserPreferencesService);
  protected cd = inject(ChangeDetectorRef);
  protected ngZone = inject(NgZone);

  columns: MeColDef<Datasource>[];

  teamFilterState: TeamFilterStateTypes;

  entities: Array<Datasource> = [];

  allEntities: Array<Datasource> = [];

  readonly tableComponentId = 'data-source--de-search';
  readonly dataType = 'clips';
  readonly viewName = DataSourceDynamicViewEnum.DE_SEARCH;
  readonly getColumns = getDeSearchDatasourceTableColumns;
  readonly clearSelectedRowsFilteredOut = true;
  readonly enableSideBar: string | boolean = true;
  readonly cacheQuickFilter = true;
  readonly rowSelection = 'single';
  readonly rowHeight = 52;
  readonly externalFiltersKeys = ['team', 'createdByUsername'];

  private gridApi: GridApi<Datasource>;
  private tableApiService: MeAgTableApiService<Datasource>;
  private tableOptions: MeColumnsOptions;
  private isFirstLoad = true;
  private activeParams: Params;
  private readonly REFRESH_INTERVAL = 60000;

  ngOnInit(): void {
    this.tableOptions = {
      templates: {
        classifierCell: this.classifierCell,
        statusCell: this.statusCell,
      },
      showActions: !this.hideTableActions,
      selectionMode: this.selectionMode,
    };

    this.teamFilterState = 'none';
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

    requestIdleCallback(() => this.onFiltersParamsChanged(this.activeParams));
  }
  ngOnDestroy(): void {
    this._clearQueryParams();
  }

  isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (!this.selectionMode) {
      return true;
    }

    if (_map(this.selectedDataSources, 'id').includes(rowNode.data.id)) {
      rowNode.rowTooltip = 'Already selected';
      return false;
    }

    return true;
  };

  onGridReady(tableApiService: MeAgTableApiService<Datasource>): void {
    this.tableApiService = tableApiService;
    this.gridApi = this.tableApiService.getGridApi();
    const filterModel = getTableFiltersActiveState(this.columns, this.activeParams);
    this.gridApi.setFilterModel(filterModel);
    this._fetchDataSources();
    this._startPollingData();
  }

  onRefreshButtonClicked(_?: ClientSideRowModelStep): void {
    this._fetchDataSources(true);
  }

  onTeamFilterClicked(state: TeamFilterStateTypes): void {
    this.teamFilterState = state;
    this._refreshDataSourceTable(this.allEntities);
    this.gridApi.onFilterChanged();
  }

  onSelectionChanged(nodes: Array<MeRowNode<any>>): void {
    if (!nodes.length) {
      this._onSelectPerfectDatasource({
        dataSource: null,
        version: null,
      });
    } else {
      this._onSelectPerfectDatasource({
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
    }
    this.tableActionClicked.emit(action);
  }

  async onActionClickedRunInZone(action: MeAgTableActionItemEvent<any>): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }

  copyJobIdToClipboard(event: MouseEvent, id: string): void {
    event.stopPropagation();
    copy(id);
    this.dataSourceTableBaseService.snackbar.onCopyToClipboard();
  }

  isExternalFilterPresent = (): boolean => {
    return !!this.teamFilterState;
  };

  doesExternalFilterPass = (node: MeRowNode<any>): boolean => {
    if (!node?.data) {
      return true;
    }
    switch (this.teamFilterState) {
      case 'me': {
        return this.deepUtilService.isCurrentUserData(node.data, 'createdByUsername');
      }
      case 'my_teams': {
        return this.deepUtilService.isIncludedInDeepGroups(node.data, 'team');
      }
      case 'none': {
        return true;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.teamFilterState;
        throw new Error(`Unhandled doesExternalFilterPass case: ${exhaustiveCheck}`);
      }
    }
  };

  private _fetchDataSources(showLoader = true): void {
    const params = {dataType: this.dataType};
    if (showLoader) {
      this.gridApi?.setGridOption('loading', true);
    }

    this.dataSourceTableBaseService.dataSourceService
      .getMulti(params)
      .pipe(untilDestroyed(this))
      .subscribe((dataSources: Array<Datasource>) => {
        this.allEntities = dataSources;
        this._refreshDataSourceTable(dataSources);
      });
  }

  private _refreshDataSourceTable(data: Array<Datasource>): void {
    this.entities = this._getDataSourceData(data);
    this.cd.detectChanges();
  }

  private _getDataSourceData(data: Array<Datasource>): Array<Datasource> {
    let filteredEntities = [...(data || [])];
    filteredEntities = this._filterOutInactiveDataSources(filteredEntities);
    switch (this.teamFilterState) {
      case 'me': {
        const nextData = this.deepUtilService.filterByCurrentUserData(
          filteredEntities,
          'createdByUsername',
        );
        return nextData;
      }
      case 'my_teams': {
        const nextData = this.deepUtilService.filterByDeepGroups(filteredEntities, 'team');
        return nextData;
      }
      case 'none': {
        return filteredEntities;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.teamFilterState;
        throw new Error(`Unhandled _getFilterEntitiesByFilterState case: ${exhaustiveCheck}`);
      }
    }
  }

  private _filterOutInactiveDataSources(dataSources: Array<Datasource>): Array<Datasource> {
    return _filter(dataSources, (dataSource: Datasource) => dataSource.status !== 'inactive');
  }

  private _startPollingData(): void {
    this.timerService
      .timer(this.REFRESH_INTERVAL, this.REFRESH_INTERVAL)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this._fetchDataSources(false);
      });
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

  private _onSelectPerfectDatasource(selection: DataSourceSelection): void {
    this.dataSourceSelectionChanged.emit(selection);
  }

  private async _openInfoDialog(action: MeAgTableActionItemEvent<Datasource>): Promise<void> {
    const dataSourceData = await firstValueFrom(
      this.dataSourceTableBaseService.dataSourceService.getSingle(action.selected.id),
    );
    await this._loadJsonSnippetComponent();
    this.dataSourceTableBaseService.dialog.open(JsonSnippetComponent, {
      autoFocus: false,
      restoreFocus: false,
      data: dataSourceData,
      panelClass: 'dialog-panel-overlap',
    });
  }

  private async _loadJsonSnippetComponent(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/json-snippet');
  }
}
