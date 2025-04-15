import {ReactiveFormsModule} from '@angular/forms';
import {MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {SelectEtlListComponent} from 'deep-ui/shared/components/src/lib/selection/select-etl-list';

import {EtlStepComponent} from './etl-step.component';

describe('EtlStepComponent', () => {
  let spectator: Spectator<EtlStepComponent>;

  const createComponent = createComponentFactory({
    component: EtlStepComponent,
    imports: [ReactiveFormsModule, SelectEtlListComponent, MeWizardComponent],
    mocks: [MeAzureGraphService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
