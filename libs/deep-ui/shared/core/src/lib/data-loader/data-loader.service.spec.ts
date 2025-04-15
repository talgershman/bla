import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {of} from 'rxjs';

import {DataLoaderClipListStatus, DataLoaderService} from './data-loader.service';

describe('DataLoaderService', () => {
  let spectator: SpectatorHttp<DataLoaderService>;
  let downloadService: jasmine.SpyObj<MeDownloaderService>;

  const createHttp = createHttpFactory({
    service: DataLoaderService,
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
    it('should be called', () => {
      const mestHash = 'mest_hash';
      const clipListS3Key = 's3_path';
      const status = DataLoaderClipListStatus.VALID;
      const clipsToParamsHashPath = undefined;
      downloadService.postDownloadFileWithAuth.and.returnValue(of(null));
      spectator.service
        .downloadClipList(mestHash, clipListS3Key, status, clipsToParamsHashPath)
        .subscribe();

      expect(downloadService.postDownloadFileWithAuth).toHaveBeenCalled();
    });
  });

  describe('getMestCloudCmd', () => {
    it('should be called', () => {
      spectator.service.getMestCloudCmd('123').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/cloud-mest-cmd-for-local-run/123/') !== -1
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
