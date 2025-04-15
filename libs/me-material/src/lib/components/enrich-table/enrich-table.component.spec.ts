import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeEnrichTableComponent} from './enrich-table.component';

describe('MeEnrichTableComponent', () => {
  let spectator: Spectator<MeEnrichTableComponent>;

  const createComponent = createComponentFactory({
    component: MeEnrichTableComponent,
    imports: [MatIconTestingModule, MatIconModule, MatButtonModule, MeTooltipDirective],
    mocks: [MeSnackbarService],
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
