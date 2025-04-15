import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatInputModule} from '@angular/material/input';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeUserControlComponent} from './user-control.component';

describe('MeUserControlComponent', () => {
  let spectator: Spectator<MeUserControlComponent>;

  const createComponent = createComponentFactory({
    component: MeUserControlComponent,
    imports: [
      MatFormFieldModule,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      ReactiveFormsModule,
      MatInputModule,
      MatAutocompleteModule,
      MeHighlightTextDirective,
    ],
    mocks: [MeAzureGraphService],
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
