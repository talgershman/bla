import {Injectable} from '@angular/core';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {
  convertEtlJobStepStringToTitle,
  EtlJobStepEnum,
  getEtlJobFlowSteps,
  StateEnum,
} from 'deep-ui/shared/models';

import {BaseJobService} from './base-job.service';

@Injectable()
export class MockService extends BaseJobService {
  agGridBaseUrl = '';
  getModelNamePlural(): string {
    return 'validationJobs';
  }

  getFlowSteps(): string[] {
    return getEtlJobFlowSteps();
  }

  convertStepToTitle(flowStep: string): string {
    return convertEtlJobStepStringToTitle(flowStep);
  }
}

describe('BaseJobService', () => {
  let spectator: SpectatorHttp<MockService>;

  const createHttp = createHttpFactory({
    service: MockService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('findStepInJobStatusMetadata', () => {
    it('should return null', () => {
      const jobStatusMetadata = [
        {
          step: EtlJobStepEnum.PROBE,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.PROBE,
          state: StateEnum.STARTED,
        },
        {
          step: EtlJobStepEnum.PARSING,
          state: StateEnum.DONE,
        },
        {
          step: EtlJobStepEnum.PARSING,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.PARSING,
          state: StateEnum.STARTED,
        },
        {
          step: EtlJobStepEnum.MEST,
          state: StateEnum.DONE,
        },
        {
          step: EtlJobStepEnum.MEST,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.MEST,
          state: StateEnum.STARTED,
        },
      ];

      const steps = spectator.service.findStepInJobStatusMetadata(
        EtlJobStepEnum.REPORT.toString(),
        jobStatusMetadata as any,
      );

      expect(steps).toEqual(null);
    });

    it('should requested JobStatusMetadata ', () => {
      const jobStatusMetadata = [
        {
          step: EtlJobStepEnum.PROBE,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.PROBE,
          state: StateEnum.STARTED,
        },
        {
          step: EtlJobStepEnum.PARSING,
          state: StateEnum.DONE,
        },
        {
          step: EtlJobStepEnum.PARSING,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.PARSING,
          state: StateEnum.STARTED,
        },
        {
          step: EtlJobStepEnum.MEST,
          state: StateEnum.DONE,
        },
        {
          step: EtlJobStepEnum.MEST,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.MEST,
          state: StateEnum.STARTED,
        },
      ];

      const step = spectator.service.findStepInJobStatusMetadata(
        EtlJobStepEnum.PARSING.toString(),
        jobStatusMetadata as any,
      );

      const expectedStep = {
        step: EtlJobStepEnum.PARSING,
        state: StateEnum.DONE,
      };

      expect(step).toEqual(expectedStep as any);
    });
  });

  describe('getEtlErrorLogs', () => {
    it('should send request', () => {
      spectator.service.getEtlErrorLogs('some-id').subscribe(() => {});

      spectator.controller.expectOne(
        (req) => req.url.indexOf('probe-errors/?jobUuid=some-id') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadEtlErrorLogs', () => {
    it('should send request', () => {
      spectator.service.downloadEtlErrorLogs('some-id');

      spectator.controller.expectOne(
        (req) => req.url.indexOf('probe-errors/?jobUuid=some-id') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadParsingErrorLogs', () => {
    it('should send request', () => {
      spectator.service.downloadParsingErrorLogs('some-id');

      spectator.controller.expectOne(
        (req) => req.url.indexOf('parsing-errors/?jobUuid=some-id') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
