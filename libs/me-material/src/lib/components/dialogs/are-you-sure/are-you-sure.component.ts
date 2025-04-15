import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {
  EnrichTable,
  MeEnrichTableComponent,
} from '@mobileye/material/src/lib/components/enrich-table';

@Component({
  selector: 'me-are-you-sure-dialog',
  templateUrl: './are-you-sure.component.html',
  styleUrls: ['./are-you-sure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MeEnrichTableComponent],
})
export class MeAreYouSureDialogComponent {
  @Output()
  confirmed = new EventEmitter();

  @Output()
  canceled = new EventEmitter();

  @Input()
  title = 'Are you Sure';

  @Input()
  contentHtml = '<div>Do you want to perform this action<div>';

  @Input()
  hideCancelButton: boolean;

  @Input()
  cancelPlaceHolder = 'Cancel';

  @Input()
  confirmPlaceHolder = 'Confirm';

  @Input()
  tableDescription = '';

  @Input()
  table: EnrichTable;
}
