import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {DataRetentionKnownKeysEnum} from 'deep-ui/shared/models';

import {PerfectTransformJobsService} from './perfect-transform-job.service';

describe('PerfectTransformJobService', () => {
  let spectator: SpectatorHttp<PerfectTransformJobsService>;

  const createHttp = createHttpFactory({
    service: PerfectTransformJobsService,
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

      expect(name).toBe('perfectTransformJobs');
    });
  });

  describe('getFlowSteps', () => {
    it('should return all step names', () => {
      const steps = spectator.service.getFlowSteps();

      expect(steps).toEqual(['INPUT_VALIDATION', 'ETL_EXECUTION', 'PUBLISHING_DATA_SOURCE']);
    });
  });

  describe('getSingle', () => {
    it('should send request', () => {
      spectator.service.getSingle('123').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('perfect-transform-job/123/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('updateJob', () => {
    it('should call end point', () => {
      spectator.service
        .updateJob('some-id', {tags: ['tag1', 'tag2'], status: 'inactive'})
        .subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('perfect-transform-job/some-id/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('updateDataRetention', () => {
    it('should call end point', () => {
      spectator.service
        .updateDataRetention(['id-1', 'id-2'], {
          [DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: toShortDate(dateNow()),
        })
        .subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('update-data-retention/batch/perfects/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
