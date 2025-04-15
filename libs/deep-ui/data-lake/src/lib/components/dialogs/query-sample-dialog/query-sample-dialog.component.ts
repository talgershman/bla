import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import {AppState, queryClipsSampleErrorAction} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {ClipsSampleRequest, ImageServiceRenderedImageRequest} from 'deep-ui/shared/models';
import {debounce} from 'lodash-decorators/debounce';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged, first} from 'rxjs/operators';

import {
  ImageService,
  ImageServiceSequenceItemWithRequestObj,
} from '../../../services/image/image.service';
import {
  ClipsSampleMessage,
  ClipsSampleWebSocketsManagerService,
  SampleGFIMetadata,
} from '../../../services/web-sockets-manager/clips-sample/clips-sample-web-sockets-manager.service';
import {
  cameraOptions,
  CLIPS_SAMPLE_SIZE,
  ClipSampleMetadata,
  ClipSampleMetadataStatus,
  DEFAULT_CAMERA,
  DEFAULT_EXPOSURE,
  DEFAULT_PYRAMID,
  EXPOSURE_TOOLTIP,
  exposureOptions,
  IMAGE_SERVICE_JIRA_TICKET,
  PYRAMID_LEVEL_DEFAULT,
  PYRAMID_LEVEL_TOOLTIP,
  PYRAMID_TOOLTIP,
  pyramidLevelOptions,
  pyramidOptions,
} from './query-sample-dialog-entities';

@UntilDestroy()
@Component({
  selector: 'de-query-sample-dialog',
  templateUrl: './query-sample-dialog.component.html',
  styleUrls: ['./query-sample-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    ReactiveFormsModule,
    MeAutocompleteComponent,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    NgTemplateOutlet,
    AsyncPipe,
  ],
})
export class QuerySampleDialogComponent implements OnInit {
  @ViewChild('clipsSampleLoading', {static: true})
  clipsSampleLoadingTmpl: TemplateRef<any>;

  @ViewChild('imageServiceResults', {static: true})
  imageServiceResultsTmpl: TemplateRef<any>;

  @ViewChild('scrollSection', {read: ElementRef})
  scrollSectionElem: ElementRef;

  ClipSampleMetadataStatus = ClipSampleMetadataStatus;

  onCheckingImageServiceHealth = false;

  onQuery = false;

  onFormChanged: boolean;

  tableName: string;

  numberOfClips: number;

  imagesBeingQueriedForFrameId = 0;

  images: ClipSampleMetadata[];

  viewImages: string[];

  excludeClips: string[];

  prevViewImages: string[];

  prevExcludeClips: string[];

  allViewImages: ClipSampleMetadata[];

  allImagesRenderedSubject: BehaviorSubject<boolean>;

  allImagesAreExcludedSubject: BehaviorSubject<boolean>;

  allImagesRendered$: Observable<boolean>;

  allImagesAreExcluded$: Observable<boolean>;

  runClipsSampleErrorMsg: string;

  clipsSampleResultsContainerTmpl: TemplateRef<any>;

  data = inject(MAT_DIALOG_DATA);
  private imageService = inject(ImageService);
  private clipsSampleWebSocketsManagerService = inject(ClipsSampleWebSocketsManagerService);
  private fb = inject(FormBuilder);
  private store = inject<Store<AppState>>(Store);
  private dialogRef = inject<MatDialogRef<QuerySampleDialogComponent>>(MatDialogRef);
  private cd = inject(ChangeDetectorRef);

  imageServiceForm = this.fb.group({
    camera: new FormControl<{id: string; name: string}>(
      {value: {id: DEFAULT_CAMERA, name: DEFAULT_CAMERA}, disabled: false},
      {
        validators: Validators.compose([Validators.required]),
      },
    ),
    exposure: new FormControl<{id: string; name: string}>(
      {value: {id: DEFAULT_EXPOSURE, name: DEFAULT_EXPOSURE}, disabled: false},
      {
        validators: Validators.compose([Validators.required]),
      },
    ),
    pyramid: new FormControl<{id: string; name: string}>(
      {value: {id: DEFAULT_PYRAMID, name: DEFAULT_PYRAMID}, disabled: false},
      {
        validators: Validators.compose([Validators.required]),
      },
    ),
    pyramidLevel: new FormControl<{id: string; name: number}>({
      value: {id: '', name: null},
      disabled: false,
    }),
  });

  cameraOptions: string[];

  exposureOptions: string[];

  pyramidOptions: string[];

  pyramidLevelOptions: string[];

  exposureTooltip: string = EXPOSURE_TOOLTIP;

  pyramidTooltip: string = PYRAMID_TOOLTIP;

  pyramidLevelTooltip: string = PYRAMID_LEVEL_TOOLTIP;

  imageServiceJiraTicket: string = IMAGE_SERVICE_JIRA_TICKET;

  ngOnInit(): void {
    this._resetState();
    this._initState();
    this._setAllOptions();
    this._initForm();
    this._setCurrentViewToLoadingTmpl();
    this._subscribeChecks();
    this.runClipsSample();
  }

  onRefresh(): void {
    this.imageServiceForm.markAllAsTouched();
    if (this.imageServiceForm.valid) {
      if (this.runClipsSampleErrorMsg) {
        this._disableAllControls();
      }
      this._resetState();
      this._resetSubjects();
      this._setCurrentViewToLoadingTmpl();
      this.runClipsSample();
    }
  }

  onShowMore(): void {
    if (this.numberOfClips === this.images.length + this.imagesBeingQueriedForFrameId) {
      return;
    }
    this.runClipsSampleErrorMsg = '';
    this._scrollToBottom();
    this.runClipsSample();
    this.prevViewImages.push(...this.viewImages);
    this.viewImages = [];
    this.prevExcludeClips.push(...this.excludeClips);
    this.excludeClips = [];
    this._resetSubjects();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onImageLoad(clipSampleMetadata: ClipSampleMetadata): void {
    clipSampleMetadata.status = ClipSampleMetadataStatus.Loaded;
    this.viewImages = [...this.viewImages, clipSampleMetadata.src];
    this.allViewImages = [...this.allViewImages, clipSampleMetadata];
    this._checkImagesLengthEqualAllRendered();
    this.cd.detectChanges();
  }

  onMissingImage(clipSampleMetadata: Partial<ClipSampleMetadata>): void {
    clipSampleMetadata.status = ClipSampleMetadataStatus.Error;
    this.excludeClips = [...this.excludeClips, clipSampleMetadata.clipName];
    this._checkImagesLengthEqualAllExcludeClips();
    this._checkImagesLengthEqualAllRendered();
    this.cd.detectChanges();
  }

  onAutoCompleteChanged(): void {
    this.onFormChanged = true;
  }

  // eslint-disable-next-line
  @debounce(100)
  runClipsSample(): void {
    this.onQuery = true;
    this._connectToExecuteClipsSample();

    this.clipsSampleWebSocketsManagerService.send(this._getClipsSampleRequest(), false);

    this.cd.detectChanges();
  }

  private _initState(): void {
    this.tableName = this.data?.tableName;
    this.numberOfClips = this.data?.numberOfClips;
    this.allImagesRenderedSubject = new BehaviorSubject<boolean>(false);
    this.allImagesAreExcludedSubject = new BehaviorSubject<boolean>(false);
    this.allImagesRendered$ = this.allImagesRenderedSubject as Observable<boolean>;
    this.allImagesAreExcluded$ = this.allImagesAreExcludedSubject as Observable<boolean>;
  }

  private _resetState(): void {
    this.images = [];
    this.viewImages = [];
    this.excludeClips = [];
    this.prevViewImages = [];
    this.prevExcludeClips = [];
    this.allViewImages = [];
    this.imagesBeingQueriedForFrameId = 0;
    this.runClipsSampleErrorMsg = '';
    this.onFormChanged = false;
  }

  private _resetSubjects(): void {
    this.allImagesRenderedSubject?.next(false);
    this.allImagesAreExcludedSubject?.next(false);
  }

  private _enableAllControls(): void {
    this.imageServiceForm.controls.camera.enable();
    this.imageServiceForm.controls.exposure.enable();
    this.imageServiceForm.controls.pyramid.enable();
    this.imageServiceForm.controls.pyramidLevel.enable();
  }

  private _disableAllControls(): void {
    this.imageServiceForm.controls.camera.disable();
    this.imageServiceForm.controls.exposure.disable();
    this.imageServiceForm.controls.pyramid.disable();
    this.imageServiceForm.controls.pyramidLevel.disable();
  }

  private _subscribeChecks(): void {
    this.allImagesRendered$
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((isImagesLengthEqualAllRendered: boolean) => {
        if (isImagesLengthEqualAllRendered) {
          this._enableAllControls();
        } else {
          this._disableAllControls();
        }
      });

    this.allImagesAreExcluded$.pipe(distinctUntilChanged(), untilDestroyed(this)).subscribe();
  }

  private _setAllOptions(): void {
    this.cameraOptions = cameraOptions;
    this.exposureOptions = exposureOptions;
    this.pyramidOptions = pyramidOptions;
    this.pyramidLevelOptions = pyramidLevelOptions;
  }

  private _initForm(): void {
    this.imageServiceForm.controls.camera.setValue(this.imageServiceForm.controls.camera.value);
  }

  private _setCurrentViewToLoadingTmpl(): void {
    this.clipsSampleResultsContainerTmpl = this.clipsSampleLoadingTmpl;
  }

  private _scrollToBottom(): void {
    this.scrollSectionElem.nativeElement.scroll({
      top: this.scrollSectionElem.nativeElement.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  private _checkImagesLengthEqualAllRendered(): void {
    if (
      this.imagesBeingQueriedForFrameId + this.images.length ===
      this.prevViewImages.length +
        this.viewImages.length +
        this.excludeClips.length +
        this.prevExcludeClips.length
    ) {
      this.allImagesRenderedSubject.next(true);
    } else {
      this.allImagesRenderedSubject.next(false);
    }
  }

  private _checkImagesLengthEqualAllExcludeClips(): void {
    if (
      this.imagesBeingQueriedForFrameId + this.images.length ===
      this.excludeClips.length + this.prevExcludeClips.length
    ) {
      this.allImagesAreExcludedSubject.next(true);
    } else {
      this.allImagesAreExcludedSubject.next(false);
    }
  }

  private _getClipsSampleRequest(): ClipsSampleRequest {
    return {
      tableName: this.tableName,
      sampleSize: CLIPS_SAMPLE_SIZE,
      excludeClips: this.images.map((img: ClipSampleMetadata) => img.clipName),
    };
  }

  private _onClipsSampleMessageReceived(message: ClipsSampleMessage): void {
    if (message.status === 500) {
      this._handleErrorResponse(message);
    } else if (message.status === 400) {
      this.runClipsSampleErrorMsg = message.error || 'Oops ! Something went wrong.';
      this._enableAllControls();
    } else if (message.status === 200) {
      this._handleOKResponse(message);
    }
  }

  private _handleOKResponse(message: ClipsSampleMessage): void {
    this.onCheckingImageServiceHealth = true;
    this.runClipsSampleErrorMsg = '';
    this.imageService
      .getHealthCheck()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this._getClipsSampleMetadata(message);
          this.onCheckingImageServiceHealth = false;
          this.cd.detectChanges();
        },
        error: () => {
          this.runClipsSampleErrorMsg = 'Image service is down.';
          this._enableAllControls();
          this.onCheckingImageServiceHealth = false;
          this.cd.detectChanges();
        },
      });
  }

  private _handleErrorResponse(message: ClipsSampleMessage): void {
    this.store.dispatch(
      queryClipsSampleErrorAction({
        title: 'Error',
        status: 500,
        request: environment.clipsSampleApi,
        response: message.error,
      }),
    );
    this.runClipsSampleErrorMsg = 'Oops ! Something went wrong.';
    this._enableAllControls();
  }

  private _getClipsSampleMetadata(message: ClipsSampleMessage): void {
    this.imagesBeingQueriedForFrameId = message.content.sample.length;
    for (const item of message.content.sample) {
      const imageReq = this._getImageServiceRenderedImageRequest(item);
      this.imageService
        .getImageSequenceItem(imageReq)
        .pipe(first())
        .subscribe((response: ImageServiceSequenceItemWithRequestObj) => {
          this.imagesBeingQueriedForFrameId = this.imagesBeingQueriedForFrameId - 1;
          if (!response?.info) {
            this.images = [
              ...this.images,
              {
                status: ClipSampleMetadataStatus.Error,
                clipName: response.request.clip,
              } as any,
            ];
            this.onMissingImage({
              clipName: response.request.clip,
            });
          } else {
            this.images = [
              ...this.images,
              {
                src: response.src,
                gfi: response.info.gfi,
                frameId: response.info.frame_id,
                status: ClipSampleMetadataStatus.NotSet,
                clipName: response.request.clip,
              },
            ];
          }
          this.cd.detectChanges();
        });
    }
  }

  private _onClipsSampleResponse(msg: string): void {
    this.clipsSampleResultsContainerTmpl = this.imageServiceResultsTmpl;
    if (msg && !this.runClipsSampleErrorMsg) {
      this.runClipsSampleErrorMsg = msg;
      this._enableAllControls();
    }
    this.onQuery = false;
    this.cd.detectChanges();
  }

  private _connectToExecuteClipsSample(): void {
    const clipsSampleResult$ = this.clipsSampleWebSocketsManagerService.connect(
      this._getClipsSampleRequest(),
    );

    clipsSampleResult$.pipe(untilDestroyed(this)).subscribe(
      (message: ClipsSampleMessage) => {
        this._onClipsSampleMessageReceived(message);
        this._onClipsSampleResponse('');
      },
      (error: CloseEvent) => {
        this._onClipsSampleResponse(
          `some error occurred- reason: ${error.reason}, code ${error.code}, wasClean: ${error.wasClean}`,
        );
      },
    );
  }

  private _getImageServiceRenderedImageRequest(
    sampleMetadata: SampleGFIMetadata,
  ): ImageServiceRenderedImageRequest {
    const obj: ImageServiceRenderedImageRequest = {
      clip: sampleMetadata.clipName,
      camera: this.imageServiceForm.controls.camera.value?.name,
      exposure: this.imageServiceForm.controls.exposure.value?.name,
      pyramid: this.imageServiceForm.controls.pyramid.value?.name,
      pyramid_level:
        this.imageServiceForm.controls.pyramidLevel.value?.name || PYRAMID_LEVEL_DEFAULT,
      gfi: 'gfi' in sampleMetadata ? sampleMetadata.gfi : null,
      frame_id: 'frame_id' in sampleMetadata ? sampleMetadata.frame_id : null,
    };

    return obj;
  }
}
