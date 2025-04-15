import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MePortalService} from './portal.service';

describe('MePortalService', () => {
  let spectator: SpectatorService<MePortalService>;
  const createService = createServiceFactory({
    service: MePortalService,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
