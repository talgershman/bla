import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {AdminSettingsDialogComponent} from './admin-settings-dialog.component';

describe('AdminSettingsDialogComponent', () => {
  let spectator: Spectator<AdminSettingsDialogComponent>;

  const createComponent = createComponentFactory({
    component: AdminSettingsDialogComponent,
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatIconModule,
      MeFormControlChipsFieldComponent,
      ReactiveFormsModule,
    ],
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
