import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';

import {QueryEngineService} from './query-engine.service';

describe('QueryEngineService', () => {
  let spectator: SpectatorHttp<QueryEngineService>;
  let downloadService: SpyObject<MeDownloaderService>;

  const createHttp = createHttpFactory({
    service: QueryEngineService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
    downloadService = spectator.inject(MeDownloaderService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('downloadClipList', () => {
    it('should be called', async () => {
      await spectator.service.downloadClipList(true, 'table1');

      expect(downloadService.downloadFileWithAuth).toHaveBeenCalled();
    });
  });
});
