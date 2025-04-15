import {AsyncPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  BaseDataRetentionDialogComponent,
  DataRetentionRegisterEventsDirective,
} from 'deep-ui/shared/components/src/lib/common';
import {DataRetentionKnownKeysEnum, Dataset} from 'deep-ui/shared/models';

import {ExpiredAtDataRetentionControlComponent} from '../../controls/expired-at-data-retention-control/expired-at-data-retention-control.component';
import {DatasetDataRetentionSubmitDirective} from '../../directives/dataset-data-retention-submit';

@Component({
  selector: 'de-dataset-data-retention-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DatasetDataRetentionSubmitDirective, DataRetentionRegisterEventsDirective],
  imports: [
    MatProgressSpinnerModule,
    ExpiredAtDataRetentionControlComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    AsyncPipe,
  ],
  templateUrl: './dataset-data-retention-dialog.component.html',
  styleUrls: ['./dataset-data-retention-dialog.component.scss'],
})
export class DatasetDataRetentionDialogComponent extends BaseDataRetentionDialogComponent {
  @Input()
  dataset: Dataset;

  private datasetDataRetentionSubmit = inject(DatasetDataRetentionSubmitDirective);

  override ngOnInit(): void {
    super.ngOnInit();
    this.currentDataRetention = {
      [DataRetentionKnownKeysEnum.DATASETS]: this.dataset.expirationDate,
    };
    this.showDataRetentionControl = Object.keys(this.currentDataRetention).length > 0;
  }

  override submit(): void {
    const dataRetentionRequestObj = {
      ...this.dataRetentionControl.value,
    };
    if (
      this.dataRetentionControl.value?.[DataRetentionKnownKeysEnum.DATASETS] &&
      this.dataRetentionControl.value?.[DataRetentionKnownKeysEnum.DATASETS] !==
        this.dataset.expirationDate
    ) {
      this.datasetDataRetentionSubmit.onSubmit(dataRetentionRequestObj, this.dataset);
    } else {
      this.dialog.closeAll();
    }
  }
}
