import {ColDefField, FirstDataRenderedEvent} from '@ag-grid-community/core';
import {Directive} from '@angular/core';
import {MeColDef, MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getTableFiltersActiveState} from '@mobileye/material/src/lib/components/ag-table/services';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import _isNil from 'lodash-es/isNil';
import {delay, distinctUntilChanged, filter} from 'rxjs/operators';

import {ServerSideEntityTableBaseDirective} from './server-side-entity-table-base.directive';

@UntilDestroy()
@Directive()
export abstract class ServerSideEntityGroupTableBaseDirective<
  T,
> extends ServerSideEntityTableBaseDirective<any> {
  abstract autoGroupField: ColDefField<T>;
  abstract autoGroupHeaderName: string;
  abstract groupKeyProperty: string;

  readonly groupDisplayType = 'singleColumn';

  autoGroupColumnDef: MeColDef<T>;

  getChildCount: (data: any) => number = (data: any) => data.childCount;

  protected getTableFiltersActiveState = () =>
    getTableFiltersActiveState(this.columns, this.activeParams, this.autoGroupField);

  override ngOnInit(): void {
    this._setAutoGroupColumnDef();
    super.ngOnInit();
  }

  override onSelectionChanged(nodes: Array<MeRowNode>): void {
    if (!nodes.length) {
      this.selected = [];
    } else {
      this.selected = nodes.filter((n: MeRowNode) => !n.group).map((n: MeRowNode) => n.data);
    }
    this.selectionChanged.emit(this.selected);
  }

  onFirstDataRenderedEvent(_: FirstDataRenderedEvent<T>): void {
    this._openSelectedGroup();
  }

  protected override registerEvents(): void {
    this.agGridDataSource.dataLoadedLevel$
      .pipe(
        delay(350),
        distinctUntilChanged(),
        filter((l: number) => l > 0),
        untilDestroyed(this),
      )
      .subscribe((_) => this.selectPreSelectedRow());
  }

  protected override selectPreSelectedRow(): void {
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

  private _setAutoGroupColumnDef(): void {
    this.autoGroupColumnDef = {
      field: this.autoGroupField,
      headerName: this.autoGroupHeaderName,
      maxWidth: 540,
      flex: 1,
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      filterParams: {
        maxNumConditions: 1,
      },
      cellRendererParams: {
        meCustomTemplate: this.nameCell,
        suppressDoubleClickExpand: true,
        innerRenderer: 'meAgTemplateRendererComponent',
      },
    };
  }

  private _openSelectedGroup(): void {
    if (this.prevEntityIsSelected || !this.prevEntity || !this.prevEntity[this.groupKeyProperty]) {
      return;
    }
    const nodes = this.gridApi.getRenderedNodes();
    const groupNode = nodes.find(
      (n: MeRowNode) => n.key === this.prevEntity[this.groupKeyProperty],
    );
    if (!groupNode) {
      return;
    }
    groupNode.setExpanded(true);
  }
}
