import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {HttpErrorResponse} from '@angular/common/http';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeButtonHarness, MeInputHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {EtlJobService} from 'deep-ui/shared/core';
import {getFakeEtlJob} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {DownloadDataPrepOutputComponent} from './download-data-prep-output.component';

describe('DownloadDataPrepOutputComponent', () => {
  let spectator: Spectator<DownloadDataPrepOutputComponent>;
  let etlJobService: SpyObject<EtlJobService>;
  let downloaderService: SpyObject<MeDownloaderService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DownloadDataPrepOutputComponent,
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      MeInputComponent,
      ReactiveFormsModule,
      MeErrorFeedbackComponent,
    ],
    mocks: [EtlJobService, MeDownloaderService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    etlJobService = spectator.inject(EtlJobService);
    downloaderService = spectator.inject(MeDownloaderService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.component.etlJob = getFakeEtlJob();
  });

  it('should create', () => {
    spectator.fixture.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSaveClicked', async () => {
    it('form invalid - no request should be send', async () => {
      spectator.fixture.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Download'});

      expect(etlJobService.downloadClipLogs).toHaveBeenCalledTimes(0);
    });

    it('send etl log with clip name - valid response', async () => {
      etlJobService.downloadDataPrepOutput.and.returnValue(
        of({
          url: 'some-url',
        }),
      );

      spectator.detectChanges();

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.clip-name-control'},
        'some-clip-name',
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Download'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(downloaderService.downloadFile).toHaveBeenCalledTimes(1);
    });

    it('send probe log with clip name - error response', async () => {
      etlJobService.downloadDataPrepOutput.and.returnValue(
        throwError(
          new HttpErrorResponse({
            error: 'some error msg',
            status: 400,
          }),
        ),
      );
      spectator.detectChanges();

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.clip-name-control'},
        'some-clip-name',
      );

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Download'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.errorMsg).toBe('<span>some error msg<span>');
      expect(downloaderService.downloadFile).toHaveBeenCalledTimes(0);
    });
  });
});
