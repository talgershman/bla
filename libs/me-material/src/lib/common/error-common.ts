import {InjectionToken} from '@angular/core';

export const defaultErrors = {
  required: (): string => `This field is required`,
  pattern: ({requiredPattern}): string =>
    `Invalid characters, string should match pattern : ${requiredPattern}`,
  minlength: ({requiredLength, actualLength}): string =>
    `Expect ${requiredLength} but got ${actualLength}`,
  maxlength: ({requiredLength, _}): string =>
    `Value must not be bigger than ${requiredLength} characters`,
  min: ({min}): string => `Number must be at least ${min}`,
  max: ({max}): string => `Number must be at most ${max}`,
};

export const ERRORS_DICTIONARY = new InjectionToken('ERRORS_DICTIONARY', {
  providedIn: 'root',
  factory: () => defaultErrors,
});
