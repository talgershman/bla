import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {ToastrService} from 'ngx-toastr';

import {MeDownloaderService} from './downloader.service';

describe('MeDownloaderService', () => {
  let spectator: SpectatorHttp<MeDownloaderService>;
  const createHttp = createHttpFactory({
    service: MeDownloaderService,
    providers: [MeErrorHandlerService],
    mocks: [ToastrService],
  });

  beforeEach((): void => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
