import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {MeTimerService} from './timer.service';

describe('MeTimerService', () => {
  let spectator: SpectatorService<MeTimerService>;
  let service: MeTimerService;

  const createService = createServiceFactory({
    service: MeTimerService,
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(MeTimerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('interval', () => {
    expect(service.interval(200)).toBeDefined();
  });

  it('timer', () => {
    expect(service.timer(200, 200)).toBeDefined();
  });
});
