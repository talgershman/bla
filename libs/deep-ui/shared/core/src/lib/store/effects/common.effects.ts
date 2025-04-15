import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {catchError, map, switchMap, withLatestFrom} from 'rxjs/operators';

import {AssetManagerService} from '../../asset-manager/asset-manager.service';
import {
  loadTechnologiesAPIActions,
  loadTechnologiesClipListResolver,
} from '../actions/common.actions';
import {AppState} from '../reducers';
import {selectIsTechnologiesLoaded} from '../selectors/common.selectors';

@Injectable()
export class CommonEffects {
  private actions$ = inject(Actions);
  private assetManagerService = inject(AssetManagerService);
  private store = inject<Store<AppState>>(Store);

  loadTechnologies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTechnologiesClipListResolver),
      withLatestFrom(this.store.select(selectIsTechnologiesLoaded)),
      switchMap(([_, hasLoaded]) => {
        if (hasLoaded) {
          return of(loadTechnologiesAPIActions.loadTechnologiesFromCache());
        }
        return this.assetManagerService.getTechnologies().pipe(
          map((technologies: Array<string>) => {
            return loadTechnologiesAPIActions.loadTechnologiesSuccess({technologies});
          }),
          catchError(() => of(loadTechnologiesAPIActions.loadTechnologiesFailed())),
        );
      }),
    ),
  );
}
