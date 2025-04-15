import {MsalBroadcastService, MsalService} from '@azure/msal-angular';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {provideMockStore} from '@ngrx/store/testing';

import {MeUpdateUserSessionGuard} from './update-user-session.guard';

describe('MeUpdateUserSessionGuard', () => {
  let spectator: SpectatorService<MeUpdateUserSessionGuard>;
  const createService = createServiceFactory({
    service: MeUpdateUserSessionGuard,
    mocks: [MsalService, MsalBroadcastService, MeUserPreferencesService],
    providers: [provideMockStore()],
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
