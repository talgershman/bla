import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {EtlJobService} from 'deep-ui/shared/core';

import {DataRetentionService} from './data-retention.service';

describe('DataRetentionService', () => {
  let spectator: SpectatorService<DataRetentionService>;

  const createService = createServiceFactory({
    service: DataRetentionService,
    // eslint-disable-next-line
    mocks: [EtlJobService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
