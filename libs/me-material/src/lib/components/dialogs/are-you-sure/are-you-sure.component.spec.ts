import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAreYouSureDialogComponent} from './are-you-sure.component';

describe('MeAreYouSureDialogComponent', () => {
  let spectator: Spectator<MeAreYouSureDialogComponent>;

  const createComponent = createComponentFactory({
    component: MeAreYouSureDialogComponent,
    imports: [MatButtonModule, MatDialogModule],
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
