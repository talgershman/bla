import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {provideMockActions} from '@ngrx/effects/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {environment} from 'deep-ui/shared/environments';
import {ToastrService} from 'ngx-toastr';
import {Observable, of} from 'rxjs';

import {
  deletePerfectListErrorAction,
  queryClipsSampleErrorAction,
  queryFilePathErrorAction,
  queryRunDatasetQueryErrorAction,
} from '../actions/toast.actions';
import {ToastEffects} from './toast.effects';

describe('ToastEffects', () => {
  let spectator: SpectatorHttp<ToastEffects>;
  let actions$: Observable<any>;
  let effects: ToastEffects;

  const createHttp = createHttpFactory({
    service: ToastEffects,
    providers: [
      ToastEffects,
      MeErrorHandlerService,
      provideMockActions(() => actions$),
      provideMockStore({}),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => {
    spectator = createHttp();
    effects = spectator.inject(ToastEffects);
  });

  describe('errorMsg$', () => {
    it('on queryFilePathErrorAction should fire action success', (done) => {
      (async function () {
        actions$ = of(queryFilePathErrorAction({title: 'Error', bodyText: 'some error msg'}));
        effects.errorMsg$.subscribe(() => {
          expect(true).toBeTrue();
          done();
        });
      })();
    });

    it('on queryRunDatasetQueryErrorAction should fire action success', (done) => {
      (async function () {
        actions$ = of(
          queryRunDatasetQueryErrorAction({
            title: 'Error',
            status: 500,
            request: environment.executeQueryApi,
            response: {someKey: 'some value'},
            json: {someKey: 'some JSON value'},
          })
        );
        effects.errorMsg$.subscribe(() => {
          expect(true).toBeTrue();
          done();
        });
      })();
    });

    it('on queryClipsSampleErrorAction should fire action success', (done) => {
      (async function () {
        actions$ = of(
          queryClipsSampleErrorAction({
            title: 'Error',
            status: 500,
            request: environment.clipsSampleApi,
            response: {someKey: 'some value'},
          })
        );
        effects.errorMsg$.subscribe(() => {
          expect(true).toBeTrue();
          done();
        });
      })();
    });

    it('on deletePerfectListErrorAction should fire action success', (done) => {
      (async function () {
        actions$ = of(deletePerfectListErrorAction({title: 'Error', bodyText: 'some error msg'}));
        effects.errorMsg$.subscribe(() => {
          expect(true).toBeTrue();
          done();
        });
      })();
    });
  });
});
