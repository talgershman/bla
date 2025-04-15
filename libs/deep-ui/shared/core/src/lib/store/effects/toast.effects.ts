import {inject, Injectable} from '@angular/core';
import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {tap} from 'rxjs/operators';

import {
  deletePerfectListErrorAction,
  queryClipsSampleErrorAction,
  queryFilePathErrorAction,
  queryRunDatasetQueryErrorAction,
} from '../actions/toast.actions';

@Injectable()
export class ToastEffects {
  private actions$ = inject(Actions);
  private errorHandlerService = inject(MeErrorHandlerService);

  errorMsg$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          queryFilePathErrorAction,
          queryRunDatasetQueryErrorAction,
          queryClipsSampleErrorAction,
          deletePerfectListErrorAction,
        ),
        tap((action) => this.errorHandlerService.raiseError(action)),
      ),
    {
      dispatch: false,
    },
  );
}
