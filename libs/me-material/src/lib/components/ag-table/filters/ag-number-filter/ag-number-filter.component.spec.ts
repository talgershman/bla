import {IFilterParams} from '@ag-grid-community/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {provideEnvironmentNgxMask} from 'ngx-mask';

import {MeAgNumberFilterComponent} from './ag-number-filter.component';

describe('MeAgNumberFilterComponent', () => {
  let spectator: Spectator<MeAgNumberFilterComponent>;
  let mockParams: IFilterParams;

  const createComponent = createComponentFactory({
    component: MeAgNumberFilterComponent,
    imports: [ReactiveFormsModule, MatButtonModule, MeInputComponent, MeSelectComponent],
    providers: [provideEnvironmentNgxMask()],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();

    mockParams = {
      colDef: {
        field: 'testField',
        filterParams: {
          filterOptions: [
            {displayKey: 'lessThanOrEqual', displayName: 'Max. clips'},
            {displayKey: 'greaterThanOrEqual', displayName: 'Min. clips'},
          ],
          buttons: ['clear'],
        },
      },
      filterChangedCallback: jasmine.createSpy('filterChangedCallback'),
    } as unknown as IFilterParams;

    spectator.component.agInit(mockParams);
  });

  it('should initialize with correct values', () => {
    expect(spectator.component.params).toBe(mockParams);
    expect(spectator.component.options.length).toBe(2);
    expect(spectator.component.operatorControl.value).toBe('lessThanOrEqual');
    expect(spectator.component.clearable).toBe(true);
  });

  it('should correctly determine if the filter is active', () => {
    expect(spectator.component.isFilterActive()).toBe(false);

    spectator.component.valueControl.setValue(11);

    expect(spectator.component.isFilterActive()).toBe(true);
  });

  it('should correctly pass filter conditions', () => {
    spectator.component.valueControl.setValue(55);
    spectator.component.operatorControl.setValue('lessThanOrEqual');

    const result = spectator.component.doesFilterPass({
      data: {testField: 55},
    } as any);

    expect(result).toBe(true);
  });

  it('should set and get the model correctly', () => {
    const model = {filterType: 'number', type: 'lessThanOrEqual', filter: 21};

    spectator.component.setModel(model);

    expect(spectator.component.getModel()).toEqual(model);
  });

  it('should call filterChangedCallback onBlurred', () => {
    spectator.component.onBlurred();

    expect(mockParams.filterChangedCallback).toHaveBeenCalled();
  });

  it('should clear the model when onClear is called', () => {
    spectator.component.valueControl.setValue(121);
    spectator.component.onClear();

    expect(spectator.component.valueControl.value).toBeFalsy();
    expect(spectator.component.operatorControl.value).toBeFalsy();
    expect(mockParams.filterChangedCallback).toHaveBeenCalled();
  });
});
