import {CheckboxSelectionCallbackParams, IsRowSelectable} from '@ag-grid-community/core';
import {NgClass} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MeColDef, MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {setMaxNumConditions} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectServerSideTableBaseDirective} from 'deep-ui/shared/components/src/lib/selection/common';
import {AssetManagerService, PerfectListDatasource, PerfectListService} from 'deep-ui/shared/core';
import {PerfectList} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import {delay} from 'rxjs/operators';

import {getSelectPerfectListTableColumns} from './select-perfect-list-entities';

@UntilDestroy()
@Component({
  selector: 'de-select-perfect-list',
  templateUrl: './select-perfect-list.component.html',
  styleUrls: ['./select-perfect-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeServerSideTableComponent,
    NgClass,
    MeTooltipDirective,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
})
export class SelectPerfectListComponent extends SelectServerSideTableBaseDirective<PerfectList> {
  @ViewChild('statusCell', {static: true})
  statusCell: TemplateRef<any>;

  @ViewChild('syncCell', {static: true})
  syncCell: TemplateRef<any>;

  @Input()
  selectedPerfectListIds: Array<number> = [];

  @Input()
  readOnlySavedPerfectListIds: boolean;

  @Input()
  showSyncColumn: boolean;

  @Output()
  syncSelectedChanged = new EventEmitter<PerfectList[]>();

  @Output()
  invalidAdded = new EventEmitter<number>();

  @Output()
  invalidRemoved = new EventEmitter<number>();

  setDatasource = () =>
    (this.agGridDataSource = new PerfectListDatasource(this.perfectListService));

  syncPerfectLists: Array<PerfectList> = [];
  selectedPerfectLists: Array<PerfectList> = [];
  readonly getTableColumnsDef = getSelectPerfectListTableColumns;
  readonly idProperty = 'id';
  readonly teamProperty = 'team';
  readonly ignoredFiltersKeys = [];
  readonly ignoreTeamFilterAttributes = ['id'];
  readonly checkboxProperty = null;
  readonly clearSelectedRowsFilteredOut = false;
  readonly enableSideBar: string | boolean = true;
  readonly cacheQuickFilter = true;
  readonly rowHeight = 52;
  readonly externalFiltersKeys = ['team', 'createdByUsername'];
  readonly reTriggerUniqFilterAttr = 'id';

  private assetManagerService = inject(AssetManagerService);
  private perfectListService = inject(PerfectListService);

  override isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (rowNode.data.status !== 'active') {
      rowNode.rowTooltip = 'Status must be active';
      return false;
    }

    if (
      !!this.initialTableFilters?.technology &&
      rowNode.data.technology !== this.initialTableFilters?.technology
    ) {
      rowNode.rowTooltip = `Only technology type: ${
        this.assetManagerService.technologiesOptions.find(
          (t: MeSelectOption) => t.id === this.initialTableFilters?.technology,
        )?.value
      }  is allowed.`;
      return false;
    }

    if (!this.showSyncColumn) {
      return true;
    }
    if (this.selectedPerfectListIds?.includes(rowNode.data?.id)) {
      rowNode.isCheckboxDisabled = true;
    }
    return true;
  };

  onSyncChanged(value: MatSlideToggleChange, perfectList: PerfectList): void {
    if (value.checked) {
      this.syncPerfectLists.push(perfectList);
    } else {
      this.syncPerfectLists = _filter(
        this.syncPerfectLists,
        (list: PerfectList) => list.id !== perfectList.id,
      );
    }
    this.syncSelectedChanged.emit(this.syncPerfectLists);
  }

  protected override registerEvents() {
    super.registerEvents();
    this.selectionChanged.subscribe(
      (selections: Array<PerfectList>) => (this.selectedPerfectLists = selections),
    );
    this.agGridDataSource.dataLoaded$
      .pipe(delay(350), untilDestroyed(this))
      .subscribe((rowData: Array<PerfectList>) => {
        this._onReadOnlySavedPerfectListIds(this.readOnlySavedPerfectListIds, rowData);
        this._selectPerfectLists(rowData);
      });
  }

  protected override setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
        statusCell: this.statusCell,
        syncCell: this.syncCell,
      },
      showActions: !this.hideTableActions,
      selectOptions: {
        technology: this.assetManagerService.technologiesOptions,
      },
    };
  }

  protected override setTableColumns(): void {
    const columns = this.getTableColumnsDef(this.tableOptions);
    setMaxNumConditions(columns);
    this._removeSyncColumn(columns);
    this.setSelectionOptions();
    this.columns = columns;
  }

  protected override setSelectionOptions(): void {
    this.checkboxes.set(this._checkboxSelectionCallback);
  }

  private _removeSyncColumn(columns: MeColDef<PerfectList & {sync?: boolean}>[]): void {
    if (this.showSyncColumn) {
      return;
    }
    const syncColumnIndex = columns.findIndex(
      (c: MeColDef<PerfectList & {sync?: boolean}>) => c.field === 'sync',
    );
    if (syncColumnIndex < 0) {
      return;
    }
    columns.splice(syncColumnIndex, 1);
    const nameColumn = columns.find((c: MeColDef<PerfectList>) => c.field === 'name');
    nameColumn.resizable = false;
    nameColumn.headerComponentParams = {
      showNumberOfSelections: true,
    };
  }

  private _checkboxSelectionCallback = (params: CheckboxSelectionCallbackParams<PerfectList>) =>
    !this.selectedPerfectListIds?.includes(params.data?.id);

  private _selectPerfectLists(perfectList: Array<PerfectList>): void {
    const nodes: Array<MeRowNode<PerfectList>> = perfectList.map(
      (list: PerfectList) => this.gridApi.getRowNode(`${list.id}`) as MeRowNode<PerfectList>,
    );
    nodes.forEach((node: MeRowNode<PerfectList>) => {
      if (node && !node.isSelected() && this.selectedPerfectListIds?.includes(node.data?.id)) {
        node.setSelected(true);
        node.rowTooltip = 'Already selected';
      }
    });
  }

  private _onReadOnlySavedPerfectListIds(readOnly: boolean, perfectList: Array<PerfectList>): void {
    if (readOnly) {
      this._setSyncLists(perfectList);
    } else {
      //clear
      this.syncPerfectLists = [];
      this.syncSelectedChanged.emit([]);
    }
  }

  private _setSyncLists(perfectLists: Array<PerfectList>): void {
    if (!this.readOnlySavedPerfectListIds) {
      return;
    }
    const syncPerfectListsMap: Map<number, PerfectList> = this.syncPerfectLists.reduce(
      (map: Map<number, PerfectList>, item: PerfectList) => map.set(item.id, item),
      new Map(),
    );
    for (const id of this.selectedPerfectListIds || []) {
      const node = this.gridApi.getRowNode(`${id}`);
      if (!node) {
        this.invalidAdded.emit(id);
        this.perfectListService
          .getSingle(id)
          .pipe(untilDestroyed(this))
          .subscribe((notRenderedList: PerfectList) => {
            const syncPerfectListsMap: Map<number, PerfectList> = this.syncPerfectLists.reduce(
              (map: Map<number, PerfectList>, item: PerfectList) => map.set(item.id, item),
              new Map(),
            );
            if (!syncPerfectListsMap.has(id)) {
              syncPerfectListsMap.set(notRenderedList.id, notRenderedList);
              this.syncPerfectLists.push(notRenderedList);
              this.syncSelectedChanged.emit(this.syncPerfectLists);
            }
            this.invalidRemoved.emit(id);
          });
        continue;
      }
      if (!node.isSelected()) {
        node.setSelected(true);
      }
      const savedList = _find(perfectLists, (list: PerfectList) => list.id === id);
      if (savedList && !syncPerfectListsMap.has(id)) {
        syncPerfectListsMap.set(id, savedList);
        this.syncPerfectLists.push(savedList);
      }
    }
    this.syncSelectedChanged.emit(this.syncPerfectLists);
  }
}
