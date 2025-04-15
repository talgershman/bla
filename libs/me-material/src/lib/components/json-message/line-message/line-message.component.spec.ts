import {AsyncPipe, NgClass, NgTemplateOutlet} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MeJsonMessageService} from '@mobileye/material/src/lib/components/json-message/json-message.service';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {NgxMaskPipe} from 'ngx-mask';

import {MeLineMessageComponent} from './line-message.component';

describe('MeJsonMessageComponent', () => {
  let spectator: Spectator<MeLineMessageComponent>;

  const createComponent = createComponentFactory({
    component: MeLineMessageComponent,
    imports: [
      AsyncPipe,
      MeTooltipDirective,
      NgxMaskPipe,
      NgClass,
      MatFormFieldModule,
      MatMenuModule,
      NgTemplateOutlet,
      MatButtonModule,
      MatDialogModule,
      MatIconModule,
      MeSafePipe,
    ],
    providers: [MeJsonMessageService, MeSnackbarService, MatSnackBar],
    mocks: [],
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
