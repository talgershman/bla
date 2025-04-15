import {AsyncPipe} from '@angular/common';
import {Component, inject, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  EnrichTable,
  MeEnrichTableComponent,
} from '@mobileye/material/src/lib/components/enrich-table';
import {
  BaseDataRetentionDialogComponent,
  DataRetentionRegisterEventsDirective,
  MultipleJobsDataRetentionSubmitDirective,
} from 'deep-ui/shared/components/src/lib/common';
import {DataRetentionControlComponent} from 'deep-ui/shared/components/src/lib/controls/data-retention-control';
import {DataRetentionObj} from 'deep-ui/shared/models';
import _isEqual from 'lodash-es/isEqual';

@Component({
  selector: 'de-multiple-job-data-retention-dialog',
  hostDirectives: [DataRetentionRegisterEventsDirective, MultipleJobsDataRetentionSubmitDirective],
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    DataRetentionControlComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MeEnrichTableComponent,
    AsyncPipe,
  ],
  templateUrl: './multiple-job-data-retention-dialog.component.html',
  styleUrls: ['./multiple-job-data-retention-dialog.component.scss'],
})
export class MultipleJobDataRetentionDialogComponent extends BaseDataRetentionDialogComponent {
  @Input()
  jobIds: Array<string>;

  @Input()
  isPerfectTransform: boolean;

  @Input()
  tableDescription = '';

  @Input()
  table: EnrichTable;

  @Input()
  ignoreNoDataRetentionChange: boolean;

  @Input()
  showShortTimeUpdateMsg: boolean;

  readonly forceShowAllKeys = true;

  private dataRetentionSubmitDirective = inject(MultipleJobsDataRetentionSubmitDirective);

  override submit(): void {
    const dataRetentionRequestObj = this._getMergedDataRetentionObj();
    if (
      dataRetentionRequestObj &&
      (this.ignoreNoDataRetentionChange ||
        !_isEqual(dataRetentionRequestObj, this.jobDataRetention))
    ) {
      this.dataRetentionSubmitDirective.dispatchMultipleJobs(
        dataRetentionRequestObj,
        this.jobIds,
        this.isPerfectTransform,
      );
    } else {
      this.dialog.closeAll();
    }
  }

  private _getMergedDataRetentionObj(): DataRetentionObj {
    const dataRetentionRequestObj = {
      ...(this.job?.data_retention || {}),
      ...this.dataRetentionControl.value,
    };
    return dataRetentionRequestObj;
  }
}
