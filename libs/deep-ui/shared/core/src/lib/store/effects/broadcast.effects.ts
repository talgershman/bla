import {inject, Injectable} from '@angular/core';
import {BroadcastNameEnum, MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {EMPTY, of, switchMap} from 'rxjs';
import {withLatestFrom} from 'rxjs/operators';

import {broadcastEffectsActions, checkForUpdateActions} from '../actions/broadcast.actions';
import {AppState} from '../reducers';
import {selectIsNewUIVersion} from '../selectors/broadcast.selectors';

@Injectable()
export class BroadcastEffects {
  private actions$ = inject(Actions);
  private store = inject<Store<AppState>>(Store);
  private broadcastService = inject(MeBroadcastService);

  broadcastnewUIVersionBecameAvailable$ = createEffect(() =>
    this.actions$.pipe(
      ofType(checkForUpdateActions.newUIVersionBecameAvailable),
      withLatestFrom(this.store.select(selectIsNewUIVersion)),
      switchMap(([_, isShown]: [any, boolean]) => {
        if (!isShown) {
          this.broadcastService.postMessage(BroadcastNameEnum.New_Version_Indicator, {
            showNewIndicator: true,
          });
          return of(broadcastEffectsActions.updateOtherTabs());
        }
        return EMPTY;
      }),
    ),
  );
}
