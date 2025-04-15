import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService} from 'deep-ui/shared/core';
import {getFakeDataset, getFakeMestDatasource} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {DatasetStepperComponent} from '../../components/steppers/dataset-stepper/dataset-stepper.component';
import {EditDatasetComponent} from './edit-dataset.component';

const {fakeDataSource: fakeDataSource1} = getFakeMestDatasource(true);
const fakeDataSources = [
  fakeDataSource1,
  getFakeMestDatasource(true).fakeDataSource,
  getFakeMestDatasource(true).fakeDataSource,
];

const fakeDataset = getFakeDataset(true, fakeDataSource1);

describe('EditDatasetComponent', () => {
  let spectator: Spectator<EditDatasetComponent>;
  let datasetService: SpyObject<DatasetService>;

  const createComponent = createComponentFactory({
    component: EditDatasetComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      MeErrorFeedbackComponent,
      DatasetStepperComponent,
    ],
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                dataset: fakeDataset,
                selectedDataSources: fakeDataSources,
              },
            },
          },
        },
      },
    ],
    mocks: [MeLoadingService, DatasetService, MeAzureGraphService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    datasetService = spectator.inject(DatasetService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onFormValueChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      datasetService.update.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const fakeDataset1 = getFakeDataset(true);
      spectator.detectChanges();

      spectator.component.onFormValueChanged(fakeDataset1);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should update and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      datasetService.update.and.returnValue(of(null));
      const fakeDataset2 = getFakeDataset(true);
      spectator.detectChanges();

      spectator.component.onFormValueChanged(fakeDataset2);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
