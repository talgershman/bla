import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {ImageServiceRenderedImageRequest} from 'deep-ui/shared/models';

import {ImageService, ImageServiceSequenceResponse} from './image.service';

describe('ImageService', () => {
  let spectator: SpectatorHttp<ImageService>;

  const createHttp = createHttpFactory({
    service: ImageService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getHealthCheck', () => {
    it('should be called', () => {
      spectator.service.getHealthCheck().subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('healthz') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getImageSequenceItem', () => {
    it('request with gfi - should be called ', (done) => {
      const imageServiceRenderedImageRequest: ImageServiceRenderedImageRequest = {
        clip: 'clip2',
        gfi: 6,
        exposure: 'IMG1',
        pyramid: 'ltm',
        camera: 'main',
      };
      const mockData: ImageServiceSequenceResponse = {
        items: [
          {
            src: 'http://bad324.com',
            info: {
              gfi: 2,
              frame_id: 4,
            },
          },
          {
            src: 'http://good-found123.com',
            info: {
              gfi: 6,
              frame_id: 23,
            },
          },
        ],
      };
      spectator.service.getImageSequenceItem(imageServiceRenderedImageRequest).subscribe((data) => {
        expect(data.src).toEqual('http://good-found123.com');
        expect(data.info).toEqual({
          gfi: 6,
          frame_id: 23,
        });

        expect(data.request).toEqual({
          clip: 'clip2',
        });
        done();
      });

      spectator.controller
        .expectOne(
          (req) =>
            req.url.indexOf(
              'v1/api/clips/clip2/sequence.json?camera=main&exposure=IMG1&pyramid=ltm'
            ) !== -1
        )
        .flush(mockData);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });

    it('request with frame_id - should be called ', (done) => {
      const imageServiceRenderedImageRequest: ImageServiceRenderedImageRequest = {
        clip: 'clip1',
        frame_id: 4,
        exposure: 'IMG1',
        pyramid: 'ltm',
        camera: 'main',
      };
      const mockData: ImageServiceSequenceResponse = {
        items: [
          {
            src: 'http://bla435345.com',
            info: {
              gfi: 2,
              frame_id: 4,
            },
          },
          {
            src: 'http://bad-found123.com',
            info: {
              gfi: 6,
              frame_id: 23,
            },
          },
        ],
      };
      spectator.service.getImageSequenceItem(imageServiceRenderedImageRequest).subscribe((data) => {
        expect(data.src).toEqual('http://bla435345.com');
        expect(data.info).toEqual({
          gfi: 2,
          frame_id: 4,
        });

        expect(data.request).toEqual({
          clip: 'clip1',
        });
        done();
      });

      spectator.controller
        .expectOne(
          (req) =>
            req.url.indexOf(
              'v1/api/clips/clip1/sequence.json?camera=main&exposure=IMG1&pyramid=ltm'
            ) !== -1
        )
        .flush(mockData);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
