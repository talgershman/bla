import {discardPeriodicTasks, fakeAsync, tick} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {provideMockStore} from '@ngrx/store/testing';
import {ToastrService} from 'ngx-toastr';
import {of} from 'rxjs';

import {ImageService} from '../../../services/image/image.service';
import {
  ClipsSampleMessage,
  ClipsSampleWebSocketsManagerService,
} from '../../../services/web-sockets-manager/clips-sample/clips-sample-web-sockets-manager.service';
import {QuerySampleDialogComponent} from './query-sample-dialog.component';
import {ClipSampleMetadataStatus} from './query-sample-dialog-entities';

describe('QuerySampleDialogComponent', () => {
  let spectator: Spectator<QuerySampleDialogComponent>;
  let imageService: jasmine.SpyObj<ImageService>;
  let clipsSampleWebSocketsManagerService: jasmine.SpyObj<ClipsSampleWebSocketsManagerService>;

  const createComponent = createComponentFactory({
    component: QuerySampleDialogComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      ReactiveFormsModule,
      MatProgressSpinnerModule,
      MatIconModule,
      MatFormFieldModule,
      MeAutocompleteComponent,
    ],
    providers: [FormBuilder, provideMockStore()],
    mocks: [MatDialogRef, ImageService, ToastrService, ClipsSampleWebSocketsManagerService],
    componentProviders: [
      {provide: MAT_DIALOG_DATA, useValue: {tableName: 'table_4351553', numberOfClips: 2}},
    ],
    detectChanges: false,
  });

  const firstSample = {
    clipName: 'name 1',
    gfi: 23,
  };
  const secondSample = {
    clipName: 'name 2',
    gfi: 25,
  };

  const msg: ClipsSampleMessage = {
    status: 200,
    content: {
      sample: [firstSample, secondSample],
    },
  };

  beforeEach((): void => {
    spectator = createComponent();
    imageService = spectator.inject(ImageService);
    clipsSampleWebSocketsManagerService = spectator.inject(ClipsSampleWebSocketsManagerService);
    clipsSampleWebSocketsManagerService.connect.and.returnValue(of(msg));
    imageService.getHealthCheck.and.returnValue(of('ok'));
    imageService.getImageSequenceItem.and.returnValue(
      of({
        info: {
          gfi: 1,
          frame_id: 123,
        },
        src: 'https://bla.com',
        request: {
          clip: firstSample.clipName,
        },
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onRefresh', () => {
    beforeEach(() => {
      spyOn(spectator.component, 'runClipsSample');
    });

    it('form valid, should call runClipsSample twice', () => {
      expect(spectator.component.imageServiceForm.invalid).toBeFalse();

      spectator.component.onRefresh();
      spectator.detectChanges();

      expect(spectator.component.runClipsSample).toHaveBeenCalledTimes(2);
    });

    it('form invalid, should call runClipsSample once', () => {
      spectator.component.imageServiceForm.controls.camera.setValue(null);

      expect(spectator.component.imageServiceForm.invalid).toBeTrue();

      spectator.component.onRefresh();
      spectator.detectChanges();

      expect(spectator.component.runClipsSample).toHaveBeenCalledTimes(1);
    });
  });

  describe('onShowMore', () => {
    beforeEach((): void => {
      spectator.detectChanges();
      spectator.component.scrollSectionElem = {
        nativeElement: {
          scrollHeight: 10,
          offsetHeight: 10,
          scroll() {},
        },
      };
      spyOn(spectator.component, 'runClipsSample');
    });

    it('should run "runClipsSample"', () => {
      spectator.detectChanges();

      spectator.component.onShowMore();

      spectator.detectChanges();

      expect(spectator.component.runClipsSample).toHaveBeenCalled();
    });

    it('should not run "runClipsSample"', () => {
      spectator.component.images = [
        {
          clipName: 'clip1',
          gfi: 1,
          src: '',
          frameId: 0,
          status: ClipSampleMetadataStatus.NotSet,
        },
        {
          clipName: 'clip2',
          gfi: 2,
          src: '',
          frameId: 0,
          status: ClipSampleMetadataStatus.NotSet,
        },
      ];

      spectator.detectChanges();

      spectator.component.onShowMore();

      spectator.detectChanges();

      expect(spectator.component.runClipsSample).not.toHaveBeenCalled();
    });
  });

  describe('runClipsSample', () => {
    it('get ClipsSampleMessage', fakeAsync(async () => {
      clipsSampleWebSocketsManagerService.send.and.returnValue(msg);
      imageService.getImageSequenceItem.and.returnValues(
        of({
          info: {
            gfi: 1,
            frame_id: 123,
          },
          src: 'https://bla.com',
          request: {
            clip: firstSample.clipName,
          },
        }),
        of({
          info: {
            gfi: 1,
            frame_id: 123,
          },
          src: 'https://bla.com',
          request: {
            clip: firstSample.clipName,
          },
        }),
      );
      spectator.detectChanges();
      discardPeriodicTasks();
      spectator.component.runClipsSample();
      tick(200);
      discardPeriodicTasks();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.onQuery).toBeFalse();

      expect(spectator.component.images.length).toBe(2);
    }));
  });
});
