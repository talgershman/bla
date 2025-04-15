import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataLoaderService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {DownloadMestClipListComponent} from './download-mest-clip-list.component';

const fakeClipList = getFakeClipList(true);
describe('DownloadMestClipListComponent', () => {
  let spectator: Spectator<DownloadMestClipListComponent>;
  let dataLoaderService: SpyObject<DataLoaderService>;
  let router: SpyObject<Router>;

  const createComponent = createComponentFactory({
    component: DownloadMestClipListComponent,
    imports: [
      MatDialogModule,
      MatButtonModule,
      MeSelectComponent,
      MatProgressSpinnerModule,
      MeTooltipDirective,
      RouterTestingModule,
    ],
    mocks: [MatDialogRef, DataLoaderService, Router, MeDownloaderService],
    componentProviders: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          mestHash: 'hash_fsd',
          clipListS3Key: 's3_path',
          clipsToParamsHashPath: 'hash_path',
        },
      },
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    dataLoaderService = spectator.inject(DataLoaderService);
    router = spectator.inject(Router);

    dataLoaderService.downloadClipList.and.returnValue(of({}));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('downloadClicked', () => {
    it('should call download', () => {
      spectator.component.data = fakeClipList;
      spectator.detectChanges();

      spectator.component.downloadClicked();

      expect(dataLoaderService.downloadClipList).toHaveBeenCalled();
    });
  });

  describe('onExportToClipList', () => {
    it('should redirect', () => {
      spectator.component.data = fakeClipList;
      spectator.detectChanges();

      spectator.component.onExportToClipList();

      expect(dataLoaderService.downloadClipList).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });
  });
});
