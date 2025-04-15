import {FormControl} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgSelectFilterComponent} from './ag-select-filter.component';

describe('MeAgSelectFilterComponent', () => {
  let spectator: Spectator<MeAgSelectFilterComponent>;

  const createComponent = createComponentFactory({
    component: MeAgSelectFilterComponent,
    imports: [MatButtonModule, MeSelectComponent],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should initialize valueControl', () => {
    spectator.detectChanges();

    expect(spectator.component.valueControl).toBeInstanceOf(FormControl);
  });

  it('should initialize options', () => {
    spectator.detectChanges();
    // Set up mock data for params.colDef.filterParams.values
    const params = {colDef: {field: 'test', filterParams: {values: []}}};
    spectator.component.agInit(params as any);

    expect(spectator.component.options).toEqual([]);
  });

  it('should check if filter is active', () => {
    spectator.detectChanges();
    // Set a value for valueControl
    spectator.component.valueControl.setValue('test');

    expect(spectator.component.isFilterActive()).toBe(true);
  });

  it('should check if filter passes', () => {
    // Set up mock data for params and data
    const options = [{id: 'test1', value: 'test 1'}];
    const data = {test: 'test1'};
    const params = {
      data,
      colDef: {field: 'test', filterParams: {values: options}},
      filterChangedCallback: () => {},
    };

    spectator.detectChanges();

    spectator.component.valueControl.setValue(data.test);

    spectator.component.agInit(params as any);

    expect(spectator.component.doesFilterPass({data} as any)).toBe(true);
  });

  it('should get the model', () => {
    spectator.detectChanges();
    // Set a value for valueControl
    spectator.component.valueControl.setValue('test');

    expect(spectator.component.getModel()).toEqual({
      filterType: 'text',
      type: 'equals',
      filter: 'test',
    });
  });

  it('should set the model', () => {
    spectator.detectChanges();
    // Set a value for valueControl
    spectator.component.setModel({filter: 'test'});

    expect(spectator.component.valueControl.value).toBe('test');
  });

  it('should call filterChangedCallback on selection change', () => {
    spectator.detectChanges();
    const params = {colDef: {field: 'test'}, filterChangedCallback: () => {}};
    spectator.component.params = params as any;
    const spy = spyOn(spectator.component.params, 'filterChangedCallback');
    spectator.component.onSelectionChange();

    expect(spy).toHaveBeenCalled();
  });

  it('should clear the model and call filterChangedCallback on clear', () => {
    spectator.detectChanges();
    const params = {colDef: {field: 'test'}, filterChangedCallback: () => {}};
    spectator.component.params = params as any;
    const spy = spyOn(spectator.component.params, 'filterChangedCallback');
    spectator.component.valueControl.setValue('test');

    spectator.component.onClear();

    expect(spectator.component.valueControl.value).toBeUndefined();
    expect(spy).toHaveBeenCalled();
  });
});
