import {IFilterParams} from '@ag-grid-community/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgMultiChipsFilterComponent} from './ag-multi-chips-filter.component';

describe('MeAgMultiChipsFilterComponent', () => {
  let spectator: Spectator<MeAgMultiChipsFilterComponent>;
  const createComponent = createComponentFactory({
    component: MeAgMultiChipsFilterComponent,
    imports: [
      MatFormFieldModule,
      ReactiveFormsModule,
      MatButtonModule,
      MeFormControlChipsFieldComponent,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should initialize form and formGroup', () => {
    spectator.detectChanges();

    expect(spectator.component.chipControl).toBeInstanceOf(FormControl);
    expect(spectator.component.formGroup).toBeInstanceOf(FormGroup);
    expect(spectator.component.formGroup.controls.chipControl).toBe(
      spectator.component.chipControl,
    );
  });

  it('should set placeholder from params', () => {
    spectator.detectChanges();
    const filterParams = {filterPlaceholder: 'Test Placeholder'};
    const params = {colDef: {field: 'testField', filterParams}} as unknown as IFilterParams;
    spectator.component.agInit(params);

    expect(spectator.component.placeholder).toEqual(filterParams.filterPlaceholder);
  });
});
