import {
  CheckboxSelectionCallback,
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  IServerSideSelectionState,
  IsRowSelectable,
  RefreshServerSideParams,
  RowNode,
} from '@ag-grid-community/core';
import {
  ChangeDetectorRef,
  Directive,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import {Params} from '@angular/router';
import {
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
import copy from 'copy-to-clipboard';
import {USER_PREF_RE_TRIGGER_PREFIX} from 'deep-ui/shared/components/src/lib/common';
import {DeepUtilService} from 'deep-ui/shared/core';
import _isNil from 'lodash-es/isNil';
import {delay, tap} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export abstract class SelectServerSideTableBaseDirective<T> implements OnInit {
  @ViewChild('nameCell', {static: true})
  nameCell: TemplateRef<any>;

  @Input()
  tableComponentId: string;

  @Input()
  rowSelection = 'single';

  @Input()
  initialTableFilters: Params;

  @Input()
  initialSelectionId: string | number;

  @Input()
  isReTriggerFlow: boolean;

  @Output()
  selectionChanged = new EventEmitter<Array<T>>();

  selectTableComponentId: string;

  columns: MeColDef<T>[];

  teamFilterState: TeamFilterStateTypes;

  externalFiltersKeys: Array<string>;

  gridApi: GridApi<T>;

  agGridDataSource: MeServerSideDataSourceDirective;

  abstract setDatasource: () => void;
  abstract getTableColumnsDef: (options: MeColumnsOptions) => MeColDef<T>[];
  abstract idProperty: string;
  abstract teamProperty: 'group' | 'team';
  abstract ignoredFiltersKeys;
  abstract reTriggerUniqFilterAttr: string;

  checkboxes: WritableSignal<boolean | CheckboxSelectionCallback> = signal(false);
  hideDisabledCheckboxes: WritableSignal<boolean> = signal(false);

  readonly hideTableActions: boolean = true;
  readonly clearSelectedRowsFilteredOut = false;
  readonly enableSideBar: string | boolean = true;
  readonly rowHeight = 52;
  readonly checkboxProperty: string = 'name';
  readonly pollingDataEnabled: boolean = true;
  abstract ignoreTeamFilterAttributes: Array<string>;

  protected tableOptions: MeColumnsOptions;
  protected preSelected = false;
  protected getTableFiltersActiveState = () =>
    getTableFiltersActiveState(this.columns, this.initialTableFilters);

  private tableApiService: MeAgTableApiService<T>;
  private readonly REFRESH_INTERVAL = 60000;

  protected deepUtilService = inject(DeepUtilService);
  protected timerService = inject(MeTimerService);
  protected userPreferencesService = inject(MeUserPreferencesService);
  protected snackbar = inject(MeSnackbarService);
  protected cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this._setSelectTableComponentId();
    this._setExternalFilterKeys();
    this.setDatasource();
    this.setTableOptions();
    this._setTeamFilterState();
    this.setTableColumns();
    this.registerEvents();
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
  }

  onTeamFilterClicked(state: TeamFilterStateTypes): void {
    this.teamFilterState = state;
    this.setFilterModelForTeamFilterState();
  }

  onSelectionChanged(nodes: Array<MeRowNode<T>>): void {
    if (!nodes.length) {
      this.selectionChanged.emit([]);
      return;
    }
    this.selectionChanged.emit(nodes.map((n: MeRowNode<T>) => n.data));
  }

  onServerSideSelectionStateChanged(_: IServerSideSelectionState): void {
    const rowNodes = this.gridApi.getSelectedNodes() || [];
    if (!rowNodes?.length) {
      this.selectionChanged.emit([]);
    } else {
      this.selectionChanged.emit(rowNodes.map((row: RowNode<T>) => row.data));
    }
  }

  copyJobIdToClipboard(event: MouseEvent, id: string): void {
    event.stopPropagation();
    copy(id);
    this.snackbar.onCopyToClipboard();
  }

  protected setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
      },
      showActions: !this.hideTableActions,
      extra: {
        reTriggerFlow: this.isReTriggerFlow,
      },
    };
  }

  protected registerEvents(): void {
    this.agGridDataSource.dataLoadedLevel$
      .pipe(delay(350), untilDestroyed(this))
      .subscribe((_) => this.selectPreSelectedRow());
  }

  setFilterModelForTeamFilterState(): void {
    if (this._shouldIgnoreTeamFilter()) {
      this.tableApiService?.setFilterModel({}, ['createdByUsername', this.teamProperty]);
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
          [this.teamProperty],
        );
        break;
      }
      case 'my_teams': {
        this.tableApiService.setFilterModel(
          {
            [this.teamProperty]: {
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
        this.tableApiService.setFilterModel({}, ['createdByUsername', this.teamProperty]);
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.teamFilterState;
        throw new Error(`Unhandled _getFilterEntitiesByFilterState case: ${exhaustiveCheck}`);
      }
    }
  }

  protected setTableColumns(): void {
    const columns = this.getTableColumnsDef(this.tableOptions);
    setMaxNumConditions(columns);
    this.columns = columns;
  }

  protected setCheckbox(columns: Array<MeColDef<T>>): void {
    if (this.rowSelection !== 'multiple') {
      return;
    }
    const nameColumn = columns.find((c: MeColDef<T>) => c.field === this.checkboxProperty);
    nameColumn.resizable = false;
    nameColumn.headerComponentParams = {
      showNumberOfSelections: true,
    };
  }

  protected setSelectionOptions(): void {
    if (this.rowSelection !== 'multiple') {
      return;
    }
    this.checkboxes.set(true);
  }

  protected refreshData(params?: RefreshServerSideParams): void {
    this.tableApiService.refreshServerSideData(params);
  }

  protected selectPreSelectedRow(): void {
    if (_isNil(this.initialSelectionId) || this.preSelected) {
      return;
    }

    const rowNode = this.gridApi.getRowNode(`${this.initialSelectionId}`);

    if (!rowNode || !rowNode.displayed) {
      return;
    }

    if (rowNode.selectable && !rowNode.isSelected()) {
      rowNode.setSelected(true);
      this.preSelected = true;
    }
  }

  private _setSelectTableComponentId(): void {
    const reTriggerFilterActive = this._isReTriggerFilterActive();
    this.selectTableComponentId = reTriggerFilterActive
      ? USER_PREF_RE_TRIGGER_PREFIX + this.tableComponentId
      : this.tableComponentId;
  }

  private _isReTriggerFilterActive(): boolean {
    return (
      this.isReTriggerFlow &&
      this.reTriggerUniqFilterAttr &&
      this.initialTableFilters &&
      !!this.initialTableFilters[this.reTriggerUniqFilterAttr]
    );
  }

  private _setExternalFilterKeys(): void {
    this.externalFiltersKeys = [this.teamProperty, 'createdByUsername'];
  }

  private _setTeamFilterState() {
    if (this._isReTriggerFilterActive()) {
      this.teamFilterState = 'none';
      return;
    }

    this.teamFilterState =
      this.userPreferencesService.getComponentState(this.selectTableComponentId)?.teamFilterState ||
      this.deepUtilService.getTeamFilterInitState();
  }

  private _startPollingData(): void {
    if (!this.pollingDataEnabled) {
      return;
    }
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
}
