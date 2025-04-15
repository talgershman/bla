import {Directive, inject, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ofType} from '@ngrx/effects';
import {ScannedActionsSubject, Store} from '@ngrx/store';
import {AppState, isPatchJobLoading, jobAPIActions} from 'deep-ui/shared/core';
import {Observable} from 'rxjs';

@UntilDestroy()
@Directive({
  selector: '[deDataRetentionRegisterEvents]',
  providers: [],
})
export class DataRetentionRegisterEventsDirective implements OnInit, OnDestroy {
  private store = inject<Store<AppState>>(Store);
  private actionListener = inject(ScannedActionsSubject);
  private dialog = inject(MatDialog);

  isLoading$: Observable<boolean>;

  ngOnInit(): void {
    this.registerEvents();
  }

  ngOnDestroy(): void {
    this.store.dispatch(jobAPIActions.patchJobFromDialogFinished());
  }

  registerEvents(): void {
    this.isLoading$ = this.store.select(isPatchJobLoading);
    this.actionListener
      .pipe(
        ofType(
          jobAPIActions.patchJobSuccess,
          jobAPIActions.patchPerfectTransformJobSuccess,
          jobAPIActions.patchJobsDataRetentionSuccess,
          jobAPIActions.patchPerfectTransformJobsDataRetentionSuccess,
          jobAPIActions.patchDatasetDataRetentionSuccess,
          jobAPIActions.patchDatasetDataRetentionFailed,
        ),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialog.closeAll();
      });
  }
}
