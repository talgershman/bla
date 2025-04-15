import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {FullStoryService} from './fullstory.service';

describe('FullStoryService', () => {
  let spectator: SpectatorService<FullStoryService>;

  const createService = createServiceFactory({
    service: FullStoryService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
