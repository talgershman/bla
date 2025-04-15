import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgTableRefreshButtonComponent} from './ag-table-refresh-button.component';

describe('MeAgTableRefreshButtonComponent', () => {
  let spectator: Spectator<MeAgTableRefreshButtonComponent>;

  const createComponent = createComponentFactory({
    component: MeAgTableRefreshButtonComponent,
    imports: [MeTooltipDirective, MatButtonModule, MatIconModule],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
