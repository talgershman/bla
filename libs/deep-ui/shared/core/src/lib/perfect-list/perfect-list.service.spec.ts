import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {getFakePerfectList} from 'deep-ui/shared/testing';
import {throwError} from 'rxjs';

import {PerfectListService} from './perfect-list.service';

describe('PerfectListService', () => {
  let spectator: SpectatorHttp<PerfectListService>;
  let downloader: SpyObject<MeDownloaderService>;

  const createHttp = createHttpFactory({
    service: PerfectListService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
    downloader = spectator.inject(MeDownloaderService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSingle', () => {
    it('should be created', () => {
      spectator.service.getSingle(123, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/perfect-lists/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getMulti', () => {
    it('should be created', () => {
      spectator.service.getMulti({}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/perfect-lists/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be created', () => {
      const fakePerfectList = getFakePerfectList(true);
      spectator.service.create(fakePerfectList, fakePerfectList.name, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/perfect-lists/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should be created', () => {
      const fakePerfectList = getFakePerfectList(true);
      spectator.service
        .update(fakePerfectList.id, fakePerfectList.name, fakePerfectList, {})
        .subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`/perfect-lists/${fakePerfectList.id}`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be created', () => {
      spectator.service.delete(123, 'perfect-list').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('perfect-lists/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkDuplicateName', () => {
    it('should be call', () => {
      spectator.service.checkDuplicateName('name1', 'ROAD', 'ALGO', 123).subscribe();

      spectator.controller.expectOne(
        (req) =>
          req.url.indexOf(
            'perfect-lists/is-duplicate/?id=123&name=name1&rawDataOwner=ALGO&technology=ROAD',
          ) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('syncPerfectList', () => {
    it('should be call', () => {
      spectator.service.syncPerfectList(123).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/perfect-lists/123/sync/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadPerfectList', () => {
    const fakePerfectList = getFakePerfectList(true);

    it('should call download service', () => {
      spectator.service.downloadPerfectList(fakePerfectList);

      const request = spectator.controller.expectOne(
        (req) => req.url.indexOf(`perfect-lists/${fakePerfectList.id}/download/`) !== -1,
      );
      request.flush({url: 'some-url'});
      spectator.controller.verify();

      spectator.controller.verify();

      expect(downloader.downloadFile).toHaveBeenCalled();
    });

    it('error should not call download service', () => {
      spectator.service.downloadPerfectList(fakePerfectList);

      const request = spectator.controller.expectOne(
        (req) => req.url.indexOf(`perfect-lists/${fakePerfectList.id}/download/`) !== -1,
      );
      request.flush(throwError(null));
      spectator.controller.verify();

      expect(downloader.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('getAgGridMulti', () => {
    it('should be called', () => {
      spectator.service.getAgGridMulti({} as any).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/perfect-lists/ag-grid/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
