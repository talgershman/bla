import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {FullStoryResponseTimeInterceptor} from './fullstory-response-time.interceptor';

describe('FullStoryResponseTimeInterceptor', () => {
  let spectator: SpectatorService<FullStoryResponseTimeInterceptor>;
  const createService = createServiceFactory({
    service: FullStoryResponseTimeInterceptor,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
