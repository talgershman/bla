import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {UserGroupsInterceptor} from './user-groups.interceptor';

describe('UserGroupsInterceptor', () => {
  let spectator: SpectatorService<UserGroupsInterceptor>;
  const createService = createServiceFactory({
    service: UserGroupsInterceptor,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
