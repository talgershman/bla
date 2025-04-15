import {Location} from '@angular/common';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeSidenavService} from './sidenav.service';

describe('MeSidenavService', () => {
  let spectator: SpectatorService<MeSidenavService>;

  const createService = createServiceFactory({
    service: MeSidenavService,
    mocks: [Location, MeUserPreferencesService],
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
