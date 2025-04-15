import {Directive, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState, jobAPIActions} from 'deep-ui/shared/core';

@Directive({
  selector: '[deMultipleJobsDataRetentionSubmit]',
  providers: [],
})
export class MultipleJobsDataRetentionSubmitDirective {
  private store = inject(Store<AppState>);

  dispatchMultipleJobs(
    dataRetentionRequestObj: any,
    jobIds: Array<string>,
    isPerfectTransform: boolean,
  ): void {
    const action = isPerfectTransform
      ? jobAPIActions.patchPerfectTransformJobsDataRetentionFromDialog({
          jobIds: jobIds,
          dataRetention: dataRetentionRequestObj,
        })
      : jobAPIActions.patchJobsDataRetentionFromDialog({
          jobIds: jobIds,
          dataRetention: dataRetentionRequestObj,
        });
    this.store.dispatch(action);
  }
}
