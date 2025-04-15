import {FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {
  booleanOperators,
  closeListOperators,
  numberOperators,
  stringArrayOperators,
  stringOperators,
} from 'deep-ui/shared/models';
import {getFakeQEAttributes} from 'deep-ui/shared/testing';

import {RuleComponent} from './rule.component';
import {RuleService} from './rule.service';

describe('RuleComponent', () => {
  let spectator: Spectator<RuleComponent>;
  const createComponent = createComponentFactory({
    component: RuleComponent,
    imports: [
      MeAutocompleteComponent,
      MatButtonModule,
      MatIconModule,
      MeInputComponent,
      MeSelectComponent,
      HintIconComponent,
      AutocompleteChipsComponent,
      MeFormControlChipsFieldComponent,
      ReactiveFormsModule,
    ],
    providers: [RuleService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.rulesGroup = new FormGroup<any>({});
    spectator.component.attributes = getFakeQEAttributes();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onAttributeChanged', () => {
    it('handle string attribute', () => {
      spectator.detectChanges();
      spectator.component.keyControl.setValue({
        name: 'temp',
        id: 'temp',
        entity: {
          columnType: 'string',
          values: null,
        },
      });
      // test clear
      spectator.component.operatorControl.setValue('equal');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onAttributeChanged();

      expect(spectator.component.operatorControl.value).toEqual('equal');
      expect(spectator.component.operatorOptions).toEqual(stringOperators);
      expect(spectator.component.valueComponentType).toBe('string');
      expect(spectator.component.valueControl.value).toEqual(null);
      expect(spectator.component.valueOptions).toEqual([]);
    });

    it('handle boolean attribute', () => {
      spectator.detectChanges();
      spectator.component.keyControl.setValue({
        name: 'temp',
        id: 'temp',
        entity: {
          columnType: 'boolean',
          values: null,
        },
      });
      // test clear
      spectator.component.operatorControl.setValue('equal');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onAttributeChanged();

      expect(spectator.component.operatorControl.value).toEqual('equal');
      expect(spectator.component.operatorOptions).toEqual(booleanOperators);
      expect(spectator.component.valueComponentType).toBe('boolean');
      expect(spectator.component.valueControl.value).toEqual(null);
      expect(spectator.component.valueOptions).toEqual([
        {id: 'true', value: 'True'},
        {id: 'false', value: 'False'},
      ]);
    });

    it('handle double attribute', () => {
      spectator.detectChanges();
      spectator.component.keyControl.setValue({
        name: 'temp',
        id: 'temp',
        entity: {
          columnType: 'double',
          values: null,
        },
      });
      // test clear
      spectator.component.operatorControl.setValue('equal');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onAttributeChanged();

      expect(spectator.component.operatorControl.value).toEqual('equal');
      expect(spectator.component.operatorOptions).toEqual(numberOperators);
      expect(spectator.component.valueComponentType).toBe('double');
      expect(spectator.component.valueControl.value).toEqual(null);
      expect(spectator.component.valueOptions).toEqual([]);
    });

    it('handle integer attribute', () => {
      spectator.detectChanges();
      spectator.component.keyControl.setValue({
        name: 'temp',
        id: 'temp',
        entity: {
          columnType: 'integer',
          values: null,
        },
      });
      // test clear
      spectator.component.operatorControl.setValue('equal');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onAttributeChanged();

      spectator.detectChanges();

      expect(spectator.component.operatorControl.value).toEqual('equal');
      expect(spectator.component.operatorOptions).toEqual(numberOperators);
      expect(spectator.component.valueComponentType).toBe('integer');
      expect(spectator.component.valueControl.value).toEqual(null);
      expect(spectator.component.valueOptions).toEqual([]);
    });

    it('handle columnType string with array of values attribute', () => {
      spectator.detectChanges();
      spectator.component.keyControl.setValue({
        name: 'temp',
        id: 'temp',
        entity: {
          columnType: 'string',
          values: ['value1', 'value2'],
        },
      });
      // test clear
      spectator.component.operatorControl.setValue('equal');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onAttributeChanged();

      spectator.detectChanges();

      expect(spectator.component.operatorControl.value).toEqual('equal');
      expect(spectator.component.operatorOptions).toEqual(closeListOperators);
      expect(spectator.component.valueComponentType).toBe('autocomplete');
      expect(spectator.component.valueControl.value).toEqual(null);
      expect(spectator.component.valueOptions).toEqual(['value1', 'value2']);
    });

    it('handle string array attribute', () => {
      spectator.detectChanges();
      spectator.component.keyControl.setValue({
        name: 'temp',
        id: 'temp',
        entity: {
          columnType: 'array<string>',
          values: ['value1', 'value2'],
        },
      });
      // test clear
      spectator.component.operatorControl.setValue('contains');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onAttributeChanged();

      spectator.detectChanges();

      expect(spectator.component.operatorControl.value).toEqual('contains');
      expect(spectator.component.operatorOptions).toEqual(stringArrayOperators);
      expect(spectator.component.valueComponentType).toBe('array<string>');
      expect(spectator.component.valueControl.value).toEqual(null);
      expect(spectator.component.valueOptions).toEqual(['value1', 'value2']);
    });
  });

  describe('onOperatorChanged', () => {
    it('handle null operator, should remove validation', () => {
      spectator.detectChanges();
      spectator.component.operatorControl.setValue('is_null');
      // test clear
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onOperatorChanged();

      expect(
        spectator.component.rulesGroup.get('value').hasValidator(Validators.required)
      ).toBeFalse();
    });

    it('handle not null operator, should add required validation', () => {
      spectator.detectChanges();
      // test clear
      spectator.component.operatorControl.setValue('in');
      spectator.component.valueControl.setValue('bla');
      spectator.detectChanges();

      spectator.component.onOperatorChanged();

      expect(
        spectator.component.rulesGroup.get('value').hasValidator(Validators.required)
      ).toBeTruthy();
    });
  });
});
