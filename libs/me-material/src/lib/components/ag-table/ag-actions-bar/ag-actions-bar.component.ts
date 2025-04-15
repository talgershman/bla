import {GridApi, RowModelType} from '@ag-grid-community/core';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  output,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MeAgGroupSelectComponent} from '@mobileye/material/src/lib/components/ag-table/ag-group-select';
import {MeAgTableRefreshButtonComponent} from '@mobileye/material/src/lib/components/ag-table/ag-table-refresh-button';
import {MeAgTableTeamFilterComponent} from '@mobileye/material/src/lib/components/ag-table/ag-table-team-filter';
import {
  MeColDef,
  MeFilterModelAndColDef,
  MeGroupByItemDerived,
  TeamFilterStateTypes,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSearchInput} from '@mobileye/material/src/lib/components/search-input';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {memoize} from 'lodash-decorators/memoize';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {OnChange} from 'property-watch-decorator';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-ag-table-actions-bar',
  templateUrl: './ag-actions-bar.component.html',
  styleUrls: ['./ag-actions-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MeTooltipDirective,
    NgTemplateOutlet,
    MatButtonModule,
    MatChipsModule,
    MeAgTableRefreshButtonComponent,
    MeAgTableTeamFilterComponent,
    MeAgGroupSelectComponent,
    AsyncPipe,
    MePortalTargetDirective,
    MeSearchInput,
    ReactiveFormsModule,
  ],
})
export class MeAgTableActionsBarComponent<T> implements OnInit {
  @Input()
  componentId: string;

  @Input()
  searchPlaceHolder = 'Search name';

  @Input()
  isDefaultColumnState: boolean;

  @Input()
  rowModelType: RowModelType;

  @Input()
  columnDefs: MeColDef<T>[];

  @Input()
  hideTeamFilterState: boolean;

  @Input()
  teamFilterState: TeamFilterStateTypes;

  @Input()
  groupByOptions: Array<MeGroupByItemDerived>;

  @Input()
  initialGroupByParam: string;

  @Input()
  ignoreSavingTeamFilterState: boolean;

  @Input()
  searchFilterByField: string;

  @OnChange<void>('_onFilterChanged')
  @Input()
  chipsFilterData: Array<MeFilterModelAndColDef> = [];

  @Output()
  teamFilterClicked = new EventEmitter<TeamFilterStateTypes>();

  @Output()
  refreshButtonClicked = new EventEmitter<void>();

  @Output()
  resetFiltersClicked = new EventEmitter<void>();

  @Output()
  restoreDefaultClicked = new EventEmitter<void>();

  @Output()
  filterChipRemoved = new EventEmitter<string>();

  @Output()
  groupChanged = new EventEmitter<MeGroupByItemDerived>();

  private tableApiService = inject<MeAgTableApiService<T>>(MeAgTableApiService);

  fitClicked = output<void>();

  resetTeamFilterAndEmitEventOrNot = new Subject<{shouldEmit: boolean}>();

  resetTeamFilterAndEmitEventOrNot$ = this.resetTeamFilterAndEmitEventOrNot.asObservable();

  restoredClicked = new Subject<boolean>();

  restoredClicked$ = this.restoredClicked.asObservable();

  chipsFilterViewData: Array<MeFilterModelAndColDef> = [];

  hasChipsFilterViewData = false;

  currentSearchValue: string;

  searchInputControl = new FormControl<string>('');

  private gridApi: GridApi<T>;

  ngOnInit(): void {
    this.initSearchElement();
  }

  // eslint-disable-next-line
  @memoize((...args) =>
    _values(args)
      .map((val) => `${val.colDef.field}_${JSON.stringify(val.filterModel)}`)
      .join('_'),
  )
  formattedFilterValue(filterData: MeFilterModelAndColDef): string {
    const {filterModel, colDef} = filterData;
    if (colDef.filterParams?.meFormatter) {
      return colDef.filterParams.meFormatter(filterModel, colDef);
    }
    return `${colDef.headerName || _startCase(colDef.field)} ${
      filterModel.type.startsWith('multi')
        ? filterModel.type.substring(5).toLowerCase()
        : filterModel.type
    }: ${filterModel.filter}`;
  }

  initSearchElement(): void {
    this.searchInputControl.valueChanges
      .pipe(debounceTime(800), distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value: string) => {
        if (!this.tableApiService.getGridApi()) {
          return;
        }
        this.gridApi = this.tableApiService.getGridApi();
        this.currentSearchValue = value.trim().toLowerCase();
        this._updateFilter(this.currentSearchValue);
      });
  }

  onResetFiltersClicked(): void {
    this.resetFiltersClicked.emit();
    this._handleFiltersReset();
  }

  onRestoreDefaultClicked(): void {
    this._handleFiltersReset();
    this.restoreDefaultClicked.emit();
    this.restoredClicked.next(true);
  }

  onFit(): void {
    this.fitClicked.emit();
  }

  onFilterRemoved(filter: MeFilterModelAndColDef): void {
    const filterKey =
      filter.colDef?.cellRendererParams?.replaceToFilterKey ||
      filter.colDef?.cellRendererParams?.useColId
        ? filter.colDef.colId
        : filter.colDef.field;
    this.filterChipRemoved.emit(
      filter.colDef.colId !== 'ag-Grid-AutoColumn' ? filterKey : filter.colDef.colId,
    );
  }

  onGroupByChanged(optionId: string): void {
    const item = this.groupByOptions.find((item: MeGroupByItemDerived) => item.key === optionId);
    this.groupChanged.emit(item);
  }

  private _updateFilter(value: string): void {
    if (this.rowModelType === 'clientSide') {
      this.gridApi.setGridOption('quickFilterText', value);
    } else if (this.rowModelType === 'serverSide') {
      this.tableApiService.setFilterModel({
        [this.searchFilterByField]: {
          filterType: 'text',
          type: 'contains',
          filter: value,
        },
      });
    }
  }

  private _handleFiltersReset(): void {
    if (this.rowModelType === 'clientSide') {
      if (!this.gridApi) {
        this.gridApi = this.tableApiService.getGridApi();
      }
      this.gridApi.setGridOption('quickFilterText', '');
      this.searchInputControl.setValue('');
    }
  }

  private _onFilterChanged(chipsFilterData: Array<MeFilterModelAndColDef>): void {
    if (this.rowModelType === 'clientSide') {
      this.chipsFilterViewData = chipsFilterData;
    } else if (this.rowModelType === 'serverSide') {
      this.chipsFilterViewData = chipsFilterData.filter(
        (chipData: MeFilterModelAndColDef) =>
          chipData.colDef?.cellRendererParams?.showGroupFilterAsChip ||
          chipData.colDef.field !== this.searchFilterByField,
      );
    }

    this.hasChipsFilterViewData = !!this.chipsFilterViewData?.length;
  }
}
