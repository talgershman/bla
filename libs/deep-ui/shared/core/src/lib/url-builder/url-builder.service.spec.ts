import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {UrlBuilderService} from './url-builder.service';

describe('UrlBuilderService', () => {
  let spectator: SpectatorHttp<UrlBuilderService>;

  const createHttp = createHttpFactory({
    service: UrlBuilderService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });
});
