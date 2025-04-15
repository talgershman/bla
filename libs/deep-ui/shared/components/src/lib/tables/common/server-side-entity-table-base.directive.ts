import {
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  IsRowSelectable,
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
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {Params, Router} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeColumnsOptions,
  MeRowNode,
  TeamFilterStateTypes,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideDataSourceDirective} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {
  getTableFiltersActiveState,
  MeAgTableApiService,
  setMaxNumConditions,
} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DeepUtilService} from 'deep-ui/shared/core';
import _isEqual from 'lodash-es/isEqual';
import _isNil from 'lodash-es/isNil';
import {OnChange} from 'property-watch-decorator';
import {Subject} from 'rxjs';
import {delay, tap} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export abstract class ServerSideEntityTableBaseDirective<T> implements OnInit, AfterViewInit {
  @ViewChild('nameCell', {static: true})
  nameCell: TemplateRef<any>;

  @ViewChild('statusCell', {static: true})
  statusCell: TemplateRef<any>;

  @Input()
  hideTableActions: boolean;

  @OnChange<void>('_onQueryParamsChanged')
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

  gridApi: GridApi<T>;

  agGridDataSource: MeServerSideDataSourceDirective;

  readonly clearSelectedRowsFilteredOut = true;
  readonly enableSideBar: string | boolean = true;
  readonly rowSelection = 'single';
  readonly rowHeight = 52;

  abstract setDatasource: () => void;
  abstract getTableColumnsDef: (options: MeColumnsOptions) => MeColDef<T>[];
  abstract idProperty: string;
  abstract teamProperty: 'group' | 'team';
  abstract columnBeforeAction: string;
  abstract ignoredFiltersKeys;
  abstract ignoreTeamFilterAttributes: Array<string>;

  protected createdByUsernameProperty: string;
  protected selected: Array<T>;
  protected activeParams: Params;
  protected getTableFiltersActiveState = () =>
    getTableFiltersActiveState(this.columns, this.activeParams);
  protected router = inject(Router);
  protected prevEntity: T = this.router.getCurrentNavigation()?.extras.state
    ? this.router.getCurrentNavigation()?.extras.state.selected
    : {};
  protected prevEntityIsSelected = false;
  protected tableOptions: MeColumnsOptions;

  private tableApiService: MeAgTableApiService<T>;
  private readonly REFRESH_INTERVAL = 60000;
  private prevQueryParams: Params;

  private ngZone = inject(NgZone);
  protected deepUtilService = inject(DeepUtilService);
  protected timerService = inject(MeTimerService);
  protected userPreferencesService = inject(MeUserPreferencesService);
  protected snackbar = inject(MeSnackbarService);
  protected cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this._setExternalFilterKeys();
    this.setDatasource();
    this.setTableOptions();
    this._setTeamFilterState();
    this._setTableColumns();
    this._setActiveParams();
    this._triggerRefresh();
    this.registerEvents();
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
    this.setFilterModelForTeamFilterState();
    this.tableApiService.setServerSideDatasource(this.agGridDataSource);
    this._startPollingData();
    this.gridReady.emit(tableApiService);
  }

  onTeamFilterClicked(state: TeamFilterStateTypes): void {
    this.teamFilterState = state;
    this.setFilterModelForTeamFilterState();
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
    this.setFilterModelForTeamFilterState();
    if (!_isEqual(params, this.prevQueryParams)) {
      this.filtersParamsChanged.emit(params);
    }
    this.prevQueryParams = params;
  }

  async onActionClicked(action: MeAgTableActionItemEvent<T>): Promise<void> {
    this.tableActionClicked.emit(action);
  }

  async onActionClickedRunInZone(action: MeAgTableActionItemEvent<T>): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  protected refreshData(params?: RefreshServerSideParams): void {
    this.tableApiService.refreshServerSideData(params);
  }

  protected registerEvents(): void {
    this.agGridDataSource.dataLoadedLevel$
      .pipe(delay(350), untilDestroyed(this))
      .subscribe((_) => this.selectPreSelectedRow());
  }

  protected setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
        statusCell: this.statusCell,
      },
      showActions: !this.hideTableActions,
    };
  }

  protected selectPreSelectedRow(): void {
    if (_isNil(this.prevEntity[this.idProperty]) || this.prevEntityIsSelected) {
      return;
    }
    const rowNode = this.gridApi.getRowNode(`${this.prevEntity[this.idProperty]}`);

    if (!rowNode || !rowNode.displayed) {
      return;
    }

    if (rowNode.selectable && !rowNode.isSelected()) {
      rowNode.setSelected(true);
      this.prevEntityIsSelected = true;
    }
  }

  protected getCreatedByUsernameProperty(): string {
    return this.createdByUsernameProperty || 'createdByUsername';
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
      .subscribe(() => this.refreshData());
  }

  private _setExternalFilterKeys(): void {
    this.externalFiltersKeys = [this.teamProperty, this.getCreatedByUsernameProperty()];
  }

  private _setTeamFilterState() {
    this.teamFilterState =
      this.userPreferencesService.getComponentState(this.tableComponentId)?.teamFilterState ||
      this.deepUtilService.getTeamFilterInitState();
  }

  private _setTableColumns() {
    const columns = this.getTableColumnsDef(this.tableOptions);
    setMaxNumConditions(columns);
    this.columns = columns;
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

  private setFilterModelForTeamFilterState(): void {
    if (this._shouldIgnoreTeamFilter()) {
      this.tableApiService?.setFilterModel({}, [
        this.getCreatedByUsernameProperty(),
        this.teamProperty,
      ]);
      return;
    }

    switch (this.teamFilterState) {
      case 'me': {
        this.tableApiService?.setFilterModel(
          {
            [this.getCreatedByUsernameProperty()]: {
              filterType: 'text',
              type: 'equals',
              filter: this.deepUtilService.getCurrentUser().userName,
            },
          },
          [this.teamProperty],
        );
        break;
      }
      case 'my_teams': {
        this.tableApiService?.setFilterModel(
          {
            [this.teamProperty]: {
              filterType: 'text',
              type: 'multi',
              filter: this.deepUtilService.getDeepTeamsWithoutExtra(),
            },
          },
          [this.getCreatedByUsernameProperty()],
        );
        break;
      }
      case 'none': {
        this.tableApiService?.setFilterModel({}, [
          this.getCreatedByUsernameProperty(),
          this.teamProperty,
        ]);
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.teamFilterState;
        throw new Error(`Unhandled _getFilterEntitiesByFilterState case: ${exhaustiveCheck}`);
      }
    }
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

  private _onQueryParamsChanged(): void {
    if (this.gridApi) {
      this._setActiveParams();
      const filterModel = this.getTableFiltersActiveState();
      this.tableApiService.setFilterModel(filterModel);
    }
  }
}
