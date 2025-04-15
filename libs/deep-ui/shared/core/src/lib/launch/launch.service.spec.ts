import {fakeFile} from '@mobileye/material/src/lib/testing';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {LogsDirFilterType} from 'deep-ui/shared/core';

import {LaunchService} from './launch.service';

describe('LaunchService', () => {
  let spectator: SpectatorHttp<LaunchService>;

  const createHttp = createHttpFactory({
    service: LaunchService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('submitJob', () => {
    it('should send request', () => {
      spectator.service.submitJob({} as any).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('launch/submit-job/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('validateClipToLogOutputs', () => {
    it('should send request', () => {
      spectator.service
        .validateClipToLogOutputs(
          ['some-folder/folder', 'folder2'],
          LogsDirFilterType.NO_FILTER,
          null,
        )
        .subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('validate-clip2log-outputs') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('validateEgoMotion', () => {
    it('should send request', () => {
      spectator.service.validateEgoMotion('some-key').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('validate-av-egomotion-data') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('validateUserParams', () => {
    it('should send request', () => {
      spectator.service
        .validateUserParams(55, {
          'dataPrep': {configuration: {}},
          'probeLogic': {configuration: {}},
        })
        .subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('launch/validate-user-params') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('uploadPCRunLogFile', () => {
    it('should send request', () => {
      const file = fakeFile('file1');
      spectator.service.uploadPCRunLogFile(file, file.name).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('upload-pc-run-logs-list/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
