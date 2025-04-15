import {ChangeDetectorRef} from '@angular/core';
import {AsyncValidatorFn, FormControl, FormGroup, ValidationErrors} from '@angular/forms';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {PerfectListService} from 'deep-ui/shared/core';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, finalize, first, map, switchMap} from 'rxjs/operators';

export class PerfectListFormValidations {
  static checkPerfectListName(
    perfectListService: PerfectListService,
    id: number,
    cd: ChangeDetectorRef
  ): AsyncValidatorFn {
    return (control: FormControl): Observable<ValidationErrors | null> => {
      const formGroup: FormGroup<any> = control.parent as FormGroup<any>;
      const value = control.value && control.value.trim ? control.value.trim() : control.value;
      if (!value || !formGroup.value.technology || !formGroup.value.rawDataOwner) {
        return of(null).pipe(finalize(() => this._triggerCd(cd)));
      }
      return formGroup.get('name').valueChanges.pipe(
        debounceTime(200),
        switchMap((name: string) => {
          const checkNameObs = perfectListService.checkDuplicateName(
            name.trim(),
            formGroup.value.technology,
            formGroup.value.rawDataOwner,
            id
          );
          return this._handleRequestObservable(
            checkNameObs,
            'checkClipListName',
            formGroup.value.name,
            cd
          );
        }),
        first()
      );
    };
  }
  private static _triggerCd(changeDetectorRef: ChangeDetectorRef): void {
    changeDetectorRef?.detectChanges();
  }

  private static _handleRequestObservable(
    checkNameObs: Observable<any>,
    key: string,
    value: string,
    cd: ChangeDetectorRef
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
      finalize(() => this._triggerCd(cd))
    );
  }
}
