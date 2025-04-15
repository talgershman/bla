import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {ScannedActionsSubject} from '@ngrx/store';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {SingleJobDataRetentionSubmitDirective} from 'deep-ui/shared/components/src/lib/common';
import {isPatchJobLoading, jobAPIActions} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, ETLJobSnakeCase} from 'deep-ui/shared/models';
import {getFakeEtlJob} from 'deep-ui/shared/testing';

import {DataRetentionControlComponent} from '../../controls/data-retention-control';
import {SingleJobDataRetentionDialogComponent} from './single-job-data-retention-dialog.component';

describe('SingleJobDataRetentionDialogComponent', () => {
  let spectator: Spectator<SingleJobDataRetentionDialogComponent>;
  let store: MockStore;
  const fakeJob = getFakeEtlJob(true) as unknown as ETLJobSnakeCase;
  const createComponent = createComponentFactory({
    component: SingleJobDataRetentionDialogComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      ReactiveFormsModule,
      DataRetentionControlComponent,
      MatProgressSpinnerModule,
    ],
    providers: [
      ScannedActionsSubject,
      provideMockStore<any>({
        isLoading: false,
      } as any),
      SingleJobDataRetentionSubmitDirective,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    store.overrideSelector(isPatchJobLoading, false);
    spectator.component.job = fakeJob;
    spectator.component.config = {
      [DataRetentionKnownKeysEnum.PARSED_DATA]: {
        max: -1,
        default: 10,
        tooltip: 'bla',
        label: 'Parsed Data',
        job_types: [],
        allowPermanent: false,
      },
    };
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('submit', () => {
    it('should fire patchJobFromDialog action and update parsed data', () => {
      spectator.component.job = {
        ...spectator.component.job,
        data_retention: {
          [DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-29',
          [DataRetentionKnownKeysEnum.ETL_RESULTS]: '2022-09-29',
        },
      };
      spectator.detectChanges();

      const dataRetention = {
        [DataRetentionKnownKeysEnum.ETL_RESULTS]: '2022-09-30',
      };
      const expectedDataRetention = {
        [DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-30',
        [DataRetentionKnownKeysEnum.ETL_RESULTS]: '2022-09-30',
      };
      spectator.component.dataRetentionControl.setValue(dataRetention);
      spectator.detectChanges();
      spectator.component.submit();

      expect(store.dispatch).toHaveBeenCalledWith(
        jobAPIActions.patchJobFromDialog({
          job: {jobUuid: fakeJob.job_uuid, dataRetention: expectedDataRetention},
        }),
      );
    });

    it('should fire patchPerfectTransformJobFromDialog action', () => {
      spectator.component.job = {
        ...spectator.component.job,
        data_retention: {
          [DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: '2022-09-29',
        },
      };
      spectator.component.isPerfectTransform = true;
      spectator.detectChanges();

      const dataRetention = {[DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: '2022-09-30'};
      spectator.component.dataRetentionControl.setValue(dataRetention);
      spectator.detectChanges();
      spectator.component.submit();

      expect(store.dispatch).toHaveBeenCalledWith(
        jobAPIActions.patchPerfectTransformJobFromDialog({
          job: {jobUuid: fakeJob.job_uuid, dataRetention},
        }),
      );
    });

    it('should not fire action', () => {
      spectator.detectChanges();
      spectator.component.dataRetentionControl.setValue(null);

      spectator.component.submit();

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should not fire action - no change', () => {
      spectator.component.job = {
        ...spectator.component.job,
        data_retention: {
          [DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-29',
        },
      };
      spectator.detectChanges();

      spectator.component.dataRetentionControl.setValue({
        [DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-29',
      });

      spectator.component.submit();

      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });
});
