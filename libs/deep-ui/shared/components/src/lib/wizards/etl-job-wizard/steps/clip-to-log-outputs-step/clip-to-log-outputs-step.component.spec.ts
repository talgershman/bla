import {HttpErrorResponse} from '@angular/common/http';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeUploadFileComponent} from '@mobileye/material/src/lib/components/upload-file';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ClipToLogOutputsComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/clip-to-log/clip-to-log-outputs';
import {LaunchService} from 'deep-ui/shared/core';
import {of, throwError} from 'rxjs';

import {ClipToLogOutputsStepComponent} from './clip-to-log-outputs-step.component';

describe('ClipToLogOutputsStepComponent', () => {
  let spectator: Spectator<ClipToLogOutputsStepComponent>;
  let launchService: SpyObject<LaunchService>;

  const createComponent = createComponentFactory({
    component: ClipToLogOutputsStepComponent,
    imports: [
      ClipToLogOutputsComponent,
      MeErrorFeedbackComponent,
      MatProgressSpinnerModule,
      MeSafePipe,
      MeInputComponent,
      MeUploadFileComponent,
    ],
    mocks: [LaunchService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    launchService = spectator.inject(LaunchService);
    launchService.uploadClipToLogFile.and.returnValue(
      of({
        s3Path: 'some-key',
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onOutputDirFormChanged ', () => {
    it('should emit event', async () => {
      const outputs = {
        itrksDir: 'some-folder/folder',
        logDirs: [{logDirs: 'log1'}, {logDirs: 'log2'}],
      };
      spyOn(spectator.component.form.controls.selectOutputDirs, 'patchValue');
      spectator.detectChanges();

      spectator.component.onOutputDirFormChanged(outputs, true);

      expect(spectator.component.form.controls.selectOutputDirs.patchValue).toHaveBeenCalledWith({
        mainItrksDir: 'some-folder/folder',
        mainLogDirs: [{logDirs: 'log1'}, {logDirs: 'log2'}],
        mainS3Path: null,
      });
    });
  });

  describe('onSelectOutputNextClicked ', () => {
    beforeEach(() => {
      spectator.component.form.controls.selectOutputDirs.patchValue({
        mainLogDirs: [{logDirs: '123'}, {logDirs: '123'}],
        mainItrksDir: '123',
        mainS3Path: null,
      });
    });

    it('should return valid response', async () => {
      spyOn(spectator.component.form.controls.selectOutputDirs, 'patchValue');
      launchService.validateClipToLogOutputs.and.returnValue(of({s3Path: 'some-key'}));
      spectator.detectChanges();

      spectator.component.onSelectOutputNextClicked();

      expect(spectator.component.form.controls.selectOutputDirs.patchValue).toHaveBeenCalled();
    });

    it('should handle error', async () => {
      launchService.validateClipToLogOutputs.and.returnValue(
        throwError(
          new HttpErrorResponse({
            error: {
              message: 'Here some message...',
              localizedKey: 'someKey',
            },
            status: 500,
          }),
        ),
      );
      spectator.detectChanges();

      spectator.component.onSelectOutputNextClicked();

      expect(spectator.component.mainErrorFeedback).toBe('Oops ! Something went wrong.');
    });
  });

  describe('onValidateEgoMotion ', () => {
    beforeEach(() => {
      launchService.validateEgoMotion.and.returnValue(of({details: 'some clips 23/50 are valid'}));
      launchService.validateClipToLogOutputs.and.returnValue(
        of({s3Path: 'some-key', metadata: null}),
      );
    });

    it('should send only validate ego motion request', async () => {
      spectator.component.form.controls.selectOutputDirs.patchValue({
        mainLogDirs: [{logDirs: '123'}, {logDirs: '123'}],
        mainItrksDir: '123',
        mainS3Path: 'some-key',
        mainMetadata: null,
      });

      spectator.detectChanges();

      spectator.component.onValidateEgoMotion(true);

      expect(spectator.component.mainEgoMotionFeedback).toBe(
        'Details - Some clips 23/50 are valid<br />',
      );
    });

    it('should send validate outputs & ego motion', async () => {
      spectator.component.form.controls.selectOutputDirs.patchValue({
        mainLogDirs: [{logDirs: '123'}, {logDirs: '123'}],
        mainItrksDir: '123',
        mainS3Path: null,
        mainMetadata: null,
      });
      spectator.detectChanges();

      spectator.component.onValidateEgoMotion(true);

      expect(spectator.component.mainEgoMotionFeedback).toBe(
        'Details - Some clips 23/50 are valid<br />',
      );
    });

    it('should handle error', async () => {
      spectator.component.form.controls.selectOutputDirs.patchValue({
        mainLogDirs: [{logDirs: '123'}, {logDirs: '123'}],
        mainItrksDir: '123',
        mainS3Path: 'some-key',
        mainMetadata: null,
      });

      launchService.validateEgoMotion.and.returnValue(
        throwError(
          new HttpErrorResponse({
            error: {
              message: 'Here some message...',
              localizedKey: 'someKey',
            },
            status: 500,
          }),
        ),
      );
      spectator.detectChanges();

      spectator.component.onValidateEgoMotion(true);

      expect(spectator.component.mainErrorFeedback).toBe('Oops ! Something went wrong.');
    });
  });
});
