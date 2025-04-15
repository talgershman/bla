import {AsyncPipe} from '@angular/common';
import {Component, inject, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  EnrichTable,
  MeEnrichTableComponent,
} from '@mobileye/material/src/lib/components/enrich-table';
import {dateDiff} from '@mobileye/material/src/lib/utils';
import {
  BaseDataRetentionDialogComponent,
  DataRetentionRegisterEventsDirective,
  SingleJobDataRetentionSubmitDirective,
} from 'deep-ui/shared/components/src/lib/common';
import {DataRetentionControlComponent} from 'deep-ui/shared/components/src/lib/controls/data-retention-control';
import {DataRetentionKnownKeysEnum, DataRetentionObj} from 'deep-ui/shared/models';
import _isEqual from 'lodash-es/isEqual';

@Component({
  selector: 'de-single-job-data-retention-dialog',
  hostDirectives: [DataRetentionRegisterEventsDirective, SingleJobDataRetentionSubmitDirective],
  imports: [
    MatProgressSpinnerModule,
    DataRetentionControlComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MeEnrichTableComponent,
    AsyncPipe,
  ],
  templateUrl: './single-job-data-retention-dialog.component.html',
  styleUrls: ['./single-job-data-retention-dialog.component.scss'],
})
export class SingleJobDataRetentionDialogComponent extends BaseDataRetentionDialogComponent {
  @Input()
  isPerfectTransform: boolean;

  @Input()
  tableDescription = '';

  @Input()
  table: EnrichTable;

  readonly forceShowAllKeys = true;

  private dataRetentionSubmitDirective = inject(SingleJobDataRetentionSubmitDirective);
  override submit(): void {
    const mergedDataRetentionObj = this._getMergedDataRetentionObj();
    const dataRetentionRequestObj =
      this._getParsedDataEtlResultsDataRetentionObj(mergedDataRetentionObj);
    if (dataRetentionRequestObj && !_isEqual(dataRetentionRequestObj, this.jobDataRetention)) {
      this.dataRetentionSubmitDirective.dispatchSingleJob(
        this.job,
        dataRetentionRequestObj,
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

  private _getParsedDataEtlResultsDataRetentionObj(
    dataRetentionObj: DataRetentionObj,
  ): DataRetentionObj {
    const dataRetentionKeys = new Set(Object.keys(dataRetentionObj));
    if (
      dataRetentionKeys.has(DataRetentionKnownKeysEnum.PARSED_DATA) &&
      dataRetentionKeys.has(DataRetentionKnownKeysEnum.ETL_RESULTS)
    ) {
      const diffDays = dateDiff(
        dataRetentionObj[DataRetentionKnownKeysEnum.PARSED_DATA],
        dataRetentionObj[DataRetentionKnownKeysEnum.ETL_RESULTS],
      );
      if (diffDays < 0) {
        return {
          ...dataRetentionObj,
          [DataRetentionKnownKeysEnum.PARSED_DATA]:
            dataRetentionObj[DataRetentionKnownKeysEnum.ETL_RESULTS],
        };
      }
      return dataRetentionObj;
    }
    return dataRetentionObj;
  }
}
