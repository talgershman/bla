import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {DataRetentionKnownKeysEnum} from 'deep-ui/shared/models';

import {EtlJobService, StateReflectorMestClipListStatus} from './etl-job.service';

describe('EtlJobService', () => {
  let spectator: SpectatorHttp<EtlJobService>;

  const createHttp = createHttpFactory({
    service: EtlJobService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('modelNamePlural', () => {
    it('should correct model name', () => {
      const name = spectator.service.getModelNamePlural();

      expect(name).toBe('validationJobs');
    });
  });

  describe('getFlowSteps', () => {
    it('should return all step names', () => {
      const steps = spectator.service.getFlowSteps();

      expect(steps).toEqual(['MEST', 'PARSING', 'PROBE', 'REPORT']);
    });
  });

  describe('downloadClipLogs', () => {
    it('should send request', () => {
      spectator.service.downloadClipLogs('some-id', 'some-clip-name').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('probe-logs/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadMestClipList', () => {
    it('should send request', () => {
      const id = 'some-id';
      spectator.service
        .downloadMestClipList(id, StateReflectorMestClipListStatus.VALID)
        .subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`base-job/${id}/mest-clip-list-by-status/`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadDataPrepOutput', () => {
    it('should send request', () => {
      spectator.service.downloadDataPrepOutput('some-id', 'some-clip-name').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('data-prep-output/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadLogicOutput', () => {
    it('should send request', () => {
      spectator.service.downloadLogicOutput('some-id', 'some-clip-name').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('logic-output/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadRuntimeStats', () => {
    it('should send request', () => {
      spectator.service.downloadRuntimeStats('some-id', 'data-prep');

      spectator.controller.expectOne((req) => req.url.indexOf('runtime-stats/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadClipList', () => {
    it('should send request', () => {
      spectator.service.downloadClipList('some-id');

      spectator.controller.expectOne((req) => req.url.indexOf('clip-list/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getDataRetentionConfig', () => {
    it('should send request', () => {
      spectator.service.getDataRetentionConfig().subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('fixed-response/?name=dataRetention') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getSingle', () => {
    it('should send request', () => {
      spectator.service.getSingle('123').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('job/123/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('updateJob', () => {
    it('should call end point', () => {
      spectator.service
        .updateJob('some-id', {tags: ['tag1', 'tag2'], status: 'inactive'})
        .subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('job/some-id/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('updateDataRetention', () => {
    it('should call end point', () => {
      spectator.service
        .updateDataRetention(['id-1', 'id-2'], {
          [DataRetentionKnownKeysEnum.ETL_RESULTS]: toShortDate(dateNow()),
        })
        .subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('update-data-retention/batch/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getLastOutputPath', () => {
    it('should call end point', () => {
      spectator.service.getLastOutputPath('name-1', 'team-1').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('last-output-path/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
