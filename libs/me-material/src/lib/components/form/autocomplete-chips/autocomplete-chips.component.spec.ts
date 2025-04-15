import {AsyncPipe} from '@angular/common';
import {fakeAsync, flush, tick} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeHighlightTextDirective} from '@mobileye/material/src/lib/directives/highlight-text';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {AutocompleteChipsComponent} from './autocomplete-chips.component';

describe('AutocompleteChipsComponent', () => {
  let spectator: Spectator<AutocompleteChipsComponent>;

  const createComponent = createComponentFactory({
    component: AutocompleteChipsComponent,
    imports: [
      MatFormFieldModule,
      MatChipsModule,
      MeTooltipDirective,
      MatIconModule,
      MatInputModule,
      ReactiveFormsModule,
      MatAutocompleteModule,
      MatOptionModule,
      MeHighlightTextDirective,
      AsyncPipe,
    ],
    mocks: [MeSnackbarService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.innerController = new FormControl<any>([]);
    spectator.component.placeholder = 'select';
    spectator.component.originalOptions = ['option1', 'option2', 'option3'];
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('add method', () => {
    it('should add chips on calling add method with a valid input', fakeAsync(async () => {
      spectator.detectChanges();
      tick(150);
      flush();
      await spectator.fixture.whenStable();

      const inputValue = 'option2';
      const event = {value: inputValue} as MatChipInputEvent;
      spectator.component.inputCtrl.setValue(inputValue);
      spectator.component.inputElem.nativeElement.value = event.value;
      spectator.detectChanges();
      spectator.component.add(event);

      tick(150);
      flush();

      expect(spectator.component.innerController.value.length).toBe(1);
      expect(spectator.component.innerController.value[0]).toBe(inputValue);
    }));

    it('should not add chips on calling add method with an empty input', fakeAsync(() => {
      spectator.detectChanges();
      const initialChipsLength = spectator.component.innerController.value.length;
      const event = {value: ''} as MatChipInputEvent;
      spectator.component.inputCtrl.setValue('');
      spectator.component.inputElem.nativeElement.value = event.value;
      spectator.detectChanges();
      spectator.component.add(event);

      tick(150);
      flush();

      expect(spectator.component.innerController.value.length).toBe(initialChipsLength);
    }));

    it('should add multiple chips when input has multiple values separated by semi-colon', fakeAsync(() => {
      spectator.detectChanges();
      const multipleValues = 'option1;option2;option3';
      const valuesArray = multipleValues.split(';');
      const event = {value: multipleValues} as MatChipInputEvent;
      spectator.component.inputCtrl.setValue(multipleValues);
      spectator.component.inputElem.nativeElement.value = event.value;
      spectator.detectChanges();
      spectator.component.add(event);

      tick(150);
      flush();

      expect(spectator.component.innerController.value.length).toBe(valuesArray.length);
      expect(spectator.component.innerController.value).toEqual(valuesArray);
    }));

    it('should not add duplicate chips when input has multiple values with duplicates', fakeAsync(() => {
      spectator.detectChanges();
      const existingChipValue = 'option3';
      const multipleValues = `option1;${existingChipValue};option2;${existingChipValue}`;
      const uniqueValuesArray = [existingChipValue, 'option1', 'option2'];
      const event = {value: multipleValues} as MatChipInputEvent;
      spectator.component.innerController = new FormControl([existingChipValue]);
      spectator.component.inputCtrl.setValue(multipleValues);
      spectator.component.inputElem.nativeElement.value = event.value;
      spectator.detectChanges();
      spectator.component.add(event);

      tick(150);
      flush();

      expect(spectator.component.innerController.value.length).toBe(uniqueValuesArray.length);
      expect(spectator.component.innerController.value).toEqual(uniqueValuesArray);
    }));
  });
});
