import {Directive, inject} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import {AppState, DatasetService, jobAPIActions} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, DataRetentionObj, Dataset} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';

@UntilDestroy()
@Directive({
  selector: '[deDatasetDataRetentionSubmit]',
  providers: [],
})
export class DatasetDataRetentionSubmitDirective {
  private store = inject(Store<AppState>);
  private datasetService = inject(DatasetService);

  onSubmit(dataRetentionObj: DataRetentionObj, dataset: Dataset): void {
    this.store.dispatch(jobAPIActions.patchDatasetDataRetention());
    this.datasetService
      .update(
        dataset.id,
        {expirationDate: dataRetentionObj[DataRetentionKnownKeysEnum.DATASETS]} as Dataset,
        {},
      )
      .pipe(
        catchError((response) =>
          of({
            error: response,
          }),
        ),
        untilDestroyed(this),
      )
      .subscribe((response: any) => {
        if (response?.error) {
          this.store.dispatch(jobAPIActions.patchDatasetDataRetentionFailed());
        } else {
          this.store.dispatch(jobAPIActions.patchDatasetDataRetentionSuccess());
        }
      });
  }
}
