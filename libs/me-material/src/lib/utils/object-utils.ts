import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {isArray} from 'lodash-es';
import _has from 'lodash-es/has';
import _isEqual from 'lodash-es/isEqual';
import _isNil from 'lodash-es/isNil';
import _isObject from 'lodash-es/isObject';
import _mapKeys from 'lodash-es/mapKeys';
import _omitBy from 'lodash-es/omitBy';
import _snakeCase from 'lodash-es/snakeCase';
import _startCase from 'lodash-es/startCase';

import {capitalize, isString} from './string-utils';

export const removeEmptyPropsFromObject = (obj: any): Partial<any> => {
  return _omitBy(obj, _isNil);
};

export const generateHtmlMessageFromObject = (obj: any): string => {
  if (obj === '') {
    return '';
  }
  let json: any;
  if (typeof obj === 'object' && obj !== null) {
    json = obj;
  } else {
    try {
      json = JSON.parse(obj);
      // eslint-disable-next-line
    } catch (e) {
      // no biggie
      return obj;
    }
  }

  let result = '';
  Object.keys(json).forEach((key: string) => {
    result += `${capitalize(key)} - ${capitalize(json[key])}<br />`;
  });
  return result;
};

export const getErrorHtmlMsgFromResponse = (
  response: HttpErrorResponse,
  printAllKeys = false,
  originalResponse = false,
): any => {
  let error = response;
  let result = '';
  if (response.status !== HttpStatusCode.BadRequest) {
    return 'Oops ! Something went wrong.';
  }
  if (response?.error) {
    error = response.error && response.error.error ? response.error.error : response.error;
  }
  if (originalResponse) {
    return response.error;
  }

  if (isString(error)) {
    if (printAllKeys) {
      result = `<span>${error}<span><br />`;
      Object.keys(response.error).forEach((key: string) => {
        if (key !== 'error') {
          result += `<span>${capitalize(key)} - ${capitalize(response.error[key])}</span><br />`;
        }
      });
    } else {
      result = `<span>${error}<span>`;
    }
  } else {
    Object.keys(error).forEach((key: string) => {
      const value =
        typeof error[key as keyof HttpErrorResponse] === 'object'
          ? JSON.stringify(response.error[key])
          : error[key as keyof HttpErrorResponse];
      result += `${key} - ${value}<br />`;
    });
  }
  return result;
};

export const isJson = (data: any): boolean => {
  try {
    if (typeof data === 'object') {
      return true;
    }
    JSON.parse(data as string);
    // eslint-disable-next-line
  } catch (e) {
    return false;
  }
  return true;
};

export const prettyPrintJson = (data: any, ignoreReplace = false): string => {
  if (typeof data === 'object' || isJson(data)) {
    const result = JSON.stringify(data, null, 2);
    if (!ignoreReplace) {
      return result.replace(/\\/g, '');
    }
    return result;
  }
  return data;
};

/* Compare two objects by reducing an array of keys in obj1, having the
 * keys in obj2 as the initial value of the result. Key points:
 *
 * - All keys of obj2 are initially in the result.
 *
 * - If the loop finds a key (from obj1, remember) not in obj2, it adds
 *   it to the result.
 *
 * - If the loop finds a key that are both in obj1 and obj2, it compares
 *   the value. If it's the same value, the key is removed from the result.
 */
export const getDiffKeys = (obj1: any, obj2: any): any => {
  const diff = Object.keys(obj1).reduce((result, key) => {
    // eslint-disable-next-line
    if (!obj2.hasOwnProperty(key)) {
      result.push(key);
    } else if (_isEqual(obj1[key], obj2[key])) {
      const resultKeyIndex = result.indexOf(key);
      result.splice(resultKeyIndex, 1);
    }
    return result;
  }, Object.keys(obj2));

  return diff;
};

export const isEmptyObject = (obj: any): boolean => {
  return Object.keys(obj || {}).length === 0;
};

export const printObjectHtml = (obj: any): string => {
  if (isEmptyObject(obj)) {
    return '';
  }
  let str = '';
  Object.keys(obj).forEach((key) => {
    str += `<p> ${_startCase(key)} : ${obj[key]}</p>`;
  });
  return str;
};

export const camelToSnake = (obj: any): any => {
  if (!obj) {
    return obj;
  }
  return _mapKeys(obj, (value, key) => {
    return _snakeCase(key);
  });
};

export const removeUnmatchedKeys = (obj1: any, obj2: any, ignoreArrayValues?: boolean): any => {
  Object.keys(obj1 || {}).forEach((key) => {
    if (ignoreArrayValues && isArray(obj1[key]) && isArray(obj2[key])) {
      return;
    }
    if (!_has(obj2, key)) {
      // Remove the key if it doesn't exist in obj2
      delete obj1[key];
    } else if (_isObject(obj1[key]) && _isObject(obj2[key])) {
      // If both are objects, recurse
      removeUnmatchedKeys(obj1[key], obj2[key], ignoreArrayValues);
    }
  });
  return obj1;
};
