import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeTourStepComponent} from './tour-step.component';

describe('MeTourStepComponent', () => {
  let spectator: Spectator<MeTourStepComponent>;

  const createComponent = createComponentFactory({
    component: MeTourStepComponent,
    imports: [MatButtonModule, MatIconModule, MeSafePipe],
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
