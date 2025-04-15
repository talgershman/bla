import {MatFormFieldModule} from '@angular/material/form-field';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe/safe.pipe';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeErrorFeedbackComponent} from './error-feedback.component';

describe('MeErrorFeedbackComponent', () => {
  let spectator: Spectator<MeErrorFeedbackComponent>;

  const createComponent = createComponentFactory({
    component: MeErrorFeedbackComponent,
    imports: [MatFormFieldModule, MeSafePipe],
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
