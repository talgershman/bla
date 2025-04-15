import {TextFieldModule} from '@angular/cdk/text-field';
import {AsyncPipe} from '@angular/common';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeTextareaComponent} from './textarea.component';

describe('MeTextareaComponent', () => {
  let spectator: Spectator<MeTextareaComponent>;

  const createComponent = createComponentFactory({
    component: MeTextareaComponent,
    imports: [
      MatFormFieldModule,
      MatInputModule,
      TextFieldModule,
      FormsModule,
      ReactiveFormsModule,
      AsyncPipe,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.innerController = new FormControl<string>('');
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
