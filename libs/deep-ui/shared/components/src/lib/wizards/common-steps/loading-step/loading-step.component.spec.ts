import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {LoadingStepComponent} from './loading-step.component';

describe('LoadingStepComponent', () => {
  let spectator: Spectator<LoadingStepComponent>;

  const createComponent = createComponentFactory({
    component: LoadingStepComponent,
    imports: [MatProgressSpinnerModule],
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
