import {ReactiveFormsModule} from '@angular/forms';
import {MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {SelectParsingListComponent} from 'deep-ui/shared/components/src/lib/selection/select-parsing-list';

import {ParsingStepComponent} from './parsing-step.component';

describe('ParsingStepComponent', () => {
  let spectator: Spectator<ParsingStepComponent>;

  const createComponent = createComponentFactory({
    component: ParsingStepComponent,
    imports: [ReactiveFormsModule, MeWizardComponent, SelectParsingListComponent],
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
