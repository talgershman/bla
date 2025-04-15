import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {provideMockStore} from '@ngrx/store/testing';

import {MeCheckForUpdateService} from './check-for-update.service';

describe('MeCheckForUpdate', () => {
  let spectator: SpectatorHttp<MeCheckForUpdateService>;

  const createHttp = createHttpFactory({
    service: MeCheckForUpdateService,
    providers: [provideMockStore({})],
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
