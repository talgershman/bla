import {NgStyle} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeSearchInput} from './search-input.component';

describe('MeSearchInput', () => {
  let spectator: Spectator<MeSearchInput>;

  const createComponent = createComponentFactory({
    component: MeSearchInput,
    imports: [
      MatFormFieldModule,
      MatInputModule,
      ReactiveFormsModule,
      MatIconModule,
      MatIconButton,
      NgStyle,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.setInput('controller', new FormControl(''));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
