import {AgGridModule} from '@ag-grid-community/angular';
import {
  ClientSideRowModelStep,
  ColDef,
  GetDataPath,
  ICellRendererParams,
  Module,
  RowModelType,
  ValueFormatterParams,
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
import {BaseTableDirective} from '@mobileye/material/src/lib/components/ag-table';
import {MeAgTableActionsBarComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-bar';
import {
  ARRAY_CELL_FORMATTER,
  MeColDef,
  MeRowNode,
  TeamFilterStateTypes,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  MeAgTableApiService,
  setMaxNumConditions,
} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {formatDateFull, isDate} from '@mobileye/material/src/lib/utils';
import {OnChange} from 'property-watch-decorator';

import {MeClientSideTableService} from './client-side-table.service';

@Component({
  selector: 'me-client-side-table',
  templateUrl: './client-side-table.component.html',
  styleUrls: ['./client-side-table.component.scss'],
  providers: [MeAgTableApiService, MeClientSideTableService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeAgTableActionsBarComponent, AgGridModule, AsyncPipe],
})
export class MeClientSideTableComponent<T> extends BaseTableDirective<T> implements OnInit {
  @Input()
  cacheQuickFilter: boolean;

  @Input()
  ignoredColIds: Array<string> = [];

  @Input()
  groupDefaultExpanded = 0;

  @OnChange<void>('_onRowDataChanged')
  @Input()
  rowData: T[];

  @Input()
  getDataPath: GetDataPath;

  @Input()
  isExternalFilterPresent: () => boolean;

  @Input()
  doesExternalFilterPass: (node: MeRowNode<T>) => boolean;

  @Output()
  refreshButtonClicked = new EventEmitter<ClientSideRowModelStep>();

  rowModelType: RowModelType = 'clientSide';

  // Set to true to enable Row Animation
  animateRows = true;

  searchPlaceHolder = 'Search everything';

  private modelKeys: Set<string>;

  constructor(
    @Optional() @Inject('AG_GRID_LICENSE') protected license: string,
    public tableApiService: MeAgTableApiService<T>,
    protected userPreferencesService: MeUserPreferencesService,
    protected cd: ChangeDetectorRef,
    private clientTableService: MeClientSideTableService,
  ) {
    super(tableApiService, license, userPreferencesService, cd);
  }

  async ngOnInit(): Promise<void> {
    await this.setLicense();
    const [modules, componentEntries]: [Array<Module>, Array<[string, Component]>] =
      await Promise.all([
        this.clientTableService.loadClientModules(
          {
            masterDetail: this.masterDetail,
            rowGrouping: this.columnDefs?.some((col: MeColDef<T>) => col.rowGroup),
          },
          this.moduleNames,
        ),
        this.clientTableService.loadClientComponents(this.columnDefs),
      ]);

    this.modules = modules;
    this.registerComponents(componentEntries);
    this.isReady.next(true);
  }

  onRefreshButtonClicked(): void {
    this.refreshButtonClicked.emit();
  }

  onTeamFilterClicked(state: TeamFilterStateTypes): void {
    this.teamFilterClicked.emit(state);
  }

  private _onRowDataChanged(): void {
    if (this.colDefBeenUpdated || !this.rowData?.length) {
      return;
    }
    const entity = this.clientTableService.getFirstRowData(this.rowData);
    const allKeys = this.clientTableService.getKeysOfRowData(entity);

    if (this.tableApiService.getGridApi() && allKeys.length > 0) {
      const currentColDefs: Array<ColDef> = this.tableApiService.getGridApi().getColumnDefs();
      const filteredNewKeys = this.clientTableService.filterColDefKeys(allKeys, currentColDefs);
      this._reassignColDefs(entity, filteredNewKeys, currentColDefs);
      this.colDefBeenUpdated = true;
    }
  }

  private _reassignColDefs(entity: T, keys: Array<string>, currentColDefs: Array<ColDef>): void {
    const newColDefs: Array<ColDef> = [];
    const filteredKeys = keys.filter((k: string) => !this.ignoredColIds.includes(k));
    for (const k of filteredKeys) {
      const formatter = this._getFormatter(entity[k]);
      const colDef = {
        field: k,
        filter: false,
        cellRenderer: 'meAgTemplateRendererComponent',
        cellRendererParams: {
          meFormatter: formatter,
        },
        valueFormatter: formatter as (rowData: ValueFormatterParams) => string,
        hide: true,
      };
      newColDefs.push(colDef);
    }
    setMaxNumConditions(newColDefs);
    this.tableApiService
      .getGridApi()
      .setGridOption('columnDefs', [...currentColDefs, ...newColDefs]);
  }

  private _getFormatter(value: any): (rowData: ICellRendererParams) => string {
    if (typeof value === 'number') {
      return this._numberFormatter();
    }

    if (isDate(value)) {
      return this._dateFormatter();
    }

    if (typeof value === 'boolean') {
      return this._booleanFormatter();
    }

    if (Array.isArray(value)) {
      return this._arrayFormatter();
    }

    if (value instanceof Object && value.constructor === Object) {
      return this._objectFormatter();
    }

    return this._stringFormatter();
  }

  private _stringFormatter(): (rowData: ICellRendererParams) => string {
    return (rowData: ICellRendererParams) => rowData.value;
  }

  private _numberFormatter(): (rowData: ICellRendererParams) => string {
    return (rowData: ICellRendererParams) =>
      rowData.value === 0 ? 'N/A' : rowData.value?.toLocaleString();
  }

  private _dateFormatter(): (rowData: ICellRendererParams) => string {
    return (rowData: ICellRendererParams) => formatDateFull(rowData.value);
  }

  private _booleanFormatter(): (rowData: ICellRendererParams) => string {
    return (rowData: ICellRendererParams) => rowData.value;
  }

  private _arrayFormatter(): (rowData: ICellRendererParams) => string {
    return ARRAY_CELL_FORMATTER;
  }

  private _objectFormatter(): (rowData: ICellRendererParams) => string {
    return (rowData: ICellRendererParams) => JSON.stringify(rowData.value, null, 2);
  }
}
