import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {HintIconComponent} from './hint-icon.component';

describe('HintIconComponent', () => {
  let spectator: Spectator<HintIconComponent>;
  const createComponent = createComponentFactory({
    component: HintIconComponent,
    imports: [MatIconModule, MeTooltipDirective],
    detectChanges: false,
  });

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
