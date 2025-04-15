import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeBroadcastService} from '.';

describe('MeBroadcastService', () => {
  let spectator: SpectatorService<MeBroadcastService>;

  const createService = createServiceFactory({
    service: MeBroadcastService,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('createBroadcast', () => {
    it('should return correct BroadcastChannel name', () => {
      const broadcastName = 'test';
      const broadcast = spectator.service.createBroadcast(broadcastName);

      expect(broadcast.name).toBe(broadcastName);
    });

    it('should return the same BroadcastChannel instance', () => {
      const broadcast1 = spectator.service.createBroadcast('test1');
      const broadcast2 = spectator.service.createBroadcast('test1');

      expect(broadcast1).toEqual(broadcast2);
    });
  });
});
