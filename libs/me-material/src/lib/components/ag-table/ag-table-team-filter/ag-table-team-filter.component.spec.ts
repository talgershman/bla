import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgTableTeamFilterComponent} from './ag-table-team-filter.component';

describe('MeAgTableTeamFilterComponent', () => {
  let spectator: Spectator<MeAgTableTeamFilterComponent>;

  const createComponent = createComponentFactory({
    component: MeAgTableTeamFilterComponent,
    imports: [MatMenuModule, MatButtonModule, MatIconModule, MeTooltipDirective],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
