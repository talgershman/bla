import {CdkStepperModule} from '@angular/cdk/stepper';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {StepperContainerComponent} from './stepper-container.component';

describe('StepperContainerComponent', () => {
  let spectator: Spectator<StepperContainerComponent>;

  const createComponent = createComponentFactory({
    component: StepperContainerComponent,
    imports: [CdkStepperModule],
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
