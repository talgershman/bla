import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeLoadingService} from './loading.service';

describe('MeLoadingService', () => {
  let spectator: SpectatorService<MeLoadingService>;
  const createService = createServiceFactory({
    service: MeLoadingService,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
