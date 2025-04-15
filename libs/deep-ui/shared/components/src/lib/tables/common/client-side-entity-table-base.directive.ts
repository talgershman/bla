import {GetRowIdFunc, GetRowIdParams, GridApi, IsRowSelectable} from '@ag-grid-community/core';
import {
  ChangeDetectorRef,
  Directive,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {Params} from '@angular/router';
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
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {DeepUtilService} from 'deep-ui/shared/core';
import _isEqual from 'lodash-es/isEqual';
import {Subject} from 'rxjs';

@UntilDestroy()
@Directive()
export abstract class ClientSideEntityTableBaseDirective<T> {
  @ViewChild('nameCell', {static: true})
  nameCell: TemplateRef<any>;

  @ViewChild('statusCell', {static: true})
  statusCell: TemplateRef<any>;

  @Input()
  hideTableActions: boolean;

  @Input()
  technologiesOptions: Array<MeSelectOption>;

  @Input()
  queryParams: Params;

  @Input()
  tableFilters: Params;

  @Input()
  tableComponentId: string;

  @Input()
  triggerTableRefresh: Subject<void>;

  @Output()
  selectionChanged = new EventEmitter<Array<T>>();

  @Output()
  tableActionClicked = new EventEmitter<MeAgTableActionItemEvent<T>>();

  @Output()
  filtersParamsChanged = new EventEmitter<Params>();

  @Output()
  gridReady = new EventEmitter<MeAgTableApiService<T>>();

  columns: MeColDef<T>[];

  teamFilterState: TeamFilterStateTypes;

  externalFiltersKeys: Array<string>;

  entities: Array<T> = [];

  allEntities: Array<T> = [];

  gridApi: GridApi<T>;

  readonly clearSelectedRowsFilteredOut = true;
  readonly enableSideBar: string | boolean = true;
  readonly cacheQuickFilter = true;
  readonly rowSelection = 'single';
  readonly rowHeight = 52;

  abstract getTableColumnsDef: (options: MeColumnsOptions) => MeColDef<T>[];
  abstract fetchNewData: (showLoader: boolean) => void;
  abstract idProperty: string;
  abstract teamProperty: 'group' | 'team';
  abstract columnBeforeAction: string;
  abstract ignoreTeamFilterAttributes: Array<string>;

  protected selected: Array<T>;
  protected activeParams: Params;
  protected getTableFiltersActiveState = () =>
    getTableFiltersActiveState(this.columns, this.activeParams);

  protected tableOptions: MeColumnsOptions;

  private tableApiService: MeAgTableApiService<T>;
  private prevQueryParams: Params;
  private readonly REFRESH_INTERVAL = 60000;

  protected deepUtilService = inject(DeepUtilService);
  protected cd = inject(ChangeDetectorRef);
  private timerService = inject(MeTimerService);
  private userPreferencesService = inject(MeUserPreferencesService);
  private snackbar = inject(MeSnackbarService);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    this._setExternalFilterKeys();
    this.setTableOptions();
    this._setTeamFilterState();
    this._setTableColumns();
    this._setActiveParams();
    this._triggerRefresh();
  }
  ngAfterViewInit(): void {
    this.onFiltersParamsChanged(this.activeParams);
  }

  getRowId: GetRowIdFunc = (params: GetRowIdParams<T>) => `${params.data[this.idProperty]}`;

  isRowSelectable: IsRowSelectable = (_: MeRowNode): boolean => true;

  onGridReady(tableApiService: MeAgTableApiService<T>): void {
    this.tableApiService = tableApiService;
    this.gridApi = this.tableApiService.getGridApi();
    const filterModel = this.getTableFiltersActiveState();
    this.gridApi.setFilterModel(filterModel);
    this.fetchNewData(true);
    this._startPollingData();
    this.gridReady.emit(tableApiService);
  }

  async onActionClicked(action: MeAgTableActionItemEvent<T>): Promise<void> {
    this.tableActionClicked.emit(action);
  }

  async onActionClickedRunInZone(action: MeAgTableActionItemEvent<T>): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  onRefreshButtonClicked(): void {
    this.fetchNewData(true);
  }

  onTeamFilterClicked(state: TeamFilterStateTypes): void {
    this.teamFilterState = state;
    this.refreshTable(this.allEntities);
    this.gridApi?.onFilterChanged();
  }

  onSelectionChanged(nodes: Array<MeRowNode<T>>): void {
    if (!nodes.length) {
      this.selected = [];
    } else {
      this.selected = nodes.map((n: MeRowNode<T>) => n.data);
    }
    this.selectionChanged.emit(this.selected);
  }

  onFiltersParamsChanged(params: Params = null): void {
    if (!_isEqual(params, this.prevQueryParams)) {
      this.filtersParamsChanged.emit(params);
    }
    this.prevQueryParams = params;
  }

  copyJobIdToClipboard(event: MouseEvent, id: string): void {
    event.stopPropagation();
    copy(id);
    this.snackbar.onCopyToClipboard();
  }

  isExternalFilterPresent = (): boolean => {
    return !!this.teamFilterState;
  };

  doesExternalFilterPass = (node: MeRowNode<T>): boolean => {
    if (!node?.data || this._shouldIgnoreTeamFilter()) {
      return true;
    }
    switch (this.teamFilterState) {
      case 'me': {
        return this.deepUtilService.isCurrentUserData(node.data, 'createdByUsername');
      }
      case 'my_teams': {
        return this.deepUtilService.isIncludedInDeepGroups(node.data, this.teamProperty);
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

  protected refreshTable(data: Array<T>): void {
    this.allEntities = data;
    this.entities = this._filterDataByTeam(data);
    this.cd.detectChanges();
  }

  protected setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
        statusCell: this.statusCell,
      },
      showActions: !this.hideTableActions,
      selectOptions: {
        technology: this.technologiesOptions,
      },
    };
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

  private _triggerRefresh(): void {
    this.triggerTableRefresh
      ?.asObservable()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onRefreshButtonClicked());
  }

  private _filterDataByTeam(data: Array<T>): Array<T> {
    const filteredEntities = [...(data || [])];
    switch (this.teamFilterState) {
      case 'me': {
        const nextData = this.deepUtilService.filterByCurrentUserData(
          filteredEntities,
          'createdByUsername',
        );
        return nextData;
      }
      case 'my_teams': {
        const nextData = this.deepUtilService.filterByDeepGroups(
          filteredEntities,
          this.teamProperty,
        );
        return nextData;
      }
      case 'none': {
        return filteredEntities;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.teamFilterState;
        throw new Error(`Unhandled _filterDataByTeam case: ${exhaustiveCheck}`);
      }
    }
  }

  private _startPollingData(): void {
    this.timerService
      .timer(this.REFRESH_INTERVAL, this.REFRESH_INTERVAL)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.fetchNewData(false);
      });
  }

  private _setTableColumns() {
    const columns = this.getTableColumnsDef(this.tableOptions);
    setMaxNumConditions(columns);
    this.columns = columns;
  }

  private _setTeamFilterState() {
    this.teamFilterState =
      this.userPreferencesService.getComponentState(this.tableComponentId)?.teamFilterState ||
      this.deepUtilService.getTeamFilterInitState();
  }

  private _setExternalFilterKeys(): void {
    this.externalFiltersKeys = [this.teamProperty, 'createdByUsername'];
  }

  private _setActiveParams(): void {
    if (Object.keys(this.queryParams || {}).length) {
      this.activeParams = {
        ...this.queryParams,
      };
    }

    if (this.tableFilters) {
      this.activeParams = {
        ...this.activeParams,
        ...this.tableFilters,
      };
    }
  }
}
