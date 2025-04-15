import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeWindowService} from './window.service';

describe('MeWindowService', () => {
  let spectator: SpectatorService<MeWindowService>;
  const createService = createServiceFactory({
    service: MeWindowService,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  describe('nativeWindow', () => {
    it('should be window elem', () => {
      expect(spectator.service.nativeWindow).toBe(window);
    });
  });
});
