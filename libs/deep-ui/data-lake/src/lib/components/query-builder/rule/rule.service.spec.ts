import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {
  booleanOperators,
  closeListOperators,
  numberOperators,
  QEAttribute,
  QERule,
  QERuleTypes,
  stringArrayOperators,
  stringOperators,
} from 'deep-ui/shared/models';
import {getFakeQEAttributes} from 'deep-ui/shared/testing';

import {RuleService} from './rule.service';

describe('RuleService', () => {
  let spectator: SpectatorService<RuleService>;
  const createService = createServiceFactory(RuleService);
  let service: RuleService;
  const invalidRule: QERule = {
    key: 'some-key',
    type: 'string',
    operator: 'equal',
    value: null,
  };
  const invalidArrRule: QERule = {
    key: 'some-key',
    type: 'string',
    operator: 'equal',
    value: ['value1', 'value2'],
  };
  const fakeAttributes: Array<QEAttribute> = getFakeQEAttributes();
  const validRule: QERule = {
    key: fakeAttributes[0].columnName,
    type: fakeAttributes[0].columnType as QERuleTypes,
    operator: 'equal',
    value: null,
  };
  const invalidAttributes: Array<QEAttribute> = [
    {
      ...fakeAttributes[0],
      columnName: 'invalid-key',
    },
  ];

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(RuleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getInvalidAttributes', () => {
    it('no rule - return empty', () => {
      const invalidAttributes1 = service.getInvalidAttributes(null, fakeAttributes);

      expect(invalidAttributes1).toEqual([]);
    });

    it('with valid rule - return empty', () => {
      const invalidAttributes1 = service.getInvalidAttributes(validRule, fakeAttributes);

      expect(invalidAttributes1).toEqual([]);
    });

    it('invalid rule - return invalid', () => {
      const invalidAttributes1 = service.getInvalidAttributes(invalidRule, fakeAttributes);

      expect(invalidAttributes1).toEqual([
        {
          columnName: invalidRule.key,
          columnType: invalidRule.type,
          values: null,
        },
      ]);
    });

    it('invalid arr rule - return invalid', () => {
      const invalidAttributes1 = service.getInvalidAttributes(invalidArrRule, fakeAttributes);

      expect(invalidAttributes1).toEqual([
        {
          columnName: invalidArrRule.key,
          columnType: invalidArrRule.type,
          values: invalidArrRule.value as any,
        },
      ]);
    });
  });

  describe('getSerializeForm', () => {
    const formValue = {
      key: {
        id: 'id1',
      },
      type: 'string',
      operator: 'equal',
      value: {
        id: 'value1',
      },
    };
    it('rule invalid , should return null', () => {
      const controlsRulesGroup = new FormGroup({
        fakeKey: new FormControl<MeAutoCompleteOption>(null, Validators.required),
      });
      const data = service.getSerializeForm(controlsRulesGroup, formValue);

      expect(data).toEqual({
        key: null,
        operator: null,
        value: null,
        type: null,
      });
    });

    it('rule value , should return values', () => {
      const controlsRulesGroup = new FormGroup({
        fakeKey: new FormControl<MeAutoCompleteOption>(
          {id: 'stam', name: 'stam'},
          Validators.required
        ),
      });
      const data = service.getSerializeForm(controlsRulesGroup, formValue);

      expect(data).toEqual({
        key: 'id1',
        operator: 'equal',
        value: 'value1',
        type: 'string',
      });
    });
  });

  describe('getInvalidRuleValues', () => {
    it('no rule, return empty', () => {
      const arr = service.getInvalidRuleValues(null, fakeAttributes);

      expect(arr).toEqual([]);
    });

    it('rule valid, return empty', () => {
      const arr = service.getInvalidRuleValues(validRule, fakeAttributes);

      expect(arr).toEqual([]);
    });

    it('rule invalid, return invalid values', () => {
      const rule: QERule = {
        key: fakeAttributes[1].columnName,
        type: fakeAttributes[1].columnType as QERuleTypes,
        operator: 'equal',
        value: [...fakeAttributes[1].values, ...['invalid1']],
      };
      const arr = service.getInvalidRuleValues(rule, fakeAttributes);

      expect(arr).toEqual(['invalid1']);
    });
  });

  describe('getOperatorOptions', () => {
    it('should return integer options', () => {
      const options = service.getOperatorOptions(fakeAttributes[2]);

      expect(options).toEqual(numberOperators);
    });

    it('should return boolean options', () => {
      const options = service.getOperatorOptions(fakeAttributes[3]);

      expect(options).toEqual(booleanOperators);
    });

    it('should return string options', () => {
      const options = service.getOperatorOptions(fakeAttributes[0]);

      expect(options).toEqual(stringOperators);
    });

    it('should return float options', () => {
      const options = service.getOperatorOptions(fakeAttributes[4]);

      expect(options).toEqual(numberOperators);
    });

    it('should return closed list options', () => {
      const options = service.getOperatorOptions(fakeAttributes[1]);

      expect(options).toEqual(closeListOperators);
    });

    it('should return string array options', () => {
      const options = service.getOperatorOptions(fakeAttributes[5]);

      expect(options).toEqual(stringArrayOperators);
    });
  });

  describe('customValidatorValueControl', () => {
    let group: FormGroup;

    beforeEach(() => {
      group = new FormGroup({
        test: new FormControl(null),
        key: new FormControl({
          entity: {
            values: ['value1', 'value2'],
          },
        }),
      });
    });

    it('no value, return empty', () => {
      const validation = service.customValidatorValueControl(group.controls.test);

      expect(validation).toEqual(null);
    });

    it('should be valid', () => {
      group.controls.test.setValue(['value1']);
      const validation = service.customValidatorValueControl(group.controls.test);

      expect(validation).toEqual(null);
    });

    it('should return invalid', () => {
      group.controls.test.setValue(['invalid']);
      const validation = service.customValidatorValueControl(group.controls.test);

      expect(validation).toEqual({invalid: true});
    });

    it('should return valid , attribute value is not array', () => {
      group.controls.key.setValue({
        entity: {
          values: null,
        },
      });
      const validation = service.customValidatorValueControl(group.controls.test);

      expect(validation).toEqual(null);
    });
  });

  describe('getAttributeOptions', () => {
    it('should return concat array of invalid and valid attributes', () => {
      const arr = service.getAttributeOptions(fakeAttributes, invalidAttributes);

      expect(arr.length).toEqual(fakeAttributes.length + invalidAttributes.length);
    });
  });

  describe('getValueComponentType', () => {
    it('should return null operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'boolean',
        },
      });
      const operatorControl = new FormControl('is_null');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('null');
    });

    it('should return list operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'string',
          values: ['value1', 'value2'],
        },
      });
      const operatorControl = new FormControl('in');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('list');
    });

    it('should return autocomplete operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'string',
          values: ['value1', 'value2'],
        },
      });
      const operatorControl = new FormControl<string>('equal');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('autocomplete');
    });

    it('should return free-list operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'string',
        },
      });
      const operatorControl = new FormControl('not_in');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('free-list');
    });

    it('should return key type operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'boolean',
        },
      });
      const operatorControl = new FormControl('equal');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('boolean');
    });

    it('should return string operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
      });
      const operatorControl = new FormControl('equal');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('string');
    });

    it('should return string array operator', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'array<string>',
          values: ['value1', 'value2'],
        },
      });
      const operatorControl = new FormControl('contains');

      const type = service.getValueComponentType(fakeKeyControl, operatorControl);

      expect(type).toBe('array<string>');
    });
  });

  describe('loadValueControl', () => {
    let valueControl;
    let arrValueControl;
    beforeEach(() => {
      valueControl = new FormControl(null);
      arrValueControl = new FormControl([]);
    });

    it('no value, should not set', () => {
      spyOn(valueControl, 'setValue');

      service.loadValueControl(null, valueControl, null, null);

      expect(valueControl.setValue).not.toHaveBeenCalled();
    });

    it('array value, should set arrayValueControl', () => {
      service.loadValueControl(null, valueControl, arrValueControl, ['value1', 'value2']);

      expect(arrValueControl.value.length).toEqual(2);
    });

    it('single value, key value is array type', () => {
      const keyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          values: ['value1', 'value2'],
        },
      });
      service.loadValueControl(keyControl, valueControl, arrValueControl, 'value1');

      expect(valueControl.value).toEqual({
        id: 'value1',
        name: 'value1',
      });
    });

    it('single value, value is zero', () => {
      const keyControl = new FormControl<MeAutoCompleteOption>(null);
      service.loadValueControl(keyControl, valueControl, arrValueControl, 0);

      expect(valueControl.value).toEqual(0);
    });

    it('array value, key value is array type', () => {
      const arrValueControl1 = new FormControl([]);
      const keyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          values: null,
        },
      });
      service.loadValueControl(keyControl, valueControl, arrValueControl1, 'value1');

      expect(valueControl.value).toEqual('value1');
    });
  });

  describe('getKeyControlType', () => {
    it('should be created', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          columnType: 'test',
        },
      });
      const type = service.getKeyControlType(fakeKeyControl);

      expect(type).toBe('test');
    });
  });

  describe('isCloseListKey', () => {
    it('should be created', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          values: ['value1'],
        },
      });
      const isClosedList = service.isCloseListKey(fakeKeyControl);

      expect(isClosedList).toBeTruthy();
    });
  });

  describe('getAttributeEntity', () => {
    it('should be created', () => {
      const fakeKeyControl = new FormControl<MeAutoCompleteOption>({
        id: 'key1',
        name: 'key1',
        entity: {
          test: true,
        },
      });
      const entity = service.getAttributeEntity(fakeKeyControl);

      expect(entity).toEqual({test: true} as any);
    });
  });
});
