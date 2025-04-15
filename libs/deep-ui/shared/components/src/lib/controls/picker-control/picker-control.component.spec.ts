import {Component, TemplateRef, ViewChild} from '@angular/core';
import {AbstractControl, FormControl, Validators} from '@angular/forms';
import {MeControlErrorMsgComponent} from '@mobileye/material/src/lib/components/form/control-error-msg';
import {MePickerComponent, PickerHostService} from '@mobileye/material/src/lib/components/picker';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import createSpy = jasmine.createSpy;
import createSpyObj = jasmine.createSpyObj;

import {PickerControlComponent} from './picker-control.component';

@Component({
  selector: 'app-mock-2',
  template: `<ng-template #dialogContent>
    <div>Dialog Content</div>
  </ng-template>`,
  standalone: false,
})
class MockComponent {
  @ViewChild('dialogContent', {static: true}) dialogContent!: TemplateRef<any>;
}

describe('PickerControlComponent', () => {
  let spectator: Spectator<PickerControlComponent<any>>;
  let mockComponent: MockComponent;
  let control: AbstractControl;

  const mockNgControl = createSpyObj('NgControl', ['control']);
  mockNgControl.control = new FormControl(null, {validators: Validators.required});
  mockNgControl.valueAccessor = null;

  const createComponent = createComponentFactory({
    component: PickerControlComponent,
    imports: [MePickerComponent, MeControlErrorMsgComponent],
    mocks: [mockNgControl],
    providers: [PickerHostService],
    detectChanges: false,
  });

  const createMock = createComponentFactory({
    component: MockComponent,
    detectChanges: false,
  });

  beforeAll(() => {
    const mockSpectator = createMock();
    mockComponent = mockSpectator.component;
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.ngControl = mockNgControl;
    spectator.setInput('dialogTemplate', mockComponent.dialogContent);
    control = spectator.component.control;
    spectator.setInput('idKey', 'id');
    spectator.setInput('nameKey', 'name');
    spectator.setInput('groupKey', 'group');
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should set validators on ngControl', () => {
    spyOn(spectator.component, 'validate').and.callThrough();
    spectator.detectChanges();

    expect(control.validator).toBeDefined();
  });

  it('should register onChange', () => {
    const onChange = createSpy('onChange');
    spectator.component.registerOnChange(onChange);
    spectator.component._onChange('newValue');

    expect(onChange).toHaveBeenCalledWith('newValue');
  });

  it('should register onTouched', () => {
    const onTouched = createSpy('onTouched');
    spectator.component.registerOnTouched(onTouched);
    spectator.component._onTouched();

    expect(onTouched).toHaveBeenCalled();
  });
});
