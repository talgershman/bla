import {MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator';
import {provideMockActions} from '@ngrx/effects/testing';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {isEmpty, Observable, of} from 'rxjs';

import {broadcastEffectsActions, checkForUpdateActions} from '../actions/broadcast.actions';
import {initialState, State} from '../reducers/broadcast.reducer';
import {selectIsNewUIVersion} from '../selectors/broadcast.selectors';
import {BroadcastEffects} from './broadcast.effects';

describe('BroadcastEffects', () => {
  let spectator: SpectatorService<BroadcastEffects>;
  let actions$: Observable<any>;
  let effects: BroadcastEffects;
  let store: MockStore<State>;
  let broadcastService: SpyObject<MeBroadcastService>;
  const createService = createServiceFactory({
    service: BroadcastEffects,
    providers: [
      BroadcastEffects,
      provideMockActions(() => actions$),
      provideMockStore<State>({
        initialState: initialState,
      }),
    ],
    mocks: [MeBroadcastService],
  });

  beforeEach(() => {
    spectator = createService();
    effects = spectator.inject(BroadcastEffects);
    store = spectator.inject(MockStore);
    broadcastService = spectator.inject(MeBroadcastService);
  });

  describe('broadcastnewUIVersionBecameAvailable$', () => {
    it('should fire action version available', (done) => {
      store.overrideSelector(selectIsNewUIVersion, false);
      broadcastService.postMessage.and.returnValue(null);
      (async function () {
        actions$ = of(checkForUpdateActions.newUIVersionBecameAvailable());
        effects.broadcastnewUIVersionBecameAvailable$.subscribe((res) => {
          expect(res).toEqual(broadcastEffectsActions.updateOtherTabs());
          done();
        });
      })();
    });

    it('should not fire any action', (done) => {
      store.overrideSelector(selectIsNewUIVersion, true);
      (async function () {
        actions$ = of(checkForUpdateActions.newUIVersionBecameAvailable());
        effects.broadcastnewUIVersionBecameAvailable$.pipe(isEmpty()).subscribe((res) => {
          expect(res).toEqual(true);
          done();
        });
      })();
    });
  });
});
