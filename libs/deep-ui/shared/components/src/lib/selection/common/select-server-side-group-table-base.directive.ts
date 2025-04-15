import {
  ColDefField,
  FirstDataRenderedEvent,
  IServerSideSelectionState,
  RowNode,
  StoreRefreshedEvent,
} from '@ag-grid-community/core';
import {Directive, Input} from '@angular/core';
import {MeColDef, MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getTableFiltersActiveState} from '@mobileye/material/src/lib/components/ag-table/services';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {delay, filter} from 'rxjs/operators';

import {SelectServerSideTableBaseDirective} from './select-server-side-table-base.directive';

@UntilDestroy()
@Directive()
export abstract class SelectServerSideGroupTableBaseDirective<
  T,
> extends SelectServerSideTableBaseDirective<T> {
  @Input()
  initialSelectionGroupKey: Record<string, string>;

  @Input()
  suppressDoubleClickExpand = true;

  @Input()
  autoGroupWidth = 450;

  abstract autoGroupField: ColDefField<T>;
  abstract autoGroupHeaderName: string;
  abstract groupKeyProperty: string;

  readonly groupDisplayType = 'singleColumn';
  readonly expandOnGroups: boolean = true;

  autoGroupColumnDef: MeColDef<T>;

  getChildCount: (data: any) => number = (data: any) => data.childCount;

  protected getTableFiltersActiveState = () =>
    getTableFiltersActiveState(this.columns, this.initialTableFilters, this.autoGroupField);

  protected openedSingleGroupRow = false;

  override ngOnInit(): void {
    this.setAutoGroupColumnDef();
    super.ngOnInit();
  }

  override onSelectionChanged(nodes: Array<MeRowNode<T>>): void {
    let selected = [];
    if (nodes.length) {
      selected = nodes.filter((n: MeRowNode<T>) => !n.group).map((n: MeRowNode) => n.data);
    }
    this.selectionChanged.emit(selected);
  }

  onStoreRefreshed(_: StoreRefreshedEvent): void {
    this._openSingleRow();
  }

  onFirstDataRenderedEvent(_: FirstDataRenderedEvent<T>): void {
    this._openSingleRow();
  }

  override onServerSideSelectionStateChanged(event: IServerSideSelectionState): void {
    const rowNodes: Array<RowNode<T>> = event.toggledNodes.length
      ? event.toggledNodes.map((nodeId: string) => this.gridApi.getRowNode(nodeId) as RowNode)
      : [];
    if (!rowNodes.length) {
      this.selectionChanged.emit([]);
    } else {
      this.selectionChanged.emit(rowNodes.map((row: RowNode<T>) => row.data));
    }
  }

  protected override selectPreSelectedRow(): void {
    if (!this.openedSingleGroupRow && this.preSelected) {
      return;
    }

    this.openedSingleGroupRow = false;
    super.selectPreSelectedRow();
  }

  protected override registerEvents(): void {
    this.agGridDataSource.dataLoadedLevel$
      .pipe(
        delay(350),
        filter((l: number) => l > 0),
        untilDestroyed(this),
      )
      .subscribe((_) => this.selectPreSelectedRow());
  }

  protected setAutoGroupColumnDef(): void {
    this.autoGroupColumnDef = {
      field: this.autoGroupField,
      headerName: this.autoGroupHeaderName,
      width: this.autoGroupWidth,
      flex: 1,
      suppressSizeToFit: true,
      sortable: false,
      filter: false,
      cellRendererParams: {
        meCustomTemplate: this.nameCell,
        suppressDoubleClickExpand: this.suppressDoubleClickExpand,
        innerRenderer: 'meAgTemplateRendererComponent',
      },
    };
  }

  private _openSingleRow(): void {
    const nodes = this.gridApi.getRenderedNodes();

    if (nodes?.length !== 1 || !nodes[0].group) {
      return;
    }

    const groupRowNode = nodes[0];

    if (!groupRowNode) {
      return;
    }

    if (!groupRowNode.expanded) {
      groupRowNode.setExpanded(true);
      this.openedSingleGroupRow = true;
    }
  }
}
