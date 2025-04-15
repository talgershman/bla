import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {mergeMap, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';

import {EtlJobService} from '../../jobs/etl-job/etl-job.service';
import {PerfectTransformJobsService} from '../../jobs/perfect-transform-job/perfect-transform-job.service';
import {jobAPIActions} from '../actions/job.actions';
import {updateMsgSnackbarAction} from '../actions/snackbar.actions';

@Injectable()
export class JobEffects {
  private actions$ = inject(Actions);
  private etlJobService = inject(EtlJobService);
  private perfectTransformJobsService = inject(PerfectTransformJobsService);

  patchJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(jobAPIActions.patchJobFromDialog),
      mergeMap((action) => {
        const body = {
          ...action.job,
        };
        delete body.jobUuid;
        return this.etlJobService.updateJob(action.job.jobUuid, body).pipe(
          map(() => {
            return jobAPIActions.patchJobSuccess({job: action.job});
          }),
          catchError(() => of(jobAPIActions.patchJobFailed())),
        );
      }),
    ),
  );

  patchPerfectTransformJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(jobAPIActions.patchPerfectTransformJobFromDialog),
      mergeMap((action) => {
        const body = {
          ...action.job,
        };
        delete body.jobUuid;
        return this.perfectTransformJobsService.updateJob(action.job.jobUuid, body).pipe(
          map(() => {
            return jobAPIActions.patchPerfectTransformJobSuccess({job: action.job});
          }),
          catchError(() => of(jobAPIActions.patchPerfectTransformJobFailed())),
        );
      }),
    ),
  );

  patchJobSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(jobAPIActions.patchJobSuccess, jobAPIActions.patchPerfectTransformJobSuccess),
      switchMap((action) => of(updateMsgSnackbarAction({msg: `Job : ${action.job.jobUuid}`}))),
    );
  });

  patchJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(jobAPIActions.patchJobsDataRetentionFromDialog),
      mergeMap((action) => {
        const {jobIds, dataRetention} = action;
        return this.etlJobService.updateDataRetention(jobIds, dataRetention).pipe(
          map((response) => {
            return jobAPIActions.patchJobsDataRetentionSuccess({
              jobs_updated: response.jobs_updated,
              errors: response.errors,
            });
          }),
          catchError(() => of(jobAPIActions.patchJobsDataRetentionFailed())),
        );
      }),
    ),
  );

  patchPerfectTransformJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(jobAPIActions.patchPerfectTransformJobsDataRetentionFromDialog),
      mergeMap((action) => {
        const {jobIds, dataRetention} = action;
        return this.perfectTransformJobsService.updateDataRetention(jobIds, dataRetention).pipe(
          map((response) => {
            return jobAPIActions.patchPerfectTransformJobsDataRetentionSuccess({
              jobs_updated: response.jobs_updated,
              errors: response.errors,
            });
          }),
          catchError(() => {
            return of(jobAPIActions.patchPerfectTransformJobsDataRetentionFailed());
          }),
        );
      }),
    ),
  );

  patchJobsSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        jobAPIActions.patchJobsDataRetentionSuccess,
        jobAPIActions.patchPerfectTransformJobsDataRetentionSuccess,
      ),
      switchMap((_) =>
        of(
          updateMsgSnackbarAction({
            msg: `<b>Data retention was updated successfully for all jobs</b>`,
            override: true,
          }),
        ),
      ),
    );
  });
}
