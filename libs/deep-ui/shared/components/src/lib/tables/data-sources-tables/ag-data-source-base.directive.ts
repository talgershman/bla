import {GridApi} from '@ag-grid-community/core';
import {Location} from '@angular/common';
import {
  Directive,
  EventEmitter,
  inject,
  Input,
  Output,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceService, DeepUtilService} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {Datasource, DataSourceSelection, EtlTypeEnum} from 'deep-ui/shared/models';
import {Subject} from 'rxjs';

@Directive()
export abstract class AgDataSourceBaseDirective {
  @Input()
  showCRUDButtons: boolean;

  @Input()
  selectionMode: boolean;

  @Input()
  selectedDataSources: Array<Datasource>;

  @Output()
  dataSourceSelectionChanged = new EventEmitter<DataSourceSelection>();

  EtlTypeEnum = EtlTypeEnum;

  triggerTableRefresh = new Subject<void>();

  isCRUDButtonsDisabled = environment.disableDatasetRoutes;

  selectedDataSource: WritableSignal<DataSourceSelection> = signal(null);

  abstract viewName: DataSourceDynamicViewEnum;

  abstract deleteActionTooltip: Signal<string>;

  protected tableApiService: MeAgTableApiService<Datasource>;

  protected gridApi: GridApi<Datasource>;

  protected isFirstLoad = true;

  protected dialog = inject(MatDialog);
  protected dataSourceService = inject(DatasourceService);
  protected router = inject(Router);
  protected activatedRoute = inject(ActivatedRoute);
  protected location = inject(Location);
  protected deepUtilService = inject(DeepUtilService);

  onGridReady(tableApiService: MeAgTableApiService<Datasource>): void {
    this.tableApiService = tableApiService;
    this.gridApi = this.tableApiService.getGridApi();
  }

  onFiltersParamsChanged(params: Params = {}): void {
    const prevParams = {};
    //only for first load we should not remove initial query params
    if (!this.isFirstLoad) {
      const _activeParams: Params = {
        ...(this.activatedRoute?.snapshot?.queryParams || {}),
      };
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
      ...params,
      view,
    };

    const url = this.router
      .createUrlTree([], {
        queryParams: nextParams,
        queryParamsHandling: 'merge',
      })
      ?.toString();

    this.location?.go(url);
  }

  onDataSourceSelectionChanged(selection: DataSourceSelection): void {
    this.selectedDataSource.set(selection);
    this.dataSourceSelectionChanged.emit(selection);
  }

  abstract onDeleteActionClicked(selection?: DataSourceSelection): Promise<void>;
}
