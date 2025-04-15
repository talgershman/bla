import {AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {dateDiffDateFns, isArrayEmptyValues} from '@mobileye/material/src/lib/utils';
import isValidPath from 'is-valid-path';
import _intersectionBy from 'lodash-es/intersectionBy';
import _isArray from 'lodash-es/isArray';
import _isEqual from 'lodash-es/isEqual';
import _some from 'lodash-es/some';

export class MeFormValidations {
  static trueValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return control.value === true ? null : {isNotTrue: true};
    };
  }

  static compareDatesValidator(minKey: string, maxKey: string): ValidatorFn {
    return (formGroup: FormGroup<any>): ValidationErrors => {
      const errorMsg = this._compareDatesInner(formGroup, minKey, maxKey);
      return errorMsg ? {compareDatesValidator: true} : null;
    };
  }

  static compareFormArrayDatesValidator(): ValidatorFn {
    return (formArray: FormArray<any>): ValidationErrors => {
      const errorMsg = this._compareFormArrayDatesInner(formArray);
      return errorMsg ? {compareDatesValidator: true} : null;
    };
  }

  static arrayAllEmptyValues(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._arrayAllEmptyValuesInner(control);
      return errorMsg ? {isArrayAllEmptyValues: true} : null;
    };
  }

  static arrayValuesInvalidPrefix(prefix: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._arrayValuesInvalidPrefixInner(control, prefix);
      return errorMsg ? {arrayValuesInvalidPrefix: true} : null;
    };
  }

  static arrayInvalidRegexValidation(regexStr: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._arrayInvalidRegexValidationInner(control, regexStr);
      return errorMsg ? {arrayInvalidRegexValidation: true} : null;
    };
  }

  static arrayIsValidPath(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._arrayIsValidPathInner(control);
      return errorMsg ? {arrayIsValidPath: true} : null;
    };
  }

  static arrayInvalidValues(invalidValues: Array<any>) {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._arrayInvalidValuesInner(control, invalidValues);
      return errorMsg ? {arrayInvalidValues: errorMsg} : null;
    };
  }

  static isObjectArrayAllEmptyValues(requiredProps: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._isObjectArrayAllEmptyValuesInner(control, requiredProps);
      return errorMsg ? {isObjectArrayAllEmptyValues: true} : null;
    };
  }

  static invalidBlackList(arr: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._invalidBlackListInner(control, arr);
      return errorMsg ? {invalidBlackList: errorMsg} : null;
    };
  }

  static mustStartWith(prefix: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._mustStartWithInner(control, prefix);
      return errorMsg ? {mustStartWith: errorMsg} : null;
    };
  }

  static mustEndWith(suffix: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._mustEndWithInner(control, suffix);
      return errorMsg ? {mustEndWith: errorMsg} : null;
    };
  }

  static invalidRegexValidation(regexStr: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._invalidRegexValidationInner(control, regexStr);
      return errorMsg ? {invalidRegexValidation: true} : null;
    };
  }

  static isValidPath(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._isValidPathInner(control);
      return errorMsg ? {isValidPath: errorMsg} : null;
    };
  }

  static isValidFilePath(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._isValidFilePathInner(control);
      return errorMsg ? {isValidFilePath: errorMsg} : null;
    };
  }

  static isValidFolderPath(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this._isValidFolderPathInner(control);
      return errorMsg ? {isValidFolderPath: errorMsg} : null;
    };
  }

  static isNotObject(comparedObject: any, allowArrayObject?: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this.isNotObjectInner(control, comparedObject, allowArrayObject);
      return errorMsg ? {isNotObject: errorMsg} : null;
    };
  }

  static isValidUuid(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const errorMsg = this.isValidUuidInner(control);
      return errorMsg ? {isValidUuid: errorMsg} : null;
    };
  }

  static greaterOrEqualThan(field: string, compareField: string): ValidatorFn {
    return (formGroup: FormGroup<any>): ValidationErrors => {
      if (!formGroup) {
        return null;
      }
      const fieldToCompareValue = formGroup.get(compareField)?.value;
      const value = formGroup.get(field)?.value;
      if (fieldToCompareValue === null || value === null) {
        return null;
      }
      const isValid = Number(value) >= Number(fieldToCompareValue);
      return isValid ? null : {greaterOrEqualThan: fieldToCompareValue};
    };
  }

  private static isValidUuidInner(control: AbstractControl): string {
    const value = control.value as any;
    if (!value) {
      return null;
    }
    const regex = new RegExp(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    return regex.test(value.trim()) ? null : 'Invalid uuid string';
  }

  private static isNotObjectInner(
    control: AbstractControl,
    comparedObject: any,
    allowArrayObject: boolean,
  ): string {
    const value = control.value as any;
    try {
      if (value === null) {
        return null;
      }
      if (
        typeof value !== 'object' ||
        value === undefined ||
        (!allowArrayObject && Array.isArray(value))
      ) {
        return 'Value is invalid';
      }
      return _isEqual(value, comparedObject) ? 'Value is invalid' : null;
      // eslint-disable-next-line
    } catch (e) {
      // return invalid
      return 'Value is invalid';
    }
  }

  private static _isValidFolderPathInner(control: AbstractControl): string {
    const valueStr = control.value as string;
    if (valueStr === '') {
      return null;
    }
    let validMsg = this._invalidRegexValidationInner(control, '/{2,}');
    if (validMsg) {
      return `Path can't include "//".`;
    }
    validMsg = this._mustStartWithInner(control, '/');
    if (validMsg) {
      return validMsg;
    }
    return isValidPath(valueStr) ? null : 'Path is not valid';
  }

  private static _isValidFilePathInner(control: AbstractControl): string {
    const valueStr = control.value as string;
    let validMsg = this._invalidRegexValidationInner(control, '/{2,}');
    if (validMsg) {
      return `Path can't include "//".`;
    }
    validMsg = this._mustStartWithInner(control, '/');
    if (validMsg) {
      return validMsg;
    }
    if (valueStr === '') {
      return null;
    }
    return isValidPath(valueStr) ? null : 'Path is not valid';
  }

  private static _isValidPathInner(control: AbstractControl): string {
    const valueStr = control.value as string;
    if (valueStr === '') {
      return null;
    }
    return isValidPath(valueStr) && !valueStr.includes(' ') ? null : 'Path is not valid';
  }

  private static _invalidRegexValidationInner(control: AbstractControl, regexStr: string): string {
    const valueStr = control.value as string;
    if (valueStr === '') {
      return null;
    }
    const regex = new RegExp(regexStr);
    return regex.test(valueStr) ? `Found invalid regex string : "${regexStr}"` : null;
  }

  private static _mustEndWithInner(control: AbstractControl, suffix: string): string {
    const valueStr = control.value as string;
    if (!valueStr) {
      return null;
    }
    return valueStr.endsWith(suffix) ? null : `Must end with "${suffix}" .`;
  }

  private static _mustStartWithInner(control: AbstractControl, prefix: string): string {
    const valueStr = control.value as string;
    if (!valueStr) {
      return null;
    }
    return valueStr.startsWith(prefix) ? null : `Must start with "${prefix}" .`;
  }

  private static _invalidBlackListInner(control: AbstractControl, arr: string[]): string {
    const valueStr = control.value as string;
    if (!arr.length || !valueStr) {
      return null;
    }
    const invalids = [];
    for (const item of arr) {
      if (valueStr.toLowerCase().indexOf(item.toLowerCase()) !== -1) {
        invalids.push(item);
      }
    }
    if (invalids.length) {
      return invalids.length > 1
        ? `Invalid values : ${invalids.join(', ')}`
        : `Invalid value : ${invalids[0]}`;
    }
    return null;
  }

  private static _isObjectArrayAllEmptyValuesInner(
    control: AbstractControl,
    requiredProps: string[],
  ): string {
    const arr = control.value as Array<any>;
    if (!arr) {
      return null;
    }
    if (arr && !arr.length) {
      return 'invalid';
    }
    for (const item of arr) {
      for (const prop of requiredProps) {
        // eslint-disable-next-line
        if (item.hasOwnProperty(prop) && (!item[prop] || (item[prop].trim && !item[prop].trim()))) {
          return 'invalid';
        }
      }
    }
    return null;
  }

  private static _arrayIsValidPathInner(control: AbstractControl): string {
    const arr = control.value as Array<string>;
    if (isArrayEmptyValues(arr)) {
      return null;
    }
    for (const item of arr) {
      if (!isValidPath(item)) {
        return 'invalid';
      }
    }
    return null;
  }

  private static _arrayInvalidRegexValidationInner(
    control: AbstractControl,
    regexStr: string,
  ): string {
    const arr = control.value as Array<string>;
    if (isArrayEmptyValues(arr)) {
      return null;
    }
    const regex = new RegExp(regexStr);
    for (const item of arr) {
      if (regex.test(item)) {
        return 'invalid';
      }
    }
    return null;
  }

  private static _arrayValuesInvalidPrefixInner(control: AbstractControl, prefix: string): string {
    const arr = control.value as Array<string>;
    if (isArrayEmptyValues(arr)) {
      return null;
    }
    const isEmpty = _some(arr, (item: string) => item.startsWith(prefix));
    return isEmpty ? 'invalid' : null;
  }

  private static _arrayAllEmptyValuesInner(control: AbstractControl): string {
    const arr = control.value as Array<string>;
    const isEmpty = isArrayEmptyValues(arr);
    return isEmpty ? 'invalid' : null;
  }

  private static _compareDatesInner(
    formGroup: FormGroup<any>,
    minKey: string,
    maxKey: string,
  ): string {
    const fromCtrl = formGroup.get(minKey);
    const toCtrl = formGroup.get(maxKey);
    if (!fromCtrl || !toCtrl || !fromCtrl.value || !toCtrl.value) {
      return null;
    }
    if (dateDiffDateFns(fromCtrl.value, toCtrl.value) > 0) {
      return 'invalid';
    }
    return null;
  }

  private static _compareFormArrayDatesInner(formArray: FormArray<any>): string {
    const fromCtrl = formArray.at(0);
    const toCtrl = formArray.at(1);
    let modifiedErrors = !fromCtrl.errors ? null : {...fromCtrl.errors};
    if (fromCtrl.errors) {
      delete modifiedErrors.compareDatesValidator;
      if (Object.keys(modifiedErrors).length === 0) {
        modifiedErrors = null;
      }
    }
    if (!fromCtrl || !toCtrl || !fromCtrl.value || !toCtrl.value) {
      return null;
    }
    if (dateDiffDateFns(fromCtrl.value, toCtrl.value) > 0) {
      return 'invalid';
    }
    return null;
  }

  private static _arrayInvalidValuesInner(
    control: AbstractControl,
    invalidValues: Array<any>,
  ): string {
    const controlValue = control.value as Array<any>;
    if (!controlValue) {
      return null;
    }
    const currentValues = this._buildArrayControlObject(controlValue);
    const invalidArr = this._buildArrayControlObject(invalidValues);
    const foundInvalidValues = _intersectionBy(currentValues, invalidArr, 'id');
    return foundInvalidValues && foundInvalidValues.length
      ? `Invalid values: ${foundInvalidValues.map((item) => item.label).join(' ')}`
      : null;
  }

  private static _buildArrayControlObject(value: any): Array<any> {
    let arrValue = value;
    if (!value || value === '') {
      return [];
    }
    if (!_isArray(value)) {
      arrValue = [value];
    }
    if (!arrValue.length) {
      return [];
    }
    let labelKey = '';
    if (arrValue[0].name) {
      labelKey = 'name';
    } else if (arrValue[0]?.value) {
      labelKey = 'value';
    } else if (arrValue[0].id) {
      labelKey = 'id';
    }
    const results = [];
    for (const item of arrValue) {
      if (item.id) {
        results.push({
          id: item.id,
          label: item[labelKey],
        });
      } else {
        results.push({
          id: item,
          label: item,
        });
      }
    }
    return results;
  }
}
