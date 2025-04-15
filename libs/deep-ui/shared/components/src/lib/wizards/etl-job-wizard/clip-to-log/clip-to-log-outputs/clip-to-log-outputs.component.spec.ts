import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {ClipToLogOutputsComponent} from './clip-to-log-outputs.component';

describe('ClipToLogOutputsComponent', () => {
  let spectator: Spectator<ClipToLogOutputsComponent>;
  const createComponent = createComponentFactory({
    component: ClipToLogOutputsComponent,
    imports: [
      ReactiveFormsModule,
      MatButtonModule,
      MatIconModule,
      MeInputComponent,
      MeControlListComponent,
      BrowserAnimationsModule,
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
