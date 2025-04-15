import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {MeAzureGraphService} from './azure-graph.service';

describe('MeAzureGraphService', () => {
  let spectator: SpectatorHttp<MeAzureGraphService>;
  const createHttp = createHttpFactory({
    service: MeAzureGraphService,
  });

  beforeEach((): void => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getPhoto', () => {
    it('should call correct end point', () => {
      spectator.service.getPhoto().subscribe();
      spectator.controller.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value');
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });

    it('should return null if error', () => {
      let response: any = 'wrong value';
      spectator.service.getPhoto().subscribe((data) => {
        response = data;
      });
      spectator.controller
        .expectOne('https://graph.microsoft.com/v1.0/me/photo/$value')
        .flush(new Blob(), {status: 500, statusText: '1'});
      spectator.controller.verify();

      expect(response).toBeNull();
    });
  });
});
