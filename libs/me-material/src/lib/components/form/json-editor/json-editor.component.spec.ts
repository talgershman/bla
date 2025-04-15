import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MeControlErrorMsgComponent} from '@mobileye/material/src/lib/components/form/control-error-msg';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeJsonEditorComponent} from './json-editor.component';

describe('MeJsonEditorComponent', () => {
  let spectator: Spectator<MeJsonEditorComponent>;

  const createComponent = createComponentFactory({
    component: MeJsonEditorComponent,
    imports: [ReactiveFormsModule, MeControlErrorMsgComponent, MatIconModule],
    providers: [{provide: NgControl, useValue: new FormControl()}],
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
