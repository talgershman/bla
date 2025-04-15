import {dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {provideMockActions} from '@ngrx/effects/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {PerfectTransformJobsService} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, PerfectTransformJob} from 'deep-ui/shared/models';
import {getFakeEtlJob} from 'deep-ui/shared/testing';
import {EMPTY, Observable, of, throwError} from 'rxjs';

import {EtlJobService} from '../../jobs/etl-job/etl-job.service';
import {jobAPIActions} from '../actions/job.actions';
import {State} from '../reducers/job.reducer';
import {JobEffects} from './job.effects';

describe('JobEffects', () => {
  let spectator: SpectatorHttp<JobEffects>;
  let actions$: Observable<any>;
  let effects: JobEffects;
  let etlJobService: SpyObject<EtlJobService>;
  let perfectTransformJobService: SpyObject<PerfectTransformJobsService>;

  const createHttp = createHttpFactory({
    service: JobEffects,
    providers: [
      JobEffects,
      provideMockActions(() => actions$),
      provideMockStore<State>({
        initialState: {isLoading: false},
      }),
    ],
    mocks: [EtlJobService, PerfectTransformJobsService],
  });

  beforeEach(() => {
    spectator = createHttp();
    effects = spectator.inject(JobEffects);
    etlJobService = spectator.inject(EtlJobService);
    perfectTransformJobService = spectator.inject(PerfectTransformJobsService);
  });

  describe('patchJob$', () => {
    it('should fire action success', (done) => {
      etlJobService.updateJob.and.returnValue(of(EMPTY));
      (async function () {
        const fakeJob = getFakeEtlJob();
        actions$ = of(jobAPIActions.patchJobFromDialog({job: fakeJob}));
        effects.patchJob$.subscribe((res) => {
          expect(res).toEqual(jobAPIActions.patchJobSuccess({job: fakeJob}));
          done();
        });
      })();
    });

    it('should fire action failed', (done) => {
      etlJobService.updateJob.and.returnValue(throwError({}));
      (async function () {
        actions$ = of(jobAPIActions.patchJobFromDialog({job: getFakeEtlJob()}));
        effects.patchJob$.subscribe((res) => {
          expect(res).toEqual(jobAPIActions.patchJobFailed());
          done();
        });
      })();
    });
  });

  describe('patchPerfectTransformJob$', () => {
    it('should fire action success', (done) => {
      perfectTransformJobService.updateJob.and.returnValue(of(EMPTY));
      (async function () {
        const fakeJob = getFakeEtlJob();
        actions$ = of(
          jobAPIActions.patchPerfectTransformJobFromDialog({
            job: fakeJob as unknown as PerfectTransformJob,
          }),
        );
        effects.patchPerfectTransformJob$.subscribe((res) => {
          expect(res).toEqual(
            jobAPIActions.patchPerfectTransformJobSuccess({
              job: fakeJob as unknown as PerfectTransformJob,
            }),
          );
          done();
        });
      })();
    });

    it('should fire action failed', (done) => {
      perfectTransformJobService.updateJob.and.returnValue(throwError({}));
      (async function () {
        actions$ = of(
          jobAPIActions.patchPerfectTransformJobFromDialog({
            job: getFakeEtlJob() as unknown as PerfectTransformJob,
          }),
        );
        effects.patchPerfectTransformJob$.subscribe((res) => {
          expect(res).toEqual(jobAPIActions.patchPerfectTransformJobFailed());
          done();
        });
      })();
    });
  });

  describe('patchJobs$', () => {
    const request = {
      jobIds: ['id-1', 'id-2'],
      dataRetention: {
        [DataRetentionKnownKeysEnum.ETL_RESULTS]: toShortDate(dateNow()),
      },
    };

    it('should fire action success', (done) => {
      const response = {
        jobs_updated: ['id-1', 'id-2'],
        errors: [],
      };
      etlJobService.updateDataRetention.and.returnValue(of(response));
      (async function () {
        actions$ = of(jobAPIActions.patchJobsDataRetentionFromDialog(request));
        effects.patchJobs$.subscribe((res) => {
          expect(res).toEqual(jobAPIActions.patchJobsDataRetentionSuccess(response));
          done();
        });
      })();
    });

    it('should fire action failed', (done) => {
      etlJobService.updateDataRetention.and.returnValue(throwError({}));
      (async function () {
        actions$ = of(jobAPIActions.patchJobsDataRetentionFromDialog(request));
        effects.patchJobs$.subscribe((res) => {
          expect(res).toEqual(jobAPIActions.patchJobsDataRetentionFailed());
          done();
        });
      })();
    });
  });

  describe('patchPerfectTransformJobs$', () => {
    const request = {
      jobIds: ['id-1', 'id-2'],
      dataRetention: {
        [DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: toShortDate(dateNow()),
      },
    };

    it('should fire action success', (done) => {
      const response = {
        jobs_updated: ['id-1', 'id-2'],
        errors: [],
      };
      perfectTransformJobService.updateDataRetention.and.returnValue(of(response));
      (async function () {
        actions$ = of(jobAPIActions.patchPerfectTransformJobsDataRetentionFromDialog(request));
        effects.patchPerfectTransformJobs$.subscribe((res) => {
          expect(res).toEqual(
            jobAPIActions.patchPerfectTransformJobsDataRetentionSuccess(response),
          );
          done();
        });
      })();
    });

    it('should fire action failed', (done) => {
      perfectTransformJobService.updateDataRetention.and.returnValue(throwError({}));
      (async function () {
        actions$ = of(jobAPIActions.patchPerfectTransformJobsDataRetentionFromDialog(request));
        effects.patchPerfectTransformJobs$.subscribe((res) => {
          expect(res).toEqual(jobAPIActions.patchPerfectTransformJobsDataRetentionFailed());
          done();
        });
      })();
    });
  });
});
