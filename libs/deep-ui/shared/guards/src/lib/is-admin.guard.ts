import {inject, Injectable} from '@angular/core';
import {Route, Router, UrlSegment} from '@angular/router';
import {Store} from '@ngrx/store';
import {AppState, isUserAdminSelector} from 'deep-ui/shared/core';
import {map, Observable} from 'rxjs';
import {first} from 'rxjs/operators';

@Injectable()
export class MeIsUserAdminGuard {
  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);

  /* eslint-disable */
  canMatch(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.store.select(isUserAdminSelector).pipe(
      first(),
      map((isAdmin) => {
        if (!isAdmin) {
          // If the user is not an admin, navigate to the home page
          this.router.navigate(['.']);
        }
        return isAdmin;
      }),
    );
  }
  /* eslint-enable */
}
