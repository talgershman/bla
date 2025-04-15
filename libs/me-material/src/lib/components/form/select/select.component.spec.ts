import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MeControlErrorMsgComponent} from '@mobileye/material/src/lib/components/form/control-error-msg';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeSelectComponent} from './select.component';

describe('MeSelectComponent', () => {
  let spectator: Spectator<MeSelectComponent>;

  const createComponent = createComponentFactory({
    component: MeSelectComponent,
    imports: [
      MatSelectModule,
      MatButtonModule,
      MeTooltipDirective,
      ReactiveFormsModule,
      MatIconModule,
      MeControlErrorMsgComponent,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.innerController = new FormControl(null);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
