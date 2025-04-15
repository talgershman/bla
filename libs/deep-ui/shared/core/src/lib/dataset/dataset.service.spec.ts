import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {getFakeDataset} from 'deep-ui/shared/testing';

import {DatasetService} from './dataset.service';

describe('DatasetService', () => {
  let spectator: SpectatorHttp<DatasetService>;
  let downloadService: SpyObject<MeDownloaderService>;

  const createHttp = createHttpFactory({
    service: DatasetService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
    downloadService = spectator.inject(MeDownloaderService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSingle', () => {
    it('should be created', () => {
      spectator.service.getSingle('123', {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasets/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getMulti', () => {
    it('should be created', () => {
      spectator.service.getMulti({}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasets/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be created', () => {
      const fakeDataset = getFakeDataset(true);
      spectator.service.create(fakeDataset, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasets/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should be created', () => {
      const fakeDataset = getFakeDataset(true);
      spectator.service.update(fakeDataset.id, fakeDataset, {}).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`/datasets/${fakeDataset.id}`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be deleted', () => {
      spectator.service.delete(123, 'data-set').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('datasets/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getAgGridMulti', () => {
    it('should be called', () => {
      spectator.service.getAgGridMulti({} as any).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasets/ag-grid/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkDuplicateName', () => {
    it('should be called', () => {
      spectator.service.checkDuplicateName('name1', 'team1', 2).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/datasets/validate-name/?id=2&name=name1&team=team1') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadJumpFile', () => {
    it('should call download', async () => {
      const fakeDataSet = getFakeDataset(true);

      await spectator.service.downloadJumpFile(fakeDataSet, 1);

      expect(downloadService.downloadFileWithAuth).toHaveBeenCalled();
    });
  });

  describe('downloadClipList', () => {
    it('should call download', async () => {
      const fakeDataSet = getFakeDataset(true);

      await spectator.service.downloadClipList(fakeDataSet);

      expect(downloadService.downloadFileWithAuth).toHaveBeenCalled();
    });
  });
});
