import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {AssetManagerService} from './asset-manager.service';

describe('AssetManagerService', () => {
  let spectator: SpectatorHttp<AssetManagerService>;
  const createHttp = createHttpFactory(AssetManagerService);

  beforeEach((): void => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getTechnologiesOptions', () => {
    it('should convert to options', (done) => {
      const mockData = ['AV', 'TFL', 'ROAD'];
      const expectedResult: MeSelectOption[] = [
        {
          id: 'AV',
          value: 'AV',
        },
        {
          id: 'TFL',
          value: 'TFL',
        },
        {
          id: 'ROAD',
          value: 'ROAD',
        },
      ];

      spectator.service.getTechnologiesOptions().subscribe((result) => {
        expect(result).toEqual(expectedResult);
        done();
      });

      const request = spectator.controller.expectOne(
        (req) => req.url.indexOf('technologies/') !== -1
      );
      request.flush(mockData);
    });
  });
});
