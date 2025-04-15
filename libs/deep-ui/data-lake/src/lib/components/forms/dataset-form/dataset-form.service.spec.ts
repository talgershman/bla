import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {QueryUtilService} from '../../../query-utils/query-util.service';
import {DatasetFormService} from './dataset-form.service';

describe('DatasetFormService', () => {
  let spectator: SpectatorService<DatasetFormService>;
  let service: DatasetFormService;
  const createService = createServiceFactory({
    service: DatasetFormService,
    providers: [QueryUtilService],
  });
  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(DatasetFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
