import {AsyncPipe} from '@angular/common';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {NgxMaskDirective} from 'ngx-mask';

import {MeFormControlChipsFieldComponent} from './chips.component';

describe('MeFormControlChipsFieldComponent', () => {
  let spectator: Spectator<MeFormControlChipsFieldComponent>;

  const createComponent = createComponentFactory({
    component: MeFormControlChipsFieldComponent,
    imports: [
      MatFormFieldModule,
      MatChipsModule,
      MatIconModule,
      MatInputModule,
      AsyncPipe,
      FormsModule,
      ReactiveFormsModule,
      NgxMaskDirective,
      MatAutocompleteModule,
      MeTooltipDirective,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.innerController = new FormControl<Array<string>>([]);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
