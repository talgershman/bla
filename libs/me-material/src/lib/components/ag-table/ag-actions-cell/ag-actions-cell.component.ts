import {ICellRendererAngularComp} from '@ag-grid-community/angular';
import {ICellRendererParams} from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  InputSignal,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {
  MeAgTableActionItem,
  MeAgTableActionItemEvent,
  MeRowNode,
  MeTableContext,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import _filter from 'lodash-es/filter';

@Component({
  selector: 'me-ag-actions-cell',
  templateUrl: './ag-actions-cell.component.html',
  styleUrls: ['./ag-actions-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatMenuModule, MatIconModule, MeTooltipDirective],
})
export class MeAgActionsCellComponent<T> implements ICellRendererAngularComp {
  @ViewChildren(MeTooltipDirective)
  tooltipTriggers: QueryList<MeTooltipDirective>;

  params: ICellRendererParams<T>;
  rowNode: MeRowNode<T>;
  actions: MeAgTableActionItem<T>[] = [];
  groupActions: MeAgTableActionItem<T>[] = [];
  currentMenu: any = null;
  isGroupRow: boolean;
  show: boolean;

  refresh(_: ICellRendererParams<T>): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.rowNode = params.node as MeRowNode<T>;
    this.isGroupRow = params.node.group;
    const actionsKey = 'actions';
    const selectionModeKey = 'selectionMode';
    const selectionMode = params?.[selectionModeKey];
    this.actions = _filter(
      params[actionsKey],
      (action) => !action.excludeInSelectionMode || !selectionMode,
    );
    const groupActionsKey = 'groupActions';
    if (params.node.group) {
      const currentGroupNode = params.node.rowGroupColumn.getColId();
      const currentActionsOptions = params?.[groupActionsKey]?.[currentGroupNode] || [];
      this.groupActions = _filter(
        currentActionsOptions,
        (action) => !action.excludeInSelectionMode || !selectionMode,
      );
    }
    if (this.groupActions?.length) {
      const showKey = 'show';
      this.show = params[showKey];
    }
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }

  onMenuOpened(item): void {
    this.currentMenu = item;
  }

  onMouseOver(i: number, msg: string): void {
    this._showHideTooltip(i, true, msg);
  }

  onMouseOut(i: number): void {
    this._showHideTooltip(i, false);
  }

  onMenuClosed(): void {
    this.currentMenu = null;
  }

  onActionClicked(action: MeAgTableActionItem<T>, selectedRowNode: MeRowNode<T>): void {
    const event: MeAgTableActionItemEvent<T> = {
      ...action,
      selected: selectedRowNode.data,
      selectedRowNode,
    };
    (this.params.context as MeTableContext<T>).parentComponent.onActionClicked(event);
  }

  private _showHideTooltip(index: number, show: boolean, message?: string) {
    const tooltip = this.tooltipTriggers.toArray()[index];
    if (message) {
      tooltip.tippyContent = signal(message) as unknown as InputSignal<any>;
    }

    if (show && tooltip.tippyContent) {
      tooltip.show();
    } else if (!show) {
      tooltip.hide();
    }
  }
}
