import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {EtlJobService} from 'deep-ui/shared/core';
import {getFakeEtlJob} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {DownloadErrorLogsComponent} from './download-error-logs.component';

describe('DownloadErrorLogsComponent', () => {
  let spectator: Spectator<DownloadErrorLogsComponent>;
  let etlJobService: SpyObject<EtlJobService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DownloadErrorLogsComponent,
    imports: [
      MatButtonModule,
      MatIconModule,
      MatDialogModule,
      MeJsonEditorComponent,
      ReactiveFormsModule,
      MatProgressSpinnerModule,
      MeErrorFeedbackComponent,
    ],
    mocks: [EtlJobService, MeDownloaderService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        jobUuid: getFakeEtlJob().jobUuid,
      },
    });
    etlJobService = spectator.inject(EtlJobService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const jsonData = {};
    const blob = new Blob([JSON.stringify(jsonData)], {type: 'application/json'});
    const file = new File([blob], 'data.json', {type: 'application/json'});
    etlJobService.getEtlErrorLogs.and.returnValue(of({url: 'fake-url', file}));
  });

  it('should create', () => {
    spectator.fixture.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should fetch and process error logs successfully', async () => {
    const jsonData = {message: 'Error log sample'};
    const blob = new Blob([JSON.stringify(jsonData)], {type: 'application/json'});
    const file = new File([blob], 'data.json', {type: 'application/json'});

    etlJobService.getEtlErrorLogs.and.returnValue(of({file}));
    spectator.fixture.detectChanges();
    await spectator.component.ngOnInit();

    expect(spectator.component.file()).toBeTruthy();
    expect(spectator.component.jsonControl.value).toEqual(jsonData);
    expect(spectator.component.initialized()).toBeTrue();
  });

  it('should display error message when fetching logs fails', async () => {
    etlJobService.getEtlErrorLogs.and.returnValue(of(null));

    spectator.fixture.detectChanges();
    await spectator.component.ngOnInit();

    expect(spectator.component.errorMsg()).toBe('Failed to download error logs');
  });

  it('should call downloadErrorLogs on button click', async () => {
    spyOn(spectator.component, 'downloadErrorLogs');
    spectator.fixture.detectChanges();

    await MeButtonHarness.click(spectator.fixture, loader, {text: 'download'});
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.downloadErrorLogs).toHaveBeenCalled();
  });

  it('should copy formatted JSON to clipboard', async () => {
    spyOn(spectator.component, 'copyCmdToClipboard');
    spectator.fixture.detectChanges();

    await MeButtonHarness.click(spectator.fixture, loader, {text: 'content_copy'});
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.copyCmdToClipboard).toHaveBeenCalled();
  });
});
