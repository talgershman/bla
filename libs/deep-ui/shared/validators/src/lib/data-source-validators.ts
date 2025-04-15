import {ChangeDetectorRef} from '@angular/core';
import {AsyncValidatorFn, FormControl, FormGroup, ValidationErrors} from '@angular/forms';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {DatasourceService} from 'deep-ui/shared/core';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, finalize, first, map, switchMap} from 'rxjs/operators';

export class DataSourceFormValidations {
  static checkDatasourceName(
    datasourceService: DatasourceService,
    cd: ChangeDetectorRef,
  ): AsyncValidatorFn {
    return (control: FormControl): Observable<ValidationErrors | null> => {
      const group: FormGroup = control?.parent as FormGroup;
      const team = group?.get('team')?.value;
      if (!control.value || !team) {
        return of(null);
      }
      return group.get('name').valueChanges.pipe(
        debounceTime(200),
        switchMap((name: string) => {
          const checkNameObs = datasourceService.checkDuplicateName(name.trim(), team);
          return this._handleRequestObservable(
            checkNameObs,
            'checkDatasourceName',
            group.value?.name.trim(),
            cd,
          );
        }),
        first(),
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
