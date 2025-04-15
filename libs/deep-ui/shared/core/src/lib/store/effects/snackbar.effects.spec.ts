import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {provideMockActions} from '@ngrx/effects/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {deleteMsgSnackbarAction, updateMsgSnackbarAction} from 'deep-ui/shared/core';
import {Observable, of} from 'rxjs';

import {SnackbarEffects} from './snackbar.effects';

describe('SnackbarEffects', () => {
  let spectator: SpectatorHttp<SnackbarEffects>;
  let actions$: Observable<any>;
  let effects: SnackbarEffects;

  const createHttp = createHttpFactory({
    service: SnackbarEffects,
    providers: [SnackbarEffects, provideMockActions(() => actions$), provideMockStore({})],
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
    effects = spectator.inject(SnackbarEffects);
  });

  describe('deleteMsg$', () => {
    it('should fire action success', (done) => {
      (async function () {
        actions$ = of(deleteMsgSnackbarAction({name: 'test'}));
        effects.deleteMsg$.subscribe(() => {
          expect(true).toBeTrue();
          done();
        });
      })();
    });
  });

  describe('updateMsg$', () => {
    it('should fire action success', (done) => {
      (async function () {
        actions$ = of(updateMsgSnackbarAction({msg: 'test'}));
        effects.updateMsg$.subscribe(() => {
          expect(true).toBeTrue();
          done();
        });
      })();
    });
  });
});
