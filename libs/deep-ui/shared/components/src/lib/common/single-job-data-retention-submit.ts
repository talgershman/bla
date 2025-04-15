import {Directive, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState, jobAPIActions} from 'deep-ui/shared/core';
import {
  DataRetentionObj,
  EtlJob,
  ETLJobSnakeCase,
  PerfectTransformJob,
  PerfectTransformJobSnakeCase,
} from 'deep-ui/shared/models';

@Directive({
  selector: '[deSingleJobDataRetentionSubmit]',
  providers: [],
})
export class SingleJobDataRetentionSubmitDirective {
  private store = inject(Store<AppState>);

  dispatchSingleJob(
    job: Partial<ETLJobSnakeCase | PerfectTransformJobSnakeCase>,
    dataRetentionRequestObj: any,
    isPerfectTransform: boolean,
  ): void {
    const submitValue: Partial<EtlJob | PerfectTransformJob> = {
      jobUuid: job.job_uuid,
      dataRetention: dataRetentionRequestObj,
    };
    submitValue.dataRetention = this._getValidDataRetentionRequestObj(dataRetentionRequestObj);
    const action = isPerfectTransform
      ? jobAPIActions.patchPerfectTransformJobFromDialog({
          job: submitValue as Partial<PerfectTransformJob>,
        })
      : jobAPIActions.patchJobFromDialog({job: submitValue as Partial<EtlJob>});
    this.store.dispatch(action);
  }

  private _getValidDataRetentionRequestObj(
    dataRetentionRequestObj: DataRetentionObj,
  ): DataRetentionObj {
    const filteredDataRetentionKeys = Object.keys(dataRetentionRequestObj).filter(
      (k: string) => dataRetentionRequestObj[k] !== '-',
    );
    const dataRetentionObj = {};
    for (const key of filteredDataRetentionKeys) {
      dataRetentionObj[key] = dataRetentionRequestObj[key];
    }
    return dataRetentionObj;
  }
}
