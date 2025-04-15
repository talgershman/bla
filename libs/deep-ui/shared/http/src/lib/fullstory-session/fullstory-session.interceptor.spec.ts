import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {FullStorySessionInterceptor} from './fullstory-session.interceptor';

describe('FullStorySessionInterceptor', () => {
  let spectator: SpectatorService<FullStorySessionInterceptor>;
  const createService = createServiceFactory({
    service: FullStorySessionInterceptor,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
