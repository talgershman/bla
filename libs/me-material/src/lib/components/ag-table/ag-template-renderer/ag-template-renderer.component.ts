import {ICellRendererAngularComp} from '@ag-grid-community/angular';
import {ICellRendererParams} from '@ag-grid-community/core';
import {NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import copy from 'copy-to-clipboard';

const meCustomTemplateKey = 'meCustomTemplate';

const meFormatKey = 'meFormatter';

@Component({
  selector: 'me-ag-template-renderer',
  templateUrl: './ag-template-renderer.component.html',
  styleUrls: ['./ag-template-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeTooltipDirective, NgTemplateOutlet, MatButtonModule, MatIconModule],
})
export class MeAgTemplateRendererComponent<T> implements ICellRendererAngularComp {
  @ViewChild('cellElem', {read: ElementRef})
  cellElem: ElementRef<HTMLDivElement>;
  template: TemplateRef<any>;
  templateContext: {
    $implicit: T;
    params: ICellRendererParams<T>;
  };
  public cellValue: string;

  params: ICellRendererParams;
  isRowSelectable: boolean;
  rowTooltip: string;
  isCheckboxDisabled: boolean;
  isReady = false;

  private snackbar = inject(MeSnackbarService);
  private cd = inject(ChangeDetectorRef);

  refresh(params: ICellRendererParams<T>): boolean {
    this._updateParams(params);

    // The refresh method returns back a boolean value.
    // If you do not want to handle the refresh in the cell renderer, just return back false.
    // This will indicate to the grid that you did not refresh and the grid will instead destroy the component
    // and create another instance of your component from scratch instead.
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.template = params[meCustomTemplateKey];
    const rowNode = this.params.node as MeRowNode;
    this.isRowSelectable = rowNode.selectable;
    this.isCheckboxDisabled = rowNode.isCheckboxDisabled;
    if (!this.isRowSelectable) {
      const nodeTooltip = rowNode.rowTooltip;
      this.rowTooltip = nodeTooltip ?? "Can't change selection";
    }
    this._updateParams(params);
  }
  copyToClipboard(event: MouseEvent, value: string): void {
    event.stopPropagation();
    copy(value);
    this.snackbar.onCopyToClipboard();
  }

  private _updateParams(params: ICellRendererParams): void {
    this.templateContext = {
      $implicit: params.data,
      params,
    };
    params.valueFormatted = params[meFormatKey] ? params[meFormatKey](params) : params.value;

    this.cellValue = params.valueFormatted;

    this.isReady = true;

    this.cd.detectChanges();
  }
}
