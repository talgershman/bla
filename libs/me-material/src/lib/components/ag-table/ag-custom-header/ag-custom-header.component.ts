import {IHeaderAngularComp} from '@ag-grid-community/angular';
import {
  Column,
  IHeaderParams,
  RowGroupingDisplayType,
  SortDirection,
} from '@ag-grid-community/core';
import {AsyncPipe} from '@angular/common';
import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MeFlipXDownArrowAnimation} from '@mobileye/material/src/lib/animations';
import {MeTableContext} from '@mobileye/material/src/lib/components/ag-table/entities';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {Observable} from 'rxjs';

@Component({
  selector: 'me-ag-custom-header',
  templateUrl: './ag-custom-header.component.html',
  styleUrls: ['./ag-custom-header.component.scss'],
  animations: [MeFlipXDownArrowAnimation],
  imports: [MeTooltipDirective, MatIconModule, AsyncPipe, HintIconComponent],
})
export class MeAgCustomHeaderComponent<T> implements IHeaderAngularComp, OnDestroy {
  @ViewChild('menuButton', {read: ElementRef}) public menuButton;

  params: IHeaderParams;

  column: Column;

  sortState: SortDirection;

  showNumberOfSelections: boolean;
  numberOfSelectedNodes$: Observable<number>;
  groupDisplayType: RowGroupingDisplayType;
  infoTooltip: string;
  showInfoTooltip: boolean;
  isFilterActive: boolean;
  isGroupHeader: boolean;
  suppressFilterColumn: boolean;

  private readonly INFO_TOOLTIP_KEY = 'infoTooltip';

  refresh(_: IHeaderParams): boolean {
    return false;
  }
  agInit(params: IHeaderParams): void {
    this.params = params;
    const parentComponent = (params.context as MeTableContext<T>).parentComponent;
    const {rowSelection, groupDisplayType} = parentComponent;
    this.groupDisplayType = groupDisplayType;
    const showNumberOfSelectionsKey = 'showNumberOfSelections';
    const suppressFilterColumnKey = 'suppressFilterColumn';
    const colDef = params.column.getColDef();
    this.showInfoTooltip = !!colDef?.headerComponentParams?.[this.INFO_TOOLTIP_KEY];
    this.showNumberOfSelections =
      colDef.headerComponentParams &&
      colDef.headerComponentParams[showNumberOfSelectionsKey] &&
      rowSelection === 'multiple';
    this.suppressFilterColumn =
      colDef.headerComponentParams && colDef.headerComponentParams[suppressFilterColumnKey];

    this.numberOfSelectedNodes$ = parentComponent.numberOfSelectedNodes$;

    const colId = colDef.showRowGroup;

    this.isGroupHeader = !!colId;

    if (colId === true) {
      this.column = params.api.getAllGridColumns().find((col: Column) => col.isRowGroupActive());
    } else {
      this.column =
        groupDisplayType === 'multipleColumns' && colId
          ? params.api.getColumn(colId)
          : params.column;
    }

    this.column.addEventListener('sortChanged', this.onSortChanged);

    this.column.addEventListener('filterChanged', this.onFilterChanged);

    this.onSortChanged();
    this.onFilterChanged();
  }

  onMenuClicked(): void {
    this.params.showColumnMenu(this.menuButton.nativeElement);
  }

  onSortRequested(): void {
    if (!this.params.enableSorting) {
      return;
    }
    this.params.api.paginationGoToFirstPage();
    if (this.sortState === 'desc') {
      this.params.setSort('asc', false);
    } else {
      this.params.setSort('desc', false);
    }
  }

  onSortChanged = (): void => {
    if (this.column.isSortAscending()) {
      this.sortState = 'asc';
    } else if (this.column.isSortDescending()) {
      this.sortState = 'desc';
    } else {
      this.sortState = null;
    }
  };

  onFilterChanged = (): void => {
    this.isFilterActive = this.column.isFilterActive();
  };

  ngOnDestroy(): void {
    this.column?.removeEventListener('sortChanged', this.onSortChanged);
    this.column?.removeEventListener('filterChanged', this.onFilterChanged);
  }

  onMouseOver(): void {
    const colDef = this.params.column.getColDef();
    this.infoTooltip = colDef.headerComponentParams?.[this.INFO_TOOLTIP_KEY];
  }

  onMouseOut(): void {
    this.infoTooltip = '';
  }
}
