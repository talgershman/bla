import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {ToastrService} from 'ngx-toastr';

import {MeErrorHandlerService} from './error-handler.service';

describe('MeErrorHandlerService', () => {
  let spectator: SpectatorHttp<MeErrorHandlerService>;
  const createHttp = createHttpFactory({
    service: MeErrorHandlerService,
    mocks: [ToastrService],
  });

  beforeEach((): void => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
