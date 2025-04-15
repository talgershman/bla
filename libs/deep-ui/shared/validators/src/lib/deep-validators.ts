import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, InputSignal} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {DuplicateResponse, ValidationResponse} from 'deep-ui/shared/common';
import {
  ClipListService,
  EtlService,
  LaunchService,
  OnPremService,
  ParsingConfigurationService,
  QueryFileSystem,
  SubmitJobEtl,
} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {ETL} from 'deep-ui/shared/models';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, finalize, first, map, switchMap, tap} from 'rxjs/operators';

export const hintKey = 'hint';
export const warningKey = 'warning';
export const forceErrorMsgKey = 'forceErrorMsg';
const errorKey = 'checkInFileSystem';

export class DeepFormValidations {
  static checkInFileSystemAsWarning(
    onPremService: OnPremService,
    type: 'file' | 'folder' | 'path',
    cd: ChangeDetectorRef,
    updateOnValid?: (control: AbstractControl, type: 'file' | 'folder') => void,
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return of(null).pipe(
        tap(() => {
          onPremService
            .queryFileSystem(control.value, type)
            .pipe(
              first(),
              finalize(() => this._triggerCd(cd)),
            )
            .subscribe((response: QueryFileSystem | string) => {
              const queryFileSystemResponse = response as QueryFileSystem;
              if (!queryFileSystemResponse?.paths) {
                if (updateOnValid) {
                  updateOnValid(control, undefined);
                }
                control[warningKey] =
                  'An error occurred while trying to check Mobileye file system';
                return null;
              }
              if (queryFileSystemResponse.paths[0].found) {
                if (updateOnValid) {
                  updateOnValid(control, queryFileSystemResponse.paths[0].type);
                }
                control[warningKey] = null;
                return null;
              }
              if (updateOnValid) {
                updateOnValid(control, undefined);
              }
              control[warningKey] = `Couldn't find ${type} in Mobileye file system`;
              return null;
            });
        }),
      );
    };
  }

  static checkInFileSystem(
    onPremService: OnPremService,
    type: 'file' | 'folder' | 'path',
    cd: ChangeDetectorRef,
    updateOnValid?: (control: AbstractControl, type: 'file' | 'folder') => void,
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return onPremService.queryFileSystem(control.value, type).pipe(
        map((response: QueryFileSystem | string) => {
          this._triggerCd(cd);
          const queryFileSystemResponse = response as QueryFileSystem;
          if (!queryFileSystemResponse?.paths) {
            if (updateOnValid) {
              updateOnValid(control, undefined);
            }
            return {
              [errorKey]: 'An error occurred while trying to check Mobileye file system',
            };
          }
          if (queryFileSystemResponse.paths[0].found) {
            if (updateOnValid) {
              updateOnValid(control, queryFileSystemResponse.paths[0].type);
            }
            return null;
          }
          if (updateOnValid) {
            updateOnValid(control, undefined);
          }
          return {
            [errorKey]: `Couldn't find ${type} in Mobileye file system`,
          };
        }),
        map((validation: ValidationErrors | null) => {
          if (environment.disableOnPremRequests) {
            DeepFormValidations._setControlWarningValue(
              {[errorKey]: `DEEP's current path validation is not active.`},
              control,
            );
            return null;
          }
          return validation;
        }),
      );
    };
  }

  static validateUserParams(launchService: LaunchService, etl: InputSignal<ETL>): AsyncValidatorFn {
    return (control: FormControl<any>): Observable<ValidationErrors | null> => {
      const value: SubmitJobEtl = control.value;
      if (!etl() || !value || !value.params) {
        return of(null);
      }

      return launchService.validateUserParams(etl().id, value.params).pipe(
        debounceTime(200),
        catchError((response: HttpErrorResponse) => of(response.error)),
        switchMap((response: {detail: string; valid: boolean; error?: Record<any, any>}) => {
          if (response.valid) {
            return of(null);
          }
          return of({
            validateUserParams: response.error,
          });
        }),
      );
    };
  }

  static checkClipListName(
    clipListService: ClipListService,
    id: number,
    cd: ChangeDetectorRef,
  ): AsyncValidatorFn {
    return (control: FormControl): Observable<ValidationErrors | null> => {
      const formGroup: FormGroup<any> = control.parent as FormGroup;
      const value = control.value && control.value.trim ? control.value.trim() : control.value;
      if (!value || !formGroup.value.technology) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return formGroup.get('name').valueChanges.pipe(
        debounceTime(200),
        switchMap((name: string) => {
          const checkNameObs = clipListService.checkDuplicateName(
            name.trim(),
            formGroup.value.technology,
            id,
          );
          return DeepFormValidations._handleRequestObservable(
            checkNameObs,
            'checkClipListName',
            formGroup.value?.name,
            cd,
          );
        }),
        first(),
      );
    };
  }

  static checkParsingConfigurationName(
    parsingConfigurationService: ParsingConfigurationService,
    id: string,
    cd: ChangeDetectorRef,
  ): AsyncValidatorFn {
    return (control: FormControl): Observable<ValidationErrors | null> => {
      const formGroup: FormGroup = control.parent as FormGroup;
      const folder =
        formGroup.value.folder && formGroup.value.folder.id
          ? formGroup.value.folder.id
          : formGroup.value.folder;
      if (!control.value || !folder) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return formGroup.get('name').valueChanges.pipe(
        debounceTime(200),
        switchMap((name: string) => {
          const checkNameObs = parsingConfigurationService.checkDuplicateName(
            name.trim(),
            folder,
            id,
          );
          return DeepFormValidations._handleRequestObservable(
            checkNameObs,
            'checkParsingConfigurationName',
            formGroup.value?.name,
            cd,
          );
        }),
        first(),
      );
    };
  }

  static checkEtlName(etlService: EtlService, cd: ChangeDetectorRef): AsyncValidatorFn {
    return (control: FormControl<string>): Observable<ValidationErrors | null> => {
      const formGroup: FormGroup<any> = control.parent as FormGroup<any>;
      if (!control.value) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return formGroup.get('name').valueChanges.pipe(
        debounceTime(200),
        switchMap((name: string) => {
          const checkNameObs = etlService.checkDuplicateName(name.trim());
          return DeepFormValidations._handleRequestObservable(
            checkNameObs,
            'checkEtlName',
            formGroup.value?.name,
            cd,
          );
        }),
        first(),
      );
    };
  }

  static checkParsingConfigurationJsonConfig(
    parsingConfigurationService: ParsingConfigurationService,
    cd: ChangeDetectorRef,
  ): AsyncValidatorFn {
    return (control: FormControl): Observable<ValidationErrors | null> => {
      const value = control.value;
      if (!value) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return parsingConfigurationService.checkConfig(value).pipe(
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, true),
          }),
        ),
        map((response: ValidationResponse) => {
          DeepFormValidations._triggerCd(cd);
          if (response.error) {
            return {
              validateJsonConfig: response.error,
            };
          }
          return null;
        }),
      );
    };
  }

  private static _setControlWarningValue(
    validation: ValidationErrors,
    control: AbstractControl,
  ): void {
    if (validation !== null) {
      control[warningKey] = validation[errorKey];
    } else {
      control[warningKey] = '';
    }
  }

  private static _triggerCd(changeDetectorRef: ChangeDetectorRef): void {
    changeDetectorRef?.detectChanges();
  }

  private static _handleRequestObservable(
    checkNameObs: Observable<any>,
    key: string,
    value: string,
    cd: ChangeDetectorRef,
  ): Observable<ValidationErrors> {
    return checkNameObs.pipe(
      catchError(() => of(null)),
      map((response: DuplicateResponse) => {
        if (!response) {
          return {
            [key]: 'An error occurred while trying to check for name duplication',
          };
        }
        if (!response.isDuplicate) {
          return null;
        }
        return {
          [key]: `${value} - already exists.`,
        };
      }),
      finalize(() => this._triggerCd(cd)),
    );
  }
}
