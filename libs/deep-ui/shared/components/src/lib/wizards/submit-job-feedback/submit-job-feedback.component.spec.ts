import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {RouterModule} from '@angular/router';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {SubmitJobFeedbackComponent} from './submit-job-feedback.component';

describe('SubmitJobFeedbackComponent', () => {
  let spectator: Spectator<SubmitJobFeedbackComponent>;

  const createComponent = createComponentFactory({
    component: SubmitJobFeedbackComponent,
    imports: [RouterModule, MeErrorFeedbackComponent, MatFormFieldModule, MatDialogModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
