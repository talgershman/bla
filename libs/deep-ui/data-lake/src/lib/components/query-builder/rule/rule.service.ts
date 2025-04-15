import {Injectable} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors} from '@angular/forms';
import {MeAutoCompleteOption} from '@mobileye/material/src/lib/components/form/autocomplete';
import {
  ALLOW_QUERY_COLUMN_TYPE_ATTRIBUTES,
  arrayOperators,
  booleanOperators,
  closeListOperators,
  commonOperators,
  nullOperators,
  numberOperators,
  QEAttribute,
  QERule,
  stringArrayOperators,
  stringOperators,
  ValueComponentType,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _camelCase from 'lodash-es/camelCase';
import _find from 'lodash-es/find';
import _isArray from 'lodash-es/isArray';
import _sortBy from 'lodash-es/sortBy';
import _startCase from 'lodash-es/startCase';
import _xor from 'lodash-es/xor';

@Injectable()
export class RuleService {
  @memoize()
  isCommonOperator(operatorValue: any): boolean {
    return commonOperators.map((item) => item.id).includes(operatorValue);
  }

  @memoize()
  isListOperator(operatorValue: any): boolean {
    return arrayOperators.map((item) => item.id).includes(operatorValue);
  }

  @memoize()
  isNullOperator(operatorValue: any): boolean {
    return nullOperators.map((item) => item.id).includes(operatorValue);
  }

  getInvalidAttributes(rule: QERule, attributes: Array<QEAttribute>): Array<QEAttribute> {
    if (!rule) {
      return [];
    }
    const key = rule.key;
    const found = _find(attributes, (attr: QEAttribute) => attr.columnName === key);
    if (found && found.columnType !== rule.type) {
      rule.key = `${rule.key}_invalid_type_changed`;
    } else if (found) {
      return [];
    }
    const values: Array<string> =
      rule.value && _isArray(rule.value) ? (rule.value as Array<string>) : null;
    return [
      {
        columnName: rule.key,
        columnType: rule.type,
        values,
      },
    ];
  }

  getSerializeForm(controlsRulesGroup: FormGroup<any>, formValue: any): any {
    if (controlsRulesGroup.invalid) {
      return {
        key: null,
        operator: null,
        value: null,
        type: null,
      };
    }
    let value = formValue?.value;
    if (formValue?.arrValue?.length) {
      value = formValue?.arrValue;
    } else if (formValue?.value && formValue?.value?.id) {
      value = formValue?.value?.id;
    }
    return {
      key: formValue?.key?.id ?? null,
      operator: formValue?.operator ?? null,
      value: value && !_isArray(value) ? value.toString() : (value ?? null),
      type: formValue?.type ?? null,
    };
  }

  getInvalidRuleValues(rule: QERule, attributes: Array<QEAttribute>): Array<string> {
    if (!rule || !rule.value) {
      return [];
    }
    const ruleValue = rule.value;
    const found = _find(attributes, {columnName: rule.key});
    if (_isArray(found?.values)) {
      const ruleValueArr = _isArray(ruleValue) ? ruleValue : [ruleValue];
      const invalidValues = _xor(found.values, ruleValueArr);
      if (invalidValues?.length) {
        return invalidValues;
      }
    }
    return [];
  }

  getOperatorOptions(attr: QEAttribute): Array<any> {
    let operatorOptions = [];
    switch (attr?.columnType) {
      case 'integer': {
        operatorOptions = numberOperators;
        break;
      }
      case 'boolean': {
        operatorOptions = booleanOperators;
        break;
      }
      case 'double': {
        operatorOptions = numberOperators;
        break;
      }
      case 'string': {
        operatorOptions = stringOperators;
        const isClosedList = attr?.values?.length;
        if (isClosedList) {
          operatorOptions = closeListOperators;
        }
        break;
      }
      case 'array<string>': {
        operatorOptions = stringArrayOperators;
        break;
      }
      default:
        operatorOptions = [];
    }
    return operatorOptions;
  }

  customValidatorValueControl(control: AbstractControl): ValidationErrors {
    const value = control.value;
    if (!value) {
      return null;
    }
    let arrValue = value;
    if (!_isArray(value)) {
      arrValue = [value];
    }
    if (!arrValue || !arrValue.length) {
      return null;
    }
    const keyControl = control?.parent?.get('key');
    const keyValues = keyControl?.value?.entity?.values;
    if (!keyValues) {
      return null;
    }
    const possibleValues = keyValues.map((item) => item.id || item);
    if (!possibleValues.length) {
      return null;
    }
    let isValid = true;
    for (const item of arrValue) {
      const itemValue = item?.id || item;
      if (!possibleValues.includes(itemValue)) {
        isValid = false;
        break;
      }
    }
    if (!isValid) {
      return {invalid: true};
    }
    return null;
  }

  getAttributeOptions(
    attributes: Array<QEAttribute>,
    invalidAttributes: Array<QEAttribute>,
  ): Array<MeAutoCompleteOption> {
    const arr: Array<MeAutoCompleteOption> = [];
    for (const attribute of attributes) {
      // boolean values can be : ['null', 'true', 'false'], we need to ignore them so we can render our own values
      if (attribute.columnType === 'boolean') {
        attribute.values = null;
      }
      const option: MeAutoCompleteOption = {
        name: _startCase(_camelCase(attribute.columnName)),
        id: attribute.columnName,
        disabled: !ALLOW_QUERY_COLUMN_TYPE_ATTRIBUTES.has(attribute.columnType),
        tooltip: !ALLOW_QUERY_COLUMN_TYPE_ATTRIBUTES.has(attribute.columnType)
          ? 'This attribute is not allowed for query'
          : '',
        entity: attribute,
      };
      arr.push(option);
    }
    for (const item of invalidAttributes) {
      const option: MeAutoCompleteOption = {
        name: _startCase(_camelCase(item.columnName)),
        id: item.columnName,
        entity: item,
      };
      arr.push(option);
    }
    return _sortBy(arr, 'name');
  }

  getValueComponentType(
    keyControl: FormControl<MeAutoCompleteOption>,
    operatorControl: FormControl<string>,
  ): ValueComponentType {
    let type: ValueComponentType = this.getKeyControlType(keyControl);
    const isCloseListKey = this.isCloseListKey(keyControl);
    const isListOperator = this.isListOperator(operatorControl.value);
    const isNullOperator = this.isNullOperator(operatorControl.value);
    const isCommonOperator = this.isCommonOperator(operatorControl.value);
    if (isNullOperator) {
      type = 'null';
    } else if (isListOperator && isCloseListKey) {
      type = 'list';
    } else if (isCommonOperator && isCloseListKey) {
      type = 'autocomplete';
    } else if (isListOperator && !isCloseListKey) {
      type = 'free-list';
    } else if (!type) {
      type = 'string';
    }
    return type;
  }

  loadValueControl(
    keyControl: FormControl<MeAutoCompleteOption>,
    valueControl: FormControl<any>,
    arrValueControl: FormControl<Array<string>>,
    value: string | Array<string> | number,
    isDisabled?: boolean,
  ): void {
    if (value === null) {
      return;
    }
    if (_isArray(value)) {
      if (isDisabled) {
        arrValueControl.disable();
      }
      arrValueControl.setValue([...value]);
    } else if (this.getAttributeEntity(keyControl)?.values) {
      const option: MeAutoCompleteOption = {
        name: value as string,
        id: value as string,
      };
      valueControl.setValue(option);
    } else {
      valueControl.setValue(value);
    }
  }

  getKeyControlType(keyControl: FormControl<MeAutoCompleteOption>): ValueComponentType {
    return keyControl?.value?.entity?.columnType;
  }

  isCloseListKey(keyControl: FormControl<MeAutoCompleteOption>): boolean {
    return keyControl?.value?.entity?.values?.length;
  }

  getAttributeEntity(keyControl: FormControl<MeAutoCompleteOption>): QEAttribute {
    return keyControl?.value?.entity as QEAttribute;
  }
}
