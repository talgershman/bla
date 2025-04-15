import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {provideMockActions} from '@ngrx/effects/testing';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {Observable, of, throwError} from 'rxjs';

import {AssetManagerService} from '../../asset-manager/asset-manager.service';
import {
  loadTechnologiesAPIActions,
  loadTechnologiesClipListResolver,
} from '../actions/common.actions';
import {State} from '../reducers/common.reducer';
import {selectIsTechnologiesLoaded} from '../selectors/common.selectors';
import {CommonEffects} from './common.effects';

describe('CommonEffects', () => {
  let spectator: SpectatorHttp<CommonEffects>;
  let actions$: Observable<any>;
  let effects: CommonEffects;
  let store: MockStore<State>;
  let assetManagerService: SpyObject<AssetManagerService>;
  const fakeTechnologies = ['AV', 'TFL'];

  const createHttp = createHttpFactory({
    service: CommonEffects,
    providers: [
      CommonEffects,
      provideMockActions(() => actions$),
      provideMockStore<State>({
        initialState: {technologies: [], isTechnologiesLoaded: false},
      }),
    ],
    mocks: [AssetManagerService],
  });

  beforeEach(() => {
    spectator = createHttp();
    effects = spectator.inject(CommonEffects);
    store = spectator.inject(MockStore);
    assetManagerService = spectator.inject(AssetManagerService);
  });

  describe('loadTechnologies$', () => {
    it('should fire action success', (done) => {
      store.overrideSelector(selectIsTechnologiesLoaded, false);
      assetManagerService.getTechnologies.and.returnValue(of(fakeTechnologies));
      (async function () {
        actions$ = of(loadTechnologiesClipListResolver());
        effects.loadTechnologies$.subscribe((res) => {
          expect(res).toEqual(
            loadTechnologiesAPIActions.loadTechnologiesSuccess({
              technologies: fakeTechnologies,
            })
          );
          done();
        });
      })();
    });

    it('should fire action failed', (done) => {
      store.overrideSelector(selectIsTechnologiesLoaded, false);
      assetManagerService.getTechnologies.and.returnValue(throwError({}));
      (async function () {
        actions$ = of(loadTechnologiesClipListResolver());
        effects.loadTechnologies$.subscribe((res) => {
          expect(res).toEqual(loadTechnologiesAPIActions.loadTechnologiesFailed());
          done();
        });
      })();
    });

    it('should load from cache', (done) => {
      store.overrideSelector(selectIsTechnologiesLoaded, true);
      store.setState({technologies: fakeTechnologies, isTechnologiesLoaded: true});
      (async function () {
        actions$ = of(loadTechnologiesClipListResolver());
        effects.loadTechnologies$.subscribe((res) => {
          expect(res).toEqual(loadTechnologiesAPIActions.loadTechnologiesFromCache());
          done();
        });
      })();
    });
  });
});
