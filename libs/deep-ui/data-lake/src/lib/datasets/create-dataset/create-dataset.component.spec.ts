import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService} from 'deep-ui/shared/core';
import {getFakeDataset} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {DatasetStepperComponent} from '../../components/steppers/dataset-stepper/dataset-stepper.component';
import {CreateDatasetComponent} from './create-dataset.component';

describe('CreateDatasetComponent', () => {
  let spectator: Spectator<CreateDatasetComponent>;
  let datasetService: SpyObject<DatasetService>;

  const createComponent = createComponentFactory({
    component: CreateDatasetComponent,
    imports: [
      MeBreadcrumbsComponent,
      MeErrorFeedbackComponent,
      DatasetStepperComponent,
      RouterTestingModule,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                dataset: null,
                selectedDataSources: null,
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
      datasetService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const fakeDataset = getFakeDataset(true);
      spectator.detectChanges();

      spectator.component.onFormValueChanged(fakeDataset);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      datasetService.create.and.returnValue(of(null));
      const fakeDataset = getFakeDataset(true);
      spectator.detectChanges();

      spectator.component.onFormValueChanged(fakeDataset);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
