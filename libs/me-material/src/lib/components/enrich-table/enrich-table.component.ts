import {Component, inject, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import copy from 'copy-to-clipboard';

export interface EnrichTableContent {
  text: string;
  classes?: Array<string>;
  tooltip?: string;
}

export interface EnrichTableRow {
  cells: Array<EnrichTableContent>;
  classes?: Array<string>;
}

export interface EnrichTable {
  headers: EnrichTableRow;
  rows: Array<EnrichTableRow>;
  additionalContentHtml?: string;
  classes?: Array<string>;
}

@Component({
  selector: 'me-enrich-table',
  imports: [MatIconModule, MatButtonModule, MeTooltipDirective],
  templateUrl: './enrich-table.component.html',
  styleUrls: ['./enrich-table.component.scss'],
})
export class MeEnrichTableComponent {
  @Input()
  description: string;

  @Input()
  table: EnrichTable;

  private snackBarService = inject(MeSnackbarService);

  copyToClipboard(event: MouseEvent, id: string): void {
    event.stopPropagation();
    copy(id);
    this.snackBarService.onCopyToClipboard();
  }
}
