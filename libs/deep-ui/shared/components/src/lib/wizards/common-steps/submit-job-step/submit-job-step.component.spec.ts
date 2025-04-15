import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {SubmitJobFeedbackComponent} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';

import {SubmitJobStepComponent} from './submit-job-step.component';

describe('SubmitJobStepComponent', () => {
  let spectator: Spectator<SubmitJobStepComponent>;

  const createComponent = createComponentFactory({
    component: SubmitJobStepComponent,
    imports: [SubmitJobFeedbackComponent, MeWizardComponent, MatButtonModule, MatDialogModule],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
