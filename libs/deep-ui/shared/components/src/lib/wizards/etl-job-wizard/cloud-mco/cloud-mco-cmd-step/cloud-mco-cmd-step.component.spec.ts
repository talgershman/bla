import {ReactiveFormsModule} from '@angular/forms';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {CloudMcoCmdStepComponent} from './cloud-mco-cmd-step.component';

describe('ClipToLogOutputsComponent', () => {
  let spectator: Spectator<CloudMcoCmdStepComponent>;
  const createComponent = createComponentFactory({
    component: CloudMcoCmdStepComponent,
    imports: [MeTextareaComponent, ReactiveFormsModule],
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
