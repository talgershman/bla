import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree} from '@angular/router';
import {MsalBroadcastService, MsalService} from '@azure/msal-angular';
import {InteractionStatus} from '@azure/msal-browser';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {Store} from '@ngrx/store';
import {AppState, setActiveUserFromGuard} from 'deep-ui/shared/core';
import {from, Observable, of} from 'rxjs';
import {filter, first, switchMap} from 'rxjs/operators';

@Injectable()
export class MeUpdateUserSessionGuard {
  private msalService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private store = inject<Store<AppState>>(Store);
  private userPreferencesService = inject(MeUserPreferencesService);

  /* eslint-disable */
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.msalBroadcastService.inProgress$.pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None),
      switchMap(() => {
        const accounts = this.msalService.instance.getAllAccounts();
        if (accounts.length === 1) {
          this.msalService.instance.setActiveAccount(accounts[0]);
          this.store.dispatch(setActiveUserFromGuard({activeAccount: accounts[0]}));
          return from(this.userPreferencesService.getFirstUserPreferences()).pipe(
            switchMap((_) => of(true)),
          ); // timeout of 2min and catchError
        }
        return of(true);
      }),
      first(),
    );
  }
  /* eslint-enable */
}
