import {MatFormFieldModule} from '@angular/material/form-field';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeUploadFileComponent} from '@mobileye/material/src/lib/components/upload-file';
import {DropFileEventMock} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {LaunchService} from 'deep-ui/shared/core';
import {NgxFileDropEntry} from 'ngx-file-drop';
import {of} from 'rxjs';

import {LogFileStepComponent} from './log-file-step.component';

describe('LogFileStepComponent', () => {
  let spectator: Spectator<LogFileStepComponent>;
  let launchService: SpyObject<LaunchService>;

  const createComponent = createComponentFactory({
    component: LogFileStepComponent,
    imports: [
      MeUploadFileComponent,
      MeInputComponent,
      MatFormFieldModule,
      MeErrorFeedbackComponent,
    ],
    mocks: [LaunchService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    launchService = spectator.inject(LaunchService);
    launchService.uploadPCRunLogFile.and.returnValue(
      of({
        s3Path: 'some-key',
        clipsToParamsHashPath: 'some-hash',
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onFileChanged', () => {
    it('should select file', () => {
      spectator.detectChanges();
      const files: NgxFileDropEntry[] = new DropFileEventMock('some mock file').files;
      spectator.detectChanges();

      spectator.component.onFileChanged(files);

      expect(spectator.component.selectedFileName).toBe(files[0].fileEntry.name);
      expect(spectator.component.logFileForm.controls.file).not.toBeNull();
    });
  });
});
