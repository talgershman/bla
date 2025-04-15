import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import _isEqual from 'lodash-es/isEqual';

import {OnPremService, QueryFileSystemObject} from './on-prem.service';

describe('OnPremService', () => {
  let spectator: SpectatorHttp<OnPremService>;

  const createHttp = createHttpFactory({
    service: OnPremService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('queryFileSystem', () => {
    it('should send correct request', () => {
      const expectedRequestBody = {
        paths: [
          {
            absolutePath: '/root-path/file.txt',
            type: 'folder',
          },
        ],
      };
      spectator.service
        .queryFileSystem(expectedRequestBody.paths[0].absolutePath, 'folder')
        .subscribe();

      spectator.controller.expectOne(
        (req) =>
          req.url.indexOf('/query-file-system/') !== -1 &&
          _isEqual(req.body.paths, expectedRequestBody.paths)
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('queryPathsFileSystem', () => {
    it('should send correct request', () => {
      const rootPath = '/root-path/';
      const paths = ['folder/path1.txt', 'path2.txt'];
      const expectedRequestBody = {
        paths: [
          {
            absolutePath: `${rootPath}${paths[0]}`,
            type: 'file',
          },
          {
            absolutePath: `${rootPath}${paths[1]}`,
            type: 'file',
          },
        ],
      };

      spectator.service.queryPathsFileSystem(rootPath, paths, 'file').subscribe();

      spectator.controller.expectOne(
        (req) =>
          req.url.indexOf('/query-file-system/') !== -1 &&
          _isEqual(req.body.paths, expectedRequestBody.paths)
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('queryPaths', () => {
    it('should send correct request', () => {
      const rootPath = '/root-path/';
      const paths = ['folder/path1.txt', 'path2.txt'];
      const expectedRequestBody = {
        paths: [
          {
            absolutePath: `${rootPath}${paths[0]}`,
            type: 'file',
          },
          {
            absolutePath: `${rootPath}${paths[1]}`,
            type: 'file',
          },
        ],
      };

      const items: Array<QueryFileSystemObject> = [
        {
          type: 'file',
          absolutePath: `${rootPath}${paths[0]}`,
        },
        {
          type: 'file',
          absolutePath: `${rootPath}${paths[1]}`,
        },
      ];
      spectator.service.queryPaths(items).subscribe();

      spectator.controller.expectOne(
        (req) =>
          req.url.indexOf('/query-file-system/') !== -1 &&
          _isEqual(req.body.paths, expectedRequestBody.paths)
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
