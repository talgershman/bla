import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ScannedActionsSubject} from '@ngrx/store';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {isPatchJobLoading} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum} from 'deep-ui/shared/models';
import {getFakeDataset, getFakePerfectDatasource} from 'deep-ui/shared/testing';

import {ExpiredAtDataRetentionControlComponent} from '../../controls/expired-at-data-retention-control/expired-at-data-retention-control.component';
import {DatasetDataRetentionSubmitDirective} from '../../directives/dataset-data-retention-submit';
import {DatasetDataRetentionDialogComponent} from './dataset-data-retention-dialog.component';

const {fakeDataSource} = getFakePerfectDatasource(true);

const dataset = getFakeDataset(true, fakeDataSource);

describe('DatasetDataRetentionDialogComponent', () => {
  let spectator: Spectator<DatasetDataRetentionDialogComponent>;
  let datasetDataRetentionSubmitDirective: SpyObject<DatasetDataRetentionSubmitDirective>;
  let store: MockStore;
  const createComponent = createComponentFactory({
    component: DatasetDataRetentionDialogComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      ReactiveFormsModule,
      ExpiredAtDataRetentionControlComponent,
      MatProgressSpinnerModule,
    ],
    providers: [
      ScannedActionsSubject,
      provideMockStore<any>({
        isLoading: false,
      } as any),
      DatasetDataRetentionSubmitDirective,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    store.overrideSelector(isPatchJobLoading, false);
    spectator.component.config = {
      [DataRetentionKnownKeysEnum.DATASETS]: {
        max: -1,
        default: 10,
        tooltip: 'bla',
        label: 'Data set',
        job_types: [],
        allowPermanent: false,
      },
    };
    spectator.component.dataset = dataset;
    datasetDataRetentionSubmitDirective = spectator.inject(DatasetDataRetentionSubmitDirective);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('submit', () => {
    it('should call onSubmit', () => {
      spectator.component['datasetDataRetentionSubmit'] = datasetDataRetentionSubmitDirective;
      spyOn(datasetDataRetentionSubmitDirective, 'onSubmit');
      spectator.component.dataset = {
        ...spectator.component.dataset,
        expirationDate: '2022-09-29',
      };
      spectator.detectChanges();

      const dataRetention = {[DataRetentionKnownKeysEnum.DATASETS]: '2022-09-30'};
      spectator.component.dataRetentionControl.setValue(dataRetention);
      spectator.detectChanges();
      spectator.component.submit();

      expect(datasetDataRetentionSubmitDirective.onSubmit).toHaveBeenCalled();
    });

    it('should not fire action', () => {
      spectator.detectChanges();
      spectator.component.dataRetentionControl.setValue(null);

      spectator.component.submit();

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should not fire action - no change', () => {
      spectator.component.dataset = {
        ...spectator.component.dataset,
        expirationDate: '2022-09-29',
      };
      spectator.detectChanges();

      spectator.component.dataRetentionControl.setValue({
        [DataRetentionKnownKeysEnum.DATASETS]: '2022-09-29',
      });

      spectator.component.submit();

      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });
});
