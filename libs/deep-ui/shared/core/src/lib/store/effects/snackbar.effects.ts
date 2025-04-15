import {inject, Injectable} from '@angular/core';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {tap} from 'rxjs/operators';

import {deleteMsgSnackbarAction, updateMsgSnackbarAction} from '../actions/snackbar.actions';

@Injectable()
export class SnackbarEffects {
  private actions$ = inject(Actions);
  private snackbarService = inject(MeSnackbarService);

  deleteMsg$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(deleteMsgSnackbarAction),
        tap((action) => this.snackbarService.onDelete(action.name)),
      ),
    {
      dispatch: false,
    },
  );

  updateMsg$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(updateMsgSnackbarAction),
        tap((action) =>
          action.override
            ? this.snackbarService.open(action.msg)
            : this.snackbarService.onUpdate(action.msg),
        ),
      ),
    {
      dispatch: false,
    },
  );
}
