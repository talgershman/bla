import {ColDefField} from '@ag-grid-community/core';
import {Directive} from '@angular/core';
import {MeColDef, MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getTableFiltersActiveState} from '@mobileye/material/src/lib/components/ag-table/services';

import {ClientSideEntityTableBaseDirective} from './client-side-entity-table-base.directive';

@Directive()
export abstract class ClientSideEntityGroupTableBaseDirective<
  T,
> extends ClientSideEntityTableBaseDirective<T> {
  abstract autoGroupField: ColDefField<T>;
  abstract autoGroupHeaderName: string;

  readonly groupDisplayType = 'singleColumn';
  autoGroupColumnDef: MeColDef<T>;

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

  private _setAutoGroupColumnDef(): void {
    this.autoGroupColumnDef = {
      field: this.autoGroupField,
      headerName: this.autoGroupHeaderName,
      minWidth: 320,
      width: 400,
      suppressColumnsToolPanel: true,
      sortable: false,
      filterParams: {
        maxNumConditions: 1,
      },
      cellRendererParams: {
        suppressDoubleClickExpand: true,
        innerRenderer: 'meAgTemplateRendererComponent',
      },
    };
  }
}
