import {ReactiveFormsModule} from '@angular/forms';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {BudgetGroupControl} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {OverrideEtlParamsControlComponent} from 'deep-ui/shared/components/src/lib/controls/override-etl-params-control';
import {DataRetentionService, DatasourceService} from 'deep-ui/shared/core';
import {FullStoryResponseTimeInterceptor} from 'deep-ui/shared/http';

import {DatasourceDetailsStepComponent} from './datasource-details-step.component';

describe('DatasourceDetailsStepComponent', () => {
  let spectator: Spectator<DatasourceDetailsStepComponent>;
  let dataRetentionService: SpyObject<DataRetentionService>;
  let fullStoryService: SpyObject<FullStoryService>;
  const createComponent = createComponentFactory({
    component: DatasourceDetailsStepComponent,
    imports: [
      MeInputComponent,
      MeSelectComponent,
      MeTextareaComponent,
      MeFormControlChipsFieldComponent,
      ReactiveFormsModule,
      OverrideEtlParamsControlComponent,
      BudgetGroupControl,
    ],
    providers: [FullStoryResponseTimeInterceptor],
    mocks: [DatasourceService, DataRetentionService, FullStoryService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    dataRetentionService = spectator.inject(DataRetentionService);
    fullStoryService = spectator.inject<FullStoryService>(FullStoryService);
    dataRetentionService.getPerfectDataRetentionObj.and.returnValue(null);
    fullStoryService.trackEvent.and.returnValue(null);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
