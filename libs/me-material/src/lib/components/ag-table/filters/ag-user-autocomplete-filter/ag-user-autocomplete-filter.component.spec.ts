import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgUserAutocompleteFilterComponent} from './ag-user-autocomplete-filter.component';

describe('MeAgUserAutocompleteFilterComponent', () => {
  let spectator: Spectator<MeAgUserAutocompleteFilterComponent>;

  const createComponent = createComponentFactory({
    component: MeAgUserAutocompleteFilterComponent,
    imports: [
      ReactiveFormsModule,
      MatButtonModule,
      MatInputModule,
      MatIconModule,
      MatAutocompleteModule,
      MatFormFieldModule,
      MeHighlightTextDirective,
    ],
    providers: [],
    mocks: [MeAzureGraphService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
