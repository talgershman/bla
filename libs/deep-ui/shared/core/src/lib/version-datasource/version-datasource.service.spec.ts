import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {VersionDatasourceService} from './version-datasource.service';

describe('VersionDatasourceService', () => {
  let spectator: SpectatorHttp<VersionDatasourceService>;

  const createHttp = createHttpFactory({
    service: VersionDatasourceService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
