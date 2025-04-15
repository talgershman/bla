import {AsyncPipe} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeDisableControlDirective} from '@mobileye/material/src/lib/directives/disable-control';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {NgxMaskDirective, provideEnvironmentNgxMask} from 'ngx-mask';

import {MeInputComponent} from './input.component';

describe('MeInputComponent', () => {
  let spectator: Spectator<MeInputComponent>;

  const createComponent = createComponentFactory({
    component: MeInputComponent,
    imports: [
      HintIconComponent,
      MatFormFieldModule,
      MatInputModule,
      NgxMaskDirective,
      ReactiveFormsModule,
      MeDisableControlDirective,
      MatIconModule,
      AsyncPipe,
    ],
    providers: [provideEnvironmentNgxMask()],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.innerController = new FormControl('');
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
