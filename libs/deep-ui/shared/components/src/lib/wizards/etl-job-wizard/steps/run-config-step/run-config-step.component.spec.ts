import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {MatChipListbox, MatChipOption, MatChipRemove} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTabsModule} from '@angular/material/tabs';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataRetentionControlComponent} from 'deep-ui/shared/components/src/lib/controls/data-retention-control';
import {OverrideEtlParamsControlComponent} from 'deep-ui/shared/components/src/lib/controls/override-etl-params-control';
import {RunConfigStepService} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step/run-config-step.service';
import {
  AssetManagerService,
  DatasourceService,
  EtlService,
  JobFormBuilderService,
  OnPremService,
} from 'deep-ui/shared/core';

import {RunConfigStepComponent} from './run-config-step.component';

describe('RunConfigStepComponent', () => {
  let spectator: Spectator<RunConfigStepComponent>;

  const createComponent = createComponentFactory({
    component: RunConfigStepComponent,
    imports: [
      MatTabsModule,
      MeSelectComponent,
      MeAutocompleteComponent,
      MeInputComponent,
      MeFormControlChipsFieldComponent,
      DataRetentionControlComponent,
      ReactiveFormsModule,
      MatSlideToggleModule,
      MeTooltipDirective,
      MatFormFieldModule,
      OverrideEtlParamsControlComponent,
      RunConfigStepComponent,
      MatChipListbox,
      MatChipOption,
      MatChipRemove,
      MatIcon,
      MatProgressSpinner,
    ],
    providers: [FormBuilder, RunConfigStepService],
    componentProviders: [JobFormBuilderService],
    mocks: [MeAzureGraphService, DatasourceService, AssetManagerService, OnPremService, EtlService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
