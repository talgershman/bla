import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeDialogContainerComponent} from './dialog-container.component';

describe('MeDialogContainerComponent', () => {
  let spectator: Spectator<MeDialogContainerComponent>;

  const createComponent = createComponentFactory({
    component: MeDialogContainerComponent,
    imports: [MatIconModule, MatIconTestingModule, MatDialogModule, MatButtonModule],
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
