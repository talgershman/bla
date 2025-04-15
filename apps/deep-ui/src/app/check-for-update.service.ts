import {HttpClient, HttpResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import {AppState, checkForUpdateActions, selectIsNewUIVersion} from 'deep-ui/shared/core';
import {EMPTY, interval, Observable, of, ReplaySubject, switchMap} from 'rxjs';
import {catchError, takeUntil, withLatestFrom} from 'rxjs/operators';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MeCheckForUpdateService {
  private http = inject(HttpClient);
  private store = inject<Store<AppState>>(Store);

  private found$ = new ReplaySubject(1);
  private lastModified: Date = new Date();
  private isLastModifiedChanged$ = this._registerToHeadRequest();
  private everyOneHour$ = interval(30 * 60 * 1000).pipe(takeUntil(this.found$));
  private requestHeadEveryOneHour$: Observable<boolean | typeof EMPTY> = this.everyOneHour$.pipe(
    withLatestFrom(this.store.select(selectIsNewUIVersion)),
    switchMap(([, isShown]: [number, boolean]) => {
      if (isShown) {
        return EMPTY;
      } else {
        return this.isLastModifiedChanged$;
      }
    }),
    catchError(() => of(false)),
    untilDestroyed(this),
  );

  constructor() {
    this.requestHeadEveryOneHour$.pipe(untilDestroyed(this)).subscribe();
    this.store
      .select(selectIsNewUIVersion)
      .pipe(untilDestroyed(this))
      .subscribe((isNewUIVersionDetected: boolean) => {
        if (isNewUIVersionDetected) {
          this.found$.next(true);
        }
      });
  }

  private _isNewVersionDetected(response: HttpResponse<any>): boolean {
    const newLastModifiedStr: string = response.headers.get('last-modified');
    const newLastModified = new Date(newLastModifiedStr);
    const newDateInMiliSec = newLastModified.getTime();
    if (isNaN(newDateInMiliSec)) {
      return false;
    }
    return newDateInMiliSec - this.lastModified.getTime() > 0;
  }

  private _registerToHeadRequest(): typeof EMPTY {
    return this.http.head(location.origin, {observe: 'response'}).pipe(
      withLatestFrom(this.store.select(selectIsNewUIVersion)),
      switchMap(([response, isShown]: [HttpResponse<any>, boolean]) => {
        if (isShown) {
          return EMPTY;
        }
        const isNewVersion = this._isNewVersionDetected(response);
        if (isNewVersion) {
          this.store.dispatch(checkForUpdateActions.newUIVersionBecameAvailable());
        } else {
          this.store.dispatch(checkForUpdateActions.noNewUIVersion());
        }
        return EMPTY;
      }),
      catchError(() => {
        this.store.dispatch(checkForUpdateActions.noNewUIVersion());
        return EMPTY;
      }),
    );
  }
}
