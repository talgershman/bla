import {AgGridModule} from '@ag-grid-community/angular';
import {
  FirstDataRenderedEvent,
  IServerSideGroupSelectionState,
  IServerSideSelectionState,
  IsServerSideGroupOpenByDefaultParams,
  Module,
  RefreshServerSideParams,
  RowModelType,
  SelectionChangedEvent,
  StoreRefreshedEvent,
} from '@ag-grid-community/core';
import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {BaseTableDirective} from '@mobileye/material/src/lib/components/ag-table';
import {MeAgTableActionsBarComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-bar';
import {MeAgLoadingCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-loading-cell';
import {
  MeColDef,
  MeGroupByItemDerived,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';

import {MeServerSideTableService} from './server-side-table.service';

@Component({
  selector: 'me-server-side-table',
  templateUrl: './server-side-table.component.html',
  styleUrls: ['./server-side-table.component.scss'],
  providers: [MeAgTableApiService, MeServerSideTableService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeAgTableActionsBarComponent, MatProgressSpinnerModule, AgGridModule, AsyncPipe],
})
export class MeServerSideTableComponent<T> extends BaseTableDirective<T> implements OnInit {
  @Input()
  searchPlaceHolder = 'Search name';

  @Input()
  searchFilterByField = 'name';

  @Input()
  serverSideSortAllLevels = true;

  @Input()
  serverSideOnlyRefreshFilteredGroups = false;

  @Input()
  isServerSideGroupOpenByDefault: (params: IsServerSideGroupOpenByDefaultParams) => boolean;

  @Input()
  getChildCount: (dataItem: T) => number;

  @Output()
  refreshButtonClicked = new EventEmitter<RefreshServerSideParams>();

  @Output()
  storeRefreshed = new EventEmitter<StoreRefreshedEvent>();

  @Output()
  serverSideSelectionStateChanged = new EventEmitter<
    IServerSideSelectionState | IServerSideGroupSelectionState
  >();

  rowModelType: RowModelType = 'serverSide';

  animateRows = false;

  // How many requests to hit the server with concurrently. If the max is reached, requests are queued. Set to -1 for no maximum restriction on requests.
  maxConcurrentDatasourceRequests = 1;

  // How many rows for each block in the store, i.e. how many rows returned from the server at a time.
  cacheBlockSize = 25;

  loadingCellRenderer = MeAgLoadingCellComponent;

  isLoading$ = this.tableApiService.isLoading$;

  constructor(
    @Optional() @Inject('AG_GRID_LICENSE') protected license: string,
    public tableApiService: MeAgTableApiService<T>,
    protected userPreferencesService: MeUserPreferencesService,
    protected cd: ChangeDetectorRef,
    private serverSideTableService: MeServerSideTableService,
  ) {
    super(tableApiService, license, userPreferencesService, cd);
  }

  async ngOnInit(): Promise<void> {
    await this.setLicense();
    const [modules, componentEntries]: [Array<Module>, Array<[string, Component]>] =
      await Promise.all([
        this.serverSideTableService.loadServerModules(
          {
            masterDetail: this.masterDetail,
            rowGrouping: this.columnDefs?.some((col: MeColDef<T>) => col.rowGroup),
          },
          this.moduleNames,
        ),
        this.serverSideTableService.loadServerComponents(this.columnDefs),
      ]);

    this.modules = modules;
    this.registerComponents(componentEntries);
    this.isReady.next(true);
  }

  onFirstDataRendered(event: FirstDataRenderedEvent<T>): void {
    super.onFirstDataRendered(event);
    this.tableApiService.isLoading.next(false);
  }

  onRefreshButtonClicked(): void {
    this.tableApiService.refreshServerSideData(undefined, true);
  }

  onStoreRefreshed(event: StoreRefreshedEvent): void {
    this.tableApiService.isLoading.next(false);
    this.storeRefreshed.emit(event);
  }

  override onSelectionChanged(event: SelectionChangedEvent<T>): void {
    if (this.rowSelection !== 'multiple') {
      super.onSelectionChanged(event);
      return;
    }
    this._emitServerSideSelectionStateChanged();
  }

  override onGroupByChanged(item: MeGroupByItemDerived): void {
    super.onGroupByChanged(item);
    if (this.rowSelection === 'multiple') {
      this._emitServerSideSelectionStateChanged();
    }
  }

  private _emitServerSideSelectionStateChanged(): void {
    if (!this.gridApi) {
      return;
    }
    const event = this.gridApi.getServerSideSelectionState();
    this.serverSideSelectionStateChanged.emit(event);
    if (!this.groupDisplayType) {
      this.numberOfSelectedNodes.next(event.toggledNodes.length);
    }
  }
}
