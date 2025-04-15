import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {LazyLoadComponentService} from './lazy-load-component.service';

describe('LazyLoadComponentService', () => {
  let spectator: SpectatorService<LazyLoadComponentService>;
  const createService = createServiceFactory({
    service: LazyLoadComponentService,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
