import {ICellRendererAngularComp} from '@ag-grid-community/angular';
import {
  CheckboxSelectionCallback,
  ClientSideRowModelStep,
  Column,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnState,
  ColumnVisibleEvent,
  DisplayedColumnsChangedEvent,
  DragStartedEvent,
  DragStoppedEvent,
  FilterChangedEvent,
  FirstDataRenderedEvent,
  GetRowIdFunc,
  GridApi,
  GridOptions,
  GridPreDestroyedEvent,
  GridReadyEvent,
  IRowNode,
  IsRowSelectable,
  ModelUpdatedEvent,
  Module,
  RefreshServerSideParams,
  RowClassParams,
  RowClassRules,
  RowClickedEvent,
  RowGroupingDisplayType,
  RowGroupOpenedEvent,
  RowHeightParams,
  RowModelType,
  RowSelectedEvent,
  SelectionChangedEvent,
  SideBarDef,
  SortChangedEvent,
  ToolPanelVisibleChangedEvent,
} from '@ag-grid-community/core';
import {
  GroupSelectionMode,
  MultiRowSelectionOptions,
  SingleRowSelectionOptions,
} from '@ag-grid-community/core/dist/types/src/entities/gridOptions';
import {ToolPanelDef} from '@ag-grid-community/core/dist/types/src/interfaces/iSideBar';
import {
  ChangeDetectorRef,
  Component,
  computed,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  input,
  OnInit,
  Output,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {Params} from '@angular/router';
import {MeAgLoadingOverlayComponent} from '@mobileye/material/src/lib/components/ag-table/ag-loading-overlay';
import {MeAgNoRowsOverlayComponent} from '@mobileye/material/src/lib/components/ag-table/ag-no-rows-overlay';
import {
  MeActionsBaseTableDirective,
  MeAgTableActionItemEvent,
  MeColDef,
  MeDetailCellRendererParams,
  MeFilterModelAndColDef,
  MeGroupByItem,
  MeGroupByItemDerived,
  MeModifiedColsChanges,
  MeModifiedColumnState,
  MeModifiedEventType,
  MeRowGroupPanelShow,
  MeRowNode,
  MeTableContext,
  MeTableState,
  TeamFilterStateTypes,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {debounce} from 'lodash-decorators/debounce';
import {union} from 'lodash-es';
import uniq from 'lodash-es/uniq';
import {BehaviorSubject} from 'rxjs';

@Directive()
export abstract class BaseTableDirective<T> implements MeActionsBaseTableDirective<T>, OnInit {
  static licenseActivated = false;

  @Input()
  componentId: string;

  @Input()
  columnDefs: MeColDef<T>[];

  @Input()
  rowGroupPanelShow: MeRowGroupPanelShow = 'never';

  enableSideBar = input<string | boolean>();

  @Input()
  hideTeamFilterState: boolean;

  @Input()
  teamFilterState: TeamFilterStateTypes;

  @Input()
  ignoreSavingTeamFilterState: boolean;

  @Input()
  clearSelectedRowsFilteredOut: boolean;

  @Input()
  externalFiltersKeys: Array<string> = ['team'];

  @Input()
  ignoredFiltersKeys: Array<string> = [];

  @Input()
  rowSelection: 'single' | 'multiple';

  @Input()
  getRowId: GetRowIdFunc<T>;

  @Input()
  isRowSelectable: IsRowSelectable;

  @Input()
  forEachNodeAfterFilterAndSortCallback: (rowNode: IRowNode<T>, index: number) => void;

  @Input()
  rowClass: string;

  @Input()
  get rowClassRules(): RowClassRules<T> {
    return this._rowClassRules;
  }

  set rowClassRules(val: RowClassRules<T>) {
    this._rowClassRules = {
      ...this._rowClassRules,
      ...(val || {}),
    };
  }

  pinnedTopRowData = input<any[]>([]);

  @Input()
  masterDetail: boolean;

  @Input()
  detailCellRenderer: ICellRendererAngularComp;

  @Input()
  detailRowAutoHeight = true;

  @Input()
  detailCellRendererParams: MeDetailCellRendererParams;

  @Input()
  autoGroupColumnDef: MeColDef<T> = {
    filter: 'agGroupColumnFilter',
    cellRendererParams: {
      suppressDoubleClickExpand: true,
    },
    minWidth: 380,
  };

  @Input()
  groupDisplayType: RowGroupingDisplayType;

  @Input()
  moduleNames: string[];

  @Input()
  rowHeight: number;

  @Input()
  suppressRowClickSelection: boolean;

  checkboxes = input<boolean | CheckboxSelectionCallback>(false);

  hideDisabledCheckboxes = input<boolean>(false);

  groupSelects = input<GroupSelectionMode>('self');

  @Input()
  expandOnGroups: boolean;

  @Input()
  initialGroupByParam: string;

  @Input()
  getRowHeight: (params: RowHeightParams<T>) => number;

  groupByOptions = input<Array<MeGroupByItem>>();

  groupByAdditionalColumns = input<Record<string, Array<string>>>();

  @Output()
  gridReady = new EventEmitter<MeAgTableApiService<T>>();

  @Output()
  firstDataRenderedEvent = new EventEmitter<FirstDataRenderedEvent<T>>();

  // triggered by any select / deselect operation
  @Output()
  rowSelected = new EventEmitter<RowSelectedEvent<T>>();

  // triggered by user select / deselect operation only
  @Output()
  selectionChanged = new EventEmitter<Array<MeRowNode<T>>>();

  @Output()
  refreshButtonClicked: EventEmitter<ClientSideRowModelStep | RefreshServerSideParams>;

  @Output()
  actionClicked = new EventEmitter<MeAgTableActionItemEvent<T>>();

  @Output()
  teamFilterClicked = new EventEmitter<TeamFilterStateTypes>();

  @Output()
  filtersParamsChanged = new EventEmitter<Params>();

  @Output()
  restoreDefaultClicked = new EventEmitter<void>();

  @Output()
  displayedColumnsChangedEvent = new EventEmitter<DisplayedColumnsChangedEvent>();

  groupByChanged = output<MeGroupByItem>();

  grid = viewChild('grid', {read: ElementRef});

  gridWidth: number;

  sideBarDef = computed(() => {
    const sideBar = this.enableSideBar();
    if (sideBar === true) {
      return this.defaultSideBarDef;
    } else if (sideBar === 'filters') {
      return {
        toolPanels: [this.defaultFiltersSideBarDef],
      } as SideBarDef;
    } else if (sideBar === 'columns') {
      return {
        toolPanels: [this.defaultColumnsSideBarDef],
      } as SideBarDef;
    } else {
      return null;
    }
  });

  defaultFiltersSideBarDef: ToolPanelDef = {
    id: 'filters',
    labelDefault: 'Filters',
    labelKey: 'filters',
    iconKey: 'filter',
    toolPanel: 'agFiltersToolPanel',
    width: 310,
  };

  defaultColumnsSideBarDef: ToolPanelDef = {
    id: 'columns',
    labelDefault: 'Columns',
    labelKey: 'columns',
    iconKey: 'columns',
    toolPanel: 'agColumnsToolPanel',
    toolPanelParams: {
      suppressRowGroups: true,
      suppressValues: true,
      suppressPivots: true,
      suppressPivotMode: true,
      suppressColumnFilter: false,
      suppressColumnSelectAll: true,
      suppressColumnExpandAll: true,
    },
    width: 310,
  };

  defaultSideBarDef: SideBarDef = {
    toolPanels: [this.defaultColumnsSideBarDef, this.defaultFiltersSideBarDef],
  };

  viewGroupBy = {
    options: this.groupByOptions(),
    initial: signal<MeGroupByItemDerived>(null),
    current: signal<MeGroupByItemDerived>(null),
    allKeys: computed(() => {
      const arr = (this.groupByOptions() || []).flatMap((item) =>
        item.groups.map((group) => group.colId),
      );
      return uniq(arr);
    }),
    optionsWithKeys: computed(() => {
      const items = this.groupByOptions() || [];
      const result: Array<MeGroupByItemDerived> = items.map((option) => ({
        ...option,
        key: option.groups.map((group) => group.colId).join('-'),
      }));
      return result;
    }),
  };

  viewState = computed(() => {
    return {
      groupBy: this.viewGroupBy,
    };
  });

  readonly USER_PREFERENCE_SUFFIX = '_V1'; // todo: remove after migration

  readonly NEW_USER_PREFERENCE_SUFFIX = '_V2';

  readonly localeText = {
    clearFilter: 'Clear Filter',
  };

  readonly ignoredModifiedColIds = new Set(['actions', 'ag-Grid-ControlsColumn']);

  loadingOverlayComponent = MeAgLoadingOverlayComponent;

  rowModelType: RowModelType;

  pagination = true;

  paginationPageSizeSelector = false;

  paginationPageSize = 25;

  deltaSort = true;

  // Set to true to keep detail rows for when they are displayed again (will not remove from DOM).
  keepDetailRows = false;

  noRowsOverlayComponent = MeAgNoRowsOverlayComponent;

  numberOfSelectedNodes = new BehaviorSubject<number>(0);

  numberOfSelectedNodes$ = this.numberOfSelectedNodes.asObservable();

  currentAdditionalColumns: Array<string> = [];

  currentChangedColumnStates: Array<MeModifiedColumnState & {colId: string}> = [];

  animateRows: boolean;

  context: MeTableContext<T> = {
    parentComponent: this,
  };

  components: Record<string, any> = {};

  modules: Module[];

  defaultColDef: MeColDef<T> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    autoHeight: true,
    resizable: true,
    lockVisible: false,
    headerComponent: 'meAgCustomHeaderComponent',
  };

  icons: {
    [key: string]: string;
  } = {
    columnMoveMove:
      '<span class="material-icons-outlined text-lg align-middle pl-2">open_with</span>',
    columnMoveLeft:
      '<span class="material-icons-outlined text-lg align-middle pl-2">arrow_back</span>',
    columnMoveRight:
      '<span class="material-icons-outlined text-lg align-middle pl-2">arrow_forward</span>',
    columnMovePin:
      '<span class="material-icons-outlined text-lg align-middle pl-2">push_pin</span>',
    columnMoveHide:
      '<span class="material-icons-outlined text-lg align-middle pl-2">visibility_off</span>',
    dropNotAllowed:
      '<span class="material-icons-outlined text-lg align-middle pl-2">do_disturb_alt</span>',
  };

  selectionOptions = computed(() => this.getSelectionOptions());

  gridOptions: GridOptions<T> = {
    onGridPreDestroyed: (event: GridPreDestroyedEvent<T>) => this._onGridPreDestroyed(event),
  };

  gridApi: GridApi<T>;

  defaultColumnState: Array<ColumnState>;

  shownDefaultColumnState: Array<ColumnState>;

  shownDefaultPartialColumnState: Array<Partial<ColumnState>>;

  shownResizedColumnState: Array<ColumnState>;

  prevModifiedDisplayedColumns: Record<string, MeModifiedColumnState>;

  modifiedDisplayedColumns: Record<string, MeModifiedColumnState>;

  resolutions: Record<string, Record<string, number>>;

  lastColumnState: Array<ColumnState>;

  chipsFilterData: Array<MeFilterModelAndColDef> = [];

  isColumnWidthChanged = false;

  isDefaultColumnState = true;

  isReady = new BehaviorSubject<boolean>(false);

  isReady$ = this.isReady.asObservable();

  beforeFirstDataRendered = true;

  firstDataRendered = false;

  onRestore = false;

  onInitTableState = false;

  onInitGroupBy = false;

  protected colDefBeenUpdated = false;

  protected defaultSelections: IRowNode<T>[] = [];

  protected selectedNodes: Array<MeRowNode>;

  private _rowClassRules = {
    'row-disabled': (params: RowClassParams<T>) => !params.node.selectable,
    'row-master': (params: RowClassParams<T>) => params.node.master,
  };

  private fullStoryService = inject(FullStoryService);

  protected constructor(
    public tableApiService: MeAgTableApiService<T>,
    protected license: string,
    protected userPreferencesService: MeUserPreferencesService,
    protected cd: ChangeDetectorRef,
  ) {}

  onGridReady(options: GridReadyEvent<T>): void {
    this.gridApi = options.api;
    this.tableApiService.setOptions(options);
    this.tableApiService.setGridApi(options.api);
    this.tableApiService.setMinWidth(this.defaultColDef.minWidth || 0);
    this.tableApiService.initializeOpenedRowGroupsRoutes();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.forEachNodeAfterFilterAndSortCallback &&
      options.api.forEachNodeAfterFilterAndSort((rowNode: IRowNode<T>, index: number) => {
        this.forEachNodeAfterFilterAndSortCallback(rowNode, index);
        if (rowNode.isSelected()) {
          this.defaultSelections.push(rowNode);
        }
      });

    this._setInitialGroupBy();

    this.gridReady.emit(this.tableApiService);
  }

  onActionClicked(event: MeAgTableActionItemEvent<T>): void {
    this.actionClicked.emit(event);
  }

  onFitClicked(): void {
    if (!this.gridApi || !this.firstDataRendered) {
      return;
    }
    this._updateGridWidth();
    this._applyFlexColumnState();
    this.tableApiService.sizeColumnsToFitSafe(this.gridWidth, undefined, true);
    this._deleteResolution();
    this._updateUserPreferences({
      modifiedDisplayedColumns: this.modifiedDisplayedColumns,
      resolutions: this.resolutions,
    });
  }

  onRestoreDefault(): void {
    if (!this.gridApi || !this.firstDataRendered) {
      return;
    }
    this._updateGridWidth();
    this.gridApi.setFilterModel(this._getDefaultFilterModel());
    this.defaultSelections.forEach((n: IRowNode<T>) => n.setSelected(true));
    this.gridApi.resetColumnState();
    const {flexColumns, originalWidths} = this.tableApiService.getFlexWidthsData(this.gridWidth);
    // Restore original widths for flex columns
    flexColumns.forEach((col: Column, index: number) => {
      this.gridApi.setColumnWidths([{key: col, newWidth: originalWidths[index]}]);
    });
    setTimeout(() => {
      this.tableApiService.sizeColumnsToFitSafe(this.gridWidth);
      this.isDefaultColumnState = true;
      this._deleteResolution();
      this._updateUserPreferences({
        modifiedDisplayedColumns: {},
        resolutions: this.resolutions,
      });
      setTimeout(() => (this.onRestore = false), 300);
    }, 0);
    if (this.viewState().groupBy.optionsWithKeys()?.length) {
      this.onGroupByChanged(this.viewState().groupBy.optionsWithKeys()[0]);
    }
    this.restoreDefaultClicked.emit();
    this.onRestore = true;
  }

  onResetFiltersClicked(): void {
    this.gridApi.setFilterModel(this._getDefaultFilterModel());
  }

  onFirstDataRendered(event: FirstDataRenderedEvent<T>): void {
    this.beforeFirstDataRendered = false;
    this._initTableState();
    this.firstDataRendered = true;
    this.firstDataRenderedEvent.emit(event);
  }

  onModelUpdated(_: ModelUpdatedEvent<T>): void {
    this._checkNoRowsOverlay();
  }

  onDragStarted(event: DragStartedEvent<T>): void {
    if (!this.gridApi || !event.target?.classList?.contains('ag-header-cell-resize')) {
      return;
    }
    this.lastColumnState = this.gridApi.getColumnState();
  }

  onDragStopped(event: DragStoppedEvent<T>): void {
    if (!this.gridApi || !event.target?.classList?.contains('ag-header-cell-resize')) {
      return;
    }
    const current = this.gridApi.getColumnState();
    const currentChangedColumnStates = this.tableApiService.getChangedColumnStatesByWidth(
      this.lastColumnState,
      current,
    );
    this._updateResolutions(currentChangedColumnStates, true);
  }

  onSortChanged(event: SortChangedEvent<T>): void {
    const params = this._getParams(event);
    this.filtersParamsChanged.emit(params);
  }

  onFilterChanged(event: FilterChangedEvent<T>): void {
    const params = this._getParams(event);
    this.filtersParamsChanged.emit(params);
    this._emitSelectionChanged(this.selectedNodes);
    const filterModel = event.api.getFilterModel();
    this.chipsFilterData = this._getFiltersAndColDefs(filterModel);
  }

  // triggered by any select / deselect operation
  onRowSelected(event: RowSelectedEvent<T>): void {
    this.rowSelected.emit(event);
  }

  // triggered by user select / deselect operation only
  onSelectionChanged(event: SelectionChangedEvent<T>): void {
    const nodes = event.api.getSelectedNodes() as Array<MeRowNode>;
    this._emitSelectionChanged(nodes);
  }

  onRowClicked(event: RowClickedEvent): void {
    const {expanded, group, master} = event.node;
    if (this.rowModelType !== 'clientSide' && !master && !this.expandOnGroups) {
      return;
    }

    if (this.rowModelType === 'clientSide' && !master && !group) {
      return;
    }

    if (this.expandOnGroups && !group) {
      return;
    }
    const detailNodeKey = 'detailNode';

    // traverse on all master nodes
    event.api.forEachNode((n: IRowNode<T>) => {
      if (n[detailNodeKey] && n.expanded && n.rowIndex !== event.node.rowIndex) {
        n.setExpanded(false);
      }
    });

    event.node.setExpanded(!expanded);
  }

  onRowGroupOpened(event: RowGroupOpenedEvent<T>): void {
    const detailNodeKey = 'detailNode';

    if (!event.node.master) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      event.node.expanded
        ? this.tableApiService.addRoute(event.node)
        : this.tableApiService.removeRoute(event.node);
    }

    if (!event.node[detailNodeKey] || !event.expanded) {
      return;
    }

    const onOpenKey = 'onOpen';
    if (event.node[onOpenKey]) {
      event.node[onOpenKey](event.data);
    }
  }

  onToolPanelVisibleChanged(_: ToolPanelVisibleChangedEvent<T>): void {
    if (this.gridApi.isToolPanelShowing()) {
      setTimeout(() => {
        const filterInputs = document.querySelectorAll<HTMLInputElement>(
          'input[aria-label="Filter Columns Input"]',
        );
        const columnInput = filterInputs[0];
        const filterInput = filterInputs[1];
        if (columnInput) {
          columnInput.placeholder = 'Search column name';
        }
        if (filterInput) {
          filterInput.placeholder = 'Search filter name';
        }
      }, 0);
    }
    this.cd.detectChanges();
  }

  onColumnVisible(event: ColumnVisibleEvent<T>): void {
    if (
      this.onRestore ||
      this.onInitTableState ||
      this.onInitGroupBy ||
      this.beforeFirstDataRendered
    ) {
      return;
    }
    this.onModifiedColumns(event.columns, MeModifiedEventType.Column_VISIBLE);
  }

  onColumnPinned(event: ColumnPinnedEvent<T>): void {
    if (
      this.onRestore ||
      this.onInitTableState ||
      this.onInitGroupBy ||
      this.beforeFirstDataRendered
    ) {
      return;
    }
    this.onModifiedColumns(event.columns, MeModifiedEventType.Column_PINNED);
  }

  onColumnMoved(event: ColumnMovedEvent<T>): void {
    if (
      this.onRestore ||
      this.onInitTableState ||
      this.onInitGroupBy ||
      this.beforeFirstDataRendered
    ) {
      return;
    }
    this.onModifiedColumns(event.columns, MeModifiedEventType.Column_MOVED);
  }

  onDisplayedColumnsChanged(event: DisplayedColumnsChangedEvent): void {
    if (!this.firstDataRendered) {
      return;
    }
    this.displayedColumnsChangedEvent.emit(event);
  }

  onFilterChipRemoved(colId: string): void {
    this.tableApiService.setFilterModel({}, [colId]);
  }

  onNoRows(): void {
    this.beforeFirstDataRendered = false;
    if (this.firstDataRendered) {
      return;
    }

    if (this.rowModelType === 'clientSide' && !this.colDefBeenUpdated) {
      return;
    }
    this._initTableState();
    this.firstDataRendered = true;
  }

  onGroupByChanged(item: MeGroupByItemDerived): void {
    // grid is not ready yet or the first group change came after the grid was ready
    if (!this.gridApi || !this.viewState().groupBy.initial()) {
      this.viewState().groupBy.initial.set(item);
      if (!this.gridApi) {
        return;
      }
    }
    if (!this._findGroupByOption(item.key)) {
      return;
    }
    const savedGroupByColumnState = this._removeOldGroupByColumns();

    const colIds = item.groups.map((item) => item.colId);

    this.gridApi.addRowGroupColumns(colIds);

    this.viewState().groupBy.current.set(item);

    this._applyColumnStateWithOriginalVisibility(savedGroupByColumnState);

    const params = this._getParams(null);

    this.filtersParamsChanged.emit(params);

    const filterModel = this.gridApi.getFilterModel();

    this.gridApi.setFilterModel(filterModel);

    this._emitSelectionChanged([]);

    this.groupByChanged.emit(item);
  }

  onModifiedColumns(columns: Array<Column>, eventType: MeModifiedEventType): void {
    const current = this.gridApi.getColumnState();
    this.modifiedDisplayedColumns = this.tableApiService.getUpdatedModifiedDisplayedColumns(
      current,
      this.defaultColumnState,
      this.modifiedDisplayedColumns || {},
      columns,
      eventType,
    );

    this._updateUserPreferences({
      modifiedDisplayedColumns: this.modifiedDisplayedColumns,
      resolutions: this.resolutions,
    });
  }

  triggerCd(): void {
    this.cd.detectChanges();
  }

  abstract ngOnInit(): void;

  abstract onRefreshButtonClicked(): void;

  protected async setLicense(): Promise<boolean> {
    if (!BaseTableDirective.licenseActivated) {
      const {LicenseManager} = await import('@ag-grid-enterprise/core');
      LicenseManager.setLicenseKey(this.license);
      BaseTableDirective.licenseActivated = true;
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  protected registerComponents(componentEntries: Array<[string, Component]>): void {
    componentEntries.forEach(([name, component]: [string, Component]) => {
      this.components[name] = component;
    });
  }

  protected overrideSelectionOptions() {
    return {};
  }

  protected getSelectionOptions() {
    const mode = (this.rowSelection || 'single') === 'multiple' ? 'multiRow' : 'singleRow';
    if (mode === 'multiRow') {
      // assert type checking
      const options: MultiRowSelectionOptions = {
        mode: 'multiRow',
        headerCheckbox: false,
        enableSelectionWithoutKeys: true,
        groupSelects: this.groupSelects(),
        enableClickSelection: !this.suppressRowClickSelection,
        isRowSelectable: this.isRowSelectable,
        checkboxes: this.checkboxes(),
        hideDisabledCheckboxes: this.hideDisabledCheckboxes(),
      };
      return {...options, ...this.overrideSelectionOptions()};
    } else {
      // assert type checking
      const options: SingleRowSelectionOptions = {
        mode: 'singleRow',
        enableClickSelection: !this.suppressRowClickSelection,
        isRowSelectable: this.isRowSelectable,
        checkboxes: this.checkboxes(),
        hideDisabledCheckboxes: this.hideDisabledCheckboxes(),
      };
      return {...options, ...this.overrideSelectionOptions()};
    }
  }

  @HostListener('window:resize', ['$event'])
  @debounce(100)
  private _onResize(): void {
    this._updateGridWidth();
    const resolution: Record<string, number> = this.tableApiService.getResolution(
      this.gridWidth,
      this.resolutions || {},
    );
    this.tableApiService.sizeColumnsToFitSafe(this.gridWidth, resolution);
    const current = this.gridApi.getColumnState();
    if (!resolution) {
      this._updateResolutions(current);
    }
  }

  private _setInitialGroupBy(): void {
    // no sub group options or there's no response yet from user pref
    if (
      !this.viewState().groupBy.optionsWithKeys()?.length ||
      !this.viewState().groupBy.initial()
    ) {
      return;
    }
    const savedGroupByColumnState = this._removeOldGroupByColumns();

    if (this.initialGroupByParam) {
      const option = this._findGroupByOption(this.initialGroupByParam);
      if (option) {
        this.gridApi.addRowGroupColumns(this.initialGroupByParam.split('-'));
        this.viewState().groupBy.current.set(option);
        this.groupByChanged.emit(option);
      } else if (this.viewState().groupBy.initial()) {
        this._setToInitialGroupBy();
      }
    } else if (this.viewState().groupBy.initial()) {
      this._setToInitialGroupBy();
    }

    this._applyColumnStateWithOriginalVisibility(savedGroupByColumnState, true);

    const params = this._getParams(null);
    this.filtersParamsChanged.emit(params);
  }

  private _setToInitialGroupBy(): void {
    const colIds = this.viewState()
      .groupBy.initial()
      .groups.map((item) => item.colId);
    this.gridApi.addRowGroupColumns(colIds);
    const groupByValue = this.viewState().groupBy.initial();
    this.viewState().groupBy.current.set(groupByValue);
    this.groupByChanged.emit(groupByValue);
  }

  private _findGroupByOption(id: string): MeGroupByItemDerived {
    return this.viewState()
      .groupBy.optionsWithKeys()
      .find((item) => item.key === id);
  }

  private _getGroupByIds(initialColId: MeGroupByItemDerived): Array<string> {
    const groupByColIds = this.viewState().groupBy.allKeys();
    const groupByFields = (initialColId?.groups || []).map((item) => item.field);
    return [...groupByColIds, ...groupByFields];
  }

  private _getParams(event?: SortChangedEvent<T> | FilterChangedEvent<T>): Params {
    const state = event?.api.getColumnState() || this.gridApi?.getColumnState() || [];
    const model = this.gridApi?.getFilterModel() || {};
    return {
      ...this._getParamsFromColumnsState(state),
      ...this._getParamsFromFilterModel(model),
      ...(this.viewState().groupBy.current() && {groupBy: this.viewState().groupBy.current().key}),
    };
  }

  private _getParamsFromColumnsState(columnsState: Array<ColumnState>): Params {
    if (!columnsState?.length) {
      return {};
    }
    const colState = columnsState.find((col: ColumnState) => col.sort);
    if (!colState) {
      return {};
    }
    const {colId, sort} = colState;
    return {sortBy: colId, sortDirection: sort};
  }

  private _getParamsFromFilterModel(filterModelRecords: Record<string, any>): Params {
    const params = {};
    if (!filterModelRecords || !Object.keys(filterModelRecords).length) {
      return params;
    }

    for (const [k, filterModel] of Object.entries(filterModelRecords)) {
      if (filterModel.filterType === 'date' && filterModel.type === 'inRange') {
        if (filterModel.dateFrom) {
          params[filterModel.dateFromParameterName] = filterModel.dateFrom;
        }
        if (filterModel.dateTo) {
          params[filterModel.dateToParameterName] = filterModel.dateTo;
        }
      } else if (filterModel.operator) {
        params[k] = [filterModel.condition1.filter, filterModel.condition2.filter];
      } else if (filterModel.type === 'multi' || filterModel.type === 'multiContains') {
        if (Array.isArray(filterModel.filter)) {
          params[k] = filterModel.filter;
        } else {
          params[k] = [];
          const values = filterModel.filter.split(',');
          values.forEach((v: string) => (params[k] as Array<string>).push(v));
        }
      } else {
        params[k] = filterModel.filter;
      }
    }
    return params;
  }

  private _emitSelectionChanged(nodes?: Array<MeRowNode>): void {
    if (!nodes) {
      return;
    }

    if (this.rowSelection === 'multiple' && this.rowModelType === 'serverSide') {
      return;
    }

    this.selectedNodes = nodes;
    const selectedNodes = this.clearSelectedRowsFilteredOut
      ? nodes.filter((n: MeRowNode) => n.displayed)
      : nodes;
    this.numberOfSelectedNodes.next(selectedNodes.length);
    this.selectionChanged.emit(selectedNodes);
  }

  private _checkNoRowsOverlay(): void {
    // when the first check happened the table is not rendered yet
    if (this.gridApi?.getDisplayedRowCount() === 0) {
      this.gridApi?.showNoRowsOverlay();
      this.tableApiService.isLoading.next(false);
    } else {
      this.tableApiService?.hideOverlay();
      this.gridApi?.hideOverlay();
    }
  }

  private _getDefaultFilterModel(): Record<string, any> {
    const prevModel = this.gridApi.getFilterModel();
    const newFilterModel = {};
    for (const k of this.externalFiltersKeys) {
      if (!prevModel[k]) {
        continue;
      }
      const filterVal = this._getFilterValue(prevModel[k]);
      if (this._isFilterValueIsNotDefault(filterVal)) {
        newFilterModel[k] = prevModel[k];
      }
    }
    return newFilterModel;
  }

  private _isFilterValueIsNotDefault(filterVal: any): boolean {
    return Array.isArray(filterVal) ? filterVal && filterVal.length !== 0 : filterVal != null;
  }

  private _getFilterValue(filterModel: Record<string, any>): any {
    return filterModel.filter || filterModel.filterTo || filterModel.dateFrom || filterModel.dateTo;
  }

  private _getFiltersAndColDefs(filterModels: Record<string, any>): Array<MeFilterModelAndColDef> {
    const filterModelsAndColDefs = [];
    for (const modelKey in filterModels) {
      if (
        filterModels.hasOwnProperty(modelKey) &&
        !this.ignoredFiltersKeys.includes(modelKey) &&
        !this.externalFiltersKeys.includes(modelKey)
      ) {
        const filterVal = this._getFilterValue(filterModels[modelKey]);
        if (this._isFilterValueIsNotDefault(filterVal)) {
          const colDef = this.gridApi.getColumnDef(modelKey);
          filterModelsAndColDefs.push({
            filterModel: filterModels[modelKey],
            colDef,
          });
        }
      }
    }
    return filterModelsAndColDefs;
  }

  private _applyFlexColumnState(): void {
    const current = [...this.gridApi.getColumnState()];
    const newCurrent = [];
    for (const state of current) {
      const colDef = this.columnDefs.find(
        (col) => col.colId === state.colId || col.field === state.colId,
      );
      if (colDef?.flex) {
        newCurrent.push({
          ...state,
          flex: colDef.flex,
        });
      } else {
        newCurrent.push({
          ...state,
        });
      }
    }
    this.gridApi.applyColumnState({
      state: newCurrent,
      applyOrder: true,
    });
  }

  private _deleteResolution(): void {
    this._updateGridWidth();
    const selectedResolutionKey = this.tableApiService.getResolutionKey(
      this.gridWidth,
      this.resolutions,
    );
    if (selectedResolutionKey) {
      delete this.resolutions?.[selectedResolutionKey];
    }
  }

  private _setTableStateData(state: MeTableState): void {
    const current = this.gridApi.getColumnState();
    this.modifiedDisplayedColumns =
      this.tableApiService.clearUnavailableColIdsFromModifiedDisplayedColumns(
        current,
        state.modifiedDisplayedColumns,
      );
    this.resolutions = this.tableApiService.clearUnavailableColIdsFromResolutions(
      current,
      state.resolutions,
    );
    const allGroupKeys = this.viewState().groupBy.allKeys();
    const currentChangedColumnStatesColIds = this.currentChangedColumnStates.map(
      (modified) => modified.colId,
    );
    const keysToIgnore = union(allGroupKeys, currentChangedColumnStatesColIds);
    const isDefaultByCurrentChangedColumnStates =
      this._isDefaultColumnStateByCurrentChangedColumnStates(current);
    this.isDefaultColumnState = this._getIsDefaultColumnState(
      isDefaultByCurrentChangedColumnStates,
      keysToIgnore,
    );
  }

  private _getIsDefaultColumnState(
    isDefaultByCurrentChangedColumnStates: boolean,
    keysToIgnore: Array<string>,
  ): boolean {
    return isDefaultByCurrentChangedColumnStates
      ? !Object.keys(this.modifiedDisplayedColumns).length ||
          Object.keys(this.modifiedDisplayedColumns).every(
            (key: string) => this.ignoredModifiedColIds.has(key) || keysToIgnore.includes(key),
          )
      : false;
  }

  private _isDefaultColumnStateByCurrentChangedColumnStates(current: Array<ColumnState>): boolean {
    if (this.currentChangedColumnStates.length) {
      for (const modified of this.currentChangedColumnStates) {
        if (modified.colId !== current[modified.index]?.colId) {
          return false;
        }
        if (
          !modified.visible !== current[modified.index]?.hide ||
          modified.pinned !== (current[modified.index]?.pinned as Pick<ColumnState, 'pinned'>)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private _updateUserPreferences(state: MeTableState): void {
    const newKey = `tableState${this.NEW_USER_PREFERENCE_SUFFIX}`;
    const componentState = {
      ...(this.userPreferencesService.getComponentState(this.componentId) || {}),
    };
    componentState[newKey] = state;
    this._setTableStateData(state);
    this._reportModifiedColumnsChanges();
    this.userPreferencesService.setComponentState(this.componentId, componentState);
  }

  private _reportModifiedColumnsChanges(): void {
    if (this.prevModifiedDisplayedColumns) {
      const modifiedColsChangesObj: MeModifiedColsChanges =
        this.tableApiService.compareModifiedDisplayedColumns(
          this.componentId,
          this.modifiedDisplayedColumns,
          this.prevModifiedDisplayedColumns,
        );
      if (modifiedColsChangesObj.added.length || modifiedColsChangesObj.removed.length) {
        this.fullStoryService.trackEvent({
          name: 'UI - Table Columns Modified',
          properties: modifiedColsChangesObj,
          schema: {
            tableId: 'str',
            added: 'strs',
            removed: 'strs',
          },
        });
      }
    }
    this.prevModifiedDisplayedColumns = this.modifiedDisplayedColumns;
  }

  private _deleteOldStateAndInitNewState(initialState: any): void {
    const key = `tableState${this.USER_PREFERENCE_SUFFIX}`; // todo: remove after migration
    const newKey = `tableState${this.NEW_USER_PREFERENCE_SUFFIX}`;
    const componentState = {
      ...(this.userPreferencesService.getComponentState(this.componentId) || {}),
    };
    delete componentState[key]; // todo: remove after migration
    componentState[newKey] = initialState;
    this._setTableStateData(initialState);
    this.userPreferencesService.setComponentState(this.componentId, componentState);
  }

  private _getColumnStateByModifiedDisplayedColumns(
    current: Array<ColumnState>,
    modifiedDisplayedColumns: Record<string, MeModifiedColumnState>,
    ignoredModifiedColIds: Set<string>,
  ): Array<ColumnState> {
    const modifiedColumnState: Array<ColumnState> =
      this.tableApiService.getColumnStateByModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
        ignoredModifiedColIds,
      );
    const deepClonedColumnState = modifiedColumnState.filter((col: ColumnState) => col);
    if (deepClonedColumnState.length !== modifiedColumnState.length) {
      this.fullStoryService.trackEvent({
        name: 'UI - Failure in generate columns of a table',
        properties: {
          tableId: this.componentId,
        },
      });
      console.error(
        '[getColumnStateByModifiedDisplayedColumns] Some columns are not found. Col ids:',
        modifiedColumnState.map((col) => col?.colId).join(','),
      );
    }
    return deepClonedColumnState;
  }

  private _initTableState(): void {
    const current = this.gridApi.getColumnState();
    this.defaultColumnState = current;
    const initialColId: MeGroupByItemDerived =
      this._findGroupByOption(this.initialGroupByParam) || this.viewState().groupBy.initial();
    const groupByIds = this._getGroupByIds(initialColId);
    const mergedState = this._mergeOldTableState(current);
    if (mergedState) {
      // todo: remove after migration
      // last loading of the table with an old state
      this.fullStoryService.trackEvent({
        name: 'UI - Table Old State Retrieved',
        properties: {},
      });
      this._applyMergedState(mergedState, current, initialColId, groupByIds);
      return;
    }
    // no old state
    this._applyInitialState(current, initialColId, groupByIds);
  }

  private _applyMergedState(
    mergedState: MeTableState,
    current: Array<ColumnState>,
    initialColId: MeGroupByItemDerived,
    groupByIds: Array<string>,
  ): void {
    const deepClonedColumnState: Array<ColumnState> =
      this._getColumnStateByModifiedDisplayedColumns(
        current,
        mergedState.modifiedDisplayedColumns,
        this.ignoredModifiedColIds,
      );
    this._deleteOldStateAndInitNewState(mergedState); // update the merged state with null values on hidden cols
    this.tableApiService.updateColumnStateGroupByColumns(
      deepClonedColumnState,
      initialColId,
      groupByIds,
    );
    this.gridApi.applyColumnState({
      state: deepClonedColumnState,
      applyOrder: true,
    });
    this._updateGridWidth();
    this.tableApiService.sizeColumnsToFitSafe(this.gridWidth);
    this._updateUserPreferences(mergedState);
  }

  private _applyInitialState(
    current: Array<ColumnState>,
    initialColId: MeGroupByItemDerived,
    groupByIds: Array<string>,
  ): void {
    this.onInitTableState = true;
    const state = this._getTableComponentState();
    const modifiedColumnState: Array<ColumnState> = this._getColumnStateByModifiedDisplayedColumns(
      current,
      state.modifiedDisplayedColumns,
      this.ignoredModifiedColIds,
    );
    this.tableApiService.updateColumnStateGroupByColumns(
      modifiedColumnState,
      initialColId,
      groupByIds,
    );
    this._updateGridWidth();
    const resolution: Record<string, number> = this.tableApiService.getResolution(
      this.gridWidth,
      state.resolutions,
    );
    this._applyColumnState(modifiedColumnState, resolution);
    this._setTableStateData(state);
    setTimeout(() => (this.onInitTableState = false), 300);
  }

  private _applyColumnState(
    modifiedColumnState: Array<ColumnState>,
    resolution: Record<string, number>,
  ): void {
    this.gridApi.applyColumnState({
      state: modifiedColumnState,
      applyOrder: true,
    });
    this.tableApiService.sizeColumnsToFitSafe(
      this.gridWidth,
      Object.keys(resolution || {}).length ? resolution : undefined,
    );
  }

  private _getCachedTableState(): any {
    const newKey = `tableState${this.NEW_USER_PREFERENCE_SUFFIX}`;
    const componentState = this.userPreferencesService.getComponentState(this.componentId) || {};
    return componentState[newKey];
  }

  private _getTableComponentState(): MeTableState {
    const cachedState = this._getCachedTableState();
    return {
      modifiedDisplayedColumns:
        this.modifiedDisplayedColumns || cachedState?.modifiedDisplayedColumns || {},
      resolutions: this.resolutions || cachedState?.resolutions || {},
    };
  }

  private _mergeOldTableState(current: Array<ColumnState>): MeTableState {
    // todo: remove after migration
    const componentState = this.userPreferencesService.getComponentState(this.componentId) || {};
    const key = `tableState${this.USER_PREFERENCE_SUFFIX}`;
    const oldCachedState = componentState?.[key];
    if (!oldCachedState?.columnState) {
      return null;
    }

    const cachedColumns = oldCachedState?.columnState;
    const modifiedDisplayedColumns = this.tableApiService.getActiveModifiedDisplayedColumns(
      cachedColumns,
      current,
    );
    const resolutions = {};
    return {
      modifiedDisplayedColumns,
      resolutions,
    };
  }

  private _updateResolutions(current: Array<ColumnState>, preserveOldResolution?: boolean): void {
    if (!globalThis.jasmine && this.firstDataRendered) {
      this._updateGridWidth();
      const [resolutions, isChanged] = this.tableApiService.getTableResolutionData(
        current,
        this.resolutions,
        this.gridWidth,
        preserveOldResolution,
      );
      this.isColumnWidthChanged = isChanged;
      if (this.isColumnWidthChanged) {
        this._updateUserPreferences({
          modifiedDisplayedColumns: this.modifiedDisplayedColumns,
          resolutions: resolutions,
        });
      }
    }
  }

  private _applyColumnStateWithOriginalVisibility(
    savedGroupByColumnState: Array<ColumnState>,
    onInit?: boolean,
  ) {
    const current = this.gridApi.getColumnState();
    const currentColumnStateIds = current.map((item: ColumnState) => item.colId);
    const groupByColumnState = savedGroupByColumnState.filter((col: ColumnState) => {
      const i = currentColumnStateIds.findIndex((c) => c === col.colId);
      return i > -1 && current[i].hide !== col.hide;
    });
    const currentKey = this.viewState().groupBy.current()?.key;
    let showColIds: Set<string>, hideColIds: Set<string>;
    const groupByAdditionalColumns = this.groupByAdditionalColumns();
    if (currentKey && groupByAdditionalColumns?.[currentKey]) {
      showColIds = new Set(groupByAdditionalColumns[currentKey]);
      hideColIds = new Set([...this.currentAdditionalColumns]);
      this.currentAdditionalColumns = [];
      this.currentChangedColumnStates = [];
    }
    if (groupByColumnState.length || showColIds?.size || hideColIds?.size) {
      if (onInit) {
        this.onInitGroupBy = true;
        setTimeout(() => (this.onInitGroupBy = false), 300);
      }
      const newCurrent: Array<ColumnState> = [];
      let i = -1;
      for (const colState of current) {
        i++;
        if (showColIds) {
          const hasShowState = showColIds.has(colState.colId);
          if (hasShowState) {
            const updatedColState = {
              ...colState,
              hide: false,
            };
            this.currentChangedColumnStates.push({
              pinned: updatedColState.pinned as Pick<ColumnState, 'pinned'>,
              visible: true,
              index: i,
              colId: updatedColState.colId,
            });
            newCurrent.push(updatedColState);
            this.currentAdditionalColumns.push(updatedColState.colId);
            continue;
          }
        }
        if (hideColIds) {
          const hasHideState = hideColIds.has(colState.colId);
          if (hasHideState) {
            const updatedColState = {
              ...colState,
              hide: true,
            };
            this.currentChangedColumnStates.push({
              pinned: updatedColState.pinned as Pick<ColumnState, 'pinned'>,
              visible: false,
              index: i,
              colId: updatedColState.colId,
            });
            newCurrent.push(updatedColState);
            this.currentAdditionalColumns.push(updatedColState.colId);
            continue;
          }
        }
        const groupByState = groupByColumnState.find(
          (col: ColumnState) => col.colId === colState.colId,
        );
        if (groupByState) {
          newCurrent.push({
            ...colState,
            hide: groupByState.hide,
          });
        } else {
          newCurrent.push({...colState});
        }
      }
      this.gridApi.applyColumnState({
        state: newCurrent,
        applyOrder: true,
      });
    }
  }

  private _updateGridWidth(): void {
    if (!this.grid()?.nativeElement) {
      this.gridWidth = 0;
      return;
    }
    const agBodyViewport = this.grid().nativeElement.querySelector('.ag-body-viewport');
    const hasCheckbox = !!this.checkboxes();
    const agToolPanel = this.grid().nativeElement.querySelector('.ag-tool-panel-wrapper');
    const agToolPanelWidth = agToolPanel ? agToolPanel.clientWidth : 0;
    if (hasCheckbox) {
      if (this.gridWidth) {
        this.gridWidth = agBodyViewport.clientWidth - 52;
      } else {
        this.gridWidth = agBodyViewport.clientWidth > 68 ? agBodyViewport.clientWidth - 68 : 0;
      }
    } else {
      if (this.gridWidth) {
        this.gridWidth = agBodyViewport.clientWidth;
      } else {
        this.gridWidth = agBodyViewport.clientWidth > 16 ? agBodyViewport.clientWidth - 16 : 0;
      }
    } // the width of ag-body-vertical-scroll is 16px (in the calculation time it could be 0)
    this.gridWidth += agToolPanelWidth;
  }

  private _removeOldGroupByColumns(): Array<ColumnState> {
    const currentGroupBy = this.gridApi.getRowGroupColumns();
    const removedColIds = currentGroupBy.map((item: Column<T>) => item.getColId());
    const current = this.gridApi.getColumnState();
    const removedCurrent = current.filter((item) => removedColIds.includes(item.colId));
    this.gridApi.removeRowGroupColumns(removedColIds); // it alters the visibility of the removed columns
    return removedCurrent;
  }

  private _onGridPreDestroyed(_: GridPreDestroyedEvent<T>): void {
    this.gridApi = null;
    this.tableApiService.setGridApi(null);
  }
}
