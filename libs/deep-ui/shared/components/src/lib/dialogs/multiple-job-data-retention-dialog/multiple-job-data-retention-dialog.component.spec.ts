import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {ScannedActionsSubject} from '@ngrx/store';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {MultipleJobsDataRetentionSubmitDirective} from 'deep-ui/shared/components/src/lib/common';
import {isPatchJobLoading, jobAPIActions} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, ETLJobSnakeCase} from 'deep-ui/shared/models';
import {getFakeEtlJob} from 'deep-ui/shared/testing';

import {DataRetentionControlComponent} from '../../controls/data-retention-control';
import {MultipleJobDataRetentionDialogComponent} from './multiple-job-data-retention-dialog.component';

describe('MultipleJobDataRetentionDialogComponent', () => {
  let spectator: Spectator<MultipleJobDataRetentionDialogComponent>;
  let store: MockStore;
  const fakeJob = getFakeEtlJob(true) as unknown as ETLJobSnakeCase;
  const createComponent = createComponentFactory({
    component: MultipleJobDataRetentionDialogComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      MatIconModule,
      MatIconTestingModule,
      ReactiveFormsModule,
      DataRetentionControlComponent,
      MatProgressSpinnerModule,
    ],
    providers: [
      ScannedActionsSubject,
      provideMockStore<any>({
        isLoading: false,
      } as any),
      MultipleJobsDataRetentionSubmitDirective,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    store.overrideSelector(isPatchJobLoading, false);
    spectator.component.jobIds = ['job1', 'job2'];
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
    it('should fire patchJobsDataRetentionFromDialog action', () => {
      spectator.component.job = {
        ...spectator.component.job,
        data_retention: {
          [DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-29',
        },
      };
      spectator.detectChanges();

      const dataRetention = {[DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-30'};
      spectator.component.dataRetentionControl.setValue(dataRetention);
      spectator.detectChanges();
      spectator.component.submit();

      expect(store.dispatch).toHaveBeenCalledWith(
        jobAPIActions.patchJobsDataRetentionFromDialog({
          jobIds: spectator.component.jobIds,
          dataRetention,
        }),
      );
    });

    it('should fire patchPerfectTransformJobsDataRetentionFromDialog action', () => {
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
        jobAPIActions.patchPerfectTransformJobsDataRetentionFromDialog({
          jobIds: spectator.component.jobIds,
          dataRetention,
        }),
      );
    });

    it('should fire patchPerfectTransformJobFromDialog action 1 time', () => {
      spectator.component.jobIds = ['id-1', 'id-2', 'id-3'];
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

      expect(store.dispatch).toHaveBeenCalledTimes(1);
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
