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

import {DownloadOutputsComponent, DownloadOutputTypeEnum} from './download-outputs.component';

describe('DownloadOutputsComponent', () => {
  let spectator: Spectator<DownloadOutputsComponent>;
  let etlJobService: SpyObject<EtlJobService>;
  let downloaderService: SpyObject<MeDownloaderService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DownloadOutputsComponent,
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      MeInputComponent,
      ReactiveFormsModule,
      MeErrorFeedbackComponent,
    ],
    providers: [],
    mocks: [EtlJobService, MeDownloaderService],
    detectChanges: false,
  });

  beforeEach(async () => {
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

  describe('onSaveClicked and Data Prep output type', async () => {
    beforeEach(async () => {
      spectator.component.outputType = DownloadOutputTypeEnum.DATA_PREP;
    });

    it('form invalid - no request should be send', async () => {
      spectator.fixture.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Download'});

      expect(downloaderService.downloadFile).toHaveBeenCalledTimes(0);
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

  describe('onSaveClicked and Logic output type', async () => {
    beforeEach(async () => {
      spectator.component.outputType = DownloadOutputTypeEnum.LOGIC;
    });

    it('form invalid - showLogicOutputs is false', async () => {
      etlJobService.downloadLogicOutput.and.returnValue([]);
      spectator.fixture.detectChanges();

      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Download'});

      expect(spectator.component.showLogicOutputs).toEqual(false);
      expect(spectator.component.linksItems).toEqual(undefined);
    });

    it('form valid and valid response - showLogicOutputs is true', async () => {
      etlJobService.downloadLogicOutput.and.returnValue(
        of({
          url1: 'some-url1',
          url2: 'some-url2',
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

      expect(spectator.component.showLogicOutputs).toEqual(true);

      expect(spectator.component.linksItems).toEqual([
        {
          label: 'url1',
          href: 'some-url1',
        },
        {
          label: 'url2',
          href: 'some-url2',
        },
      ]);
    });

    it('form valid and error response - error message', async () => {
      etlJobService.downloadLogicOutput.and.returnValue(
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
    });
  });
});
