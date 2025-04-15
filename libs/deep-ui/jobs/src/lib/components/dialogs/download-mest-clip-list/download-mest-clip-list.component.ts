import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Router} from '@angular/router';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  ClipListService,
  DataLoaderClipListStatus,
  DataLoaderService,
  EtlJobService,
} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';
import {BehaviorSubject, from, Observable, of, switchMap} from 'rxjs';
import {catchError, debounceTime, finalize, tap} from 'rxjs/operators';

import {
  MEST_TO_CLIP_LIST_STATUS_OPTIONS,
  NEW_FLOW_MEST_TO_CLIP_LIST_STATUS_OPTIONS,
} from './download-mest-clip-list-entities';

@UntilDestroy()
@Component({
  selector: 'de-download-mest-clip-list',
  templateUrl: './download-mest-clip-list.component.html',
  styleUrls: ['./download-mest-clip-list.component.scss'],
  animations: [MeFadeInOutAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MeSelectComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    MeTooltipDirective,
    ReactiveFormsModule,
    AsyncPipe,
  ],
})
export class DownloadMestClipListComponent implements OnInit {
  @Output()
  closeDialog = new EventEmitter<void>();

  data = inject(MAT_DIALOG_DATA);
  private dataLoaderService = inject(DataLoaderService);
  private etlJobService = inject(EtlJobService);
  private clipListService = inject(ClipListService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  mestClipListStatusOptions: Array<MeSelectOption>;

  statusControl: FormControl;

  clipsListNotFoundMsg: string;

  lastClipList: ClipList;

  DataLoaderClipListStatus = DataLoaderClipListStatus;

  isNewFlow = false;

  private loadingSubscription = new BehaviorSubject<boolean>(false);

  private downloaderService = inject(MeDownloaderService);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  ngOnInit(): void {
    this.isNewFlow = !!(this.data?.jobUuid && this.data?.jobValidStatuses?.length);
    this.mestClipListStatusOptions = this._getClipListStatusOptions();
    this.statusControl = new FormControl<string>(this._getFirstValidId(), Validators.required);
    if (this.statusControl.valid && this.data?.clipListId) {
      this._getClipList(this.data?.clipListId).subscribe();
    }
  }

  onExportToClipList(): void {
    this._downloadClipListByFlow(true, 'Redirecting to create clip list... please wait')
      .pipe(untilDestroyed(this))
      .subscribe((file: File) => {
        if (file) {
          this.router.navigate(['manage/clip-lists/create'], {
            state: {clipList: this.lastClipList, file},
          });
        }
      });
  }

  downloadClicked(): void {
    this.clipsListNotFoundMsg = '';
    this.loadingSubscription.next(true);
    this._downloadClipListByFlow().pipe(untilDestroyed(this)).subscribe();
  }

  private _getClipListStatusOptions(): Array<MeSelectOption> {
    if (!this.isNewFlow) {
      return MEST_TO_CLIP_LIST_STATUS_OPTIONS;
    }

    const jobValidStatusesSet = new Set(
      this.data.jobValidStatuses.map((status: string) => status.toUpperCase()),
    );

    const statusOptions = [...NEW_FLOW_MEST_TO_CLIP_LIST_STATUS_OPTIONS].map(
      (opt: MeSelectOption) => {
        return {...opt, isDisabled: !jobValidStatusesSet.has(opt.id)};
      },
    );
    return statusOptions;
  }

  private _getFirstValidId(): string {
    return this.mestClipListStatusOptions.find((opt: MeSelectOption) => !opt.isDisabled)?.id;
  }

  private _getClipList(clipListId: number): Observable<ClipList> {
    if (this.lastClipList) {
      return of(this.lastClipList);
    }
    return this.clipListService.getSingle(clipListId).pipe(
      catchError(this._handleBadReqForClipList.bind(this)),
      tap((clipList) => {
        this.lastClipList = clipList;
        this.cd.detectChanges();
      }),
    );
  }

  private _downloadClipListByFlow(
    noObjectUrl?: boolean,
    toastMsg?: string,
  ): Observable<void | File> {
    return this.isNewFlow
      ? this._downloadClipListFromStateReflector(noObjectUrl, toastMsg)
      : this._downloadClipList(noObjectUrl, toastMsg);
  }

  private _downloadClipList(noObjectUrl?: boolean, toastMsg?: string): Observable<void | File> {
    const {mestHash, clipListS3Key, clipsToParamsHashPath} = this.data;
    return this.dataLoaderService
      .downloadClipList(
        mestHash,
        clipListS3Key,
        this.statusControl.value,
        clipsToParamsHashPath,
        toastMsg,
        noObjectUrl,
      )
      .pipe(
        tap((_) => this.closeDialog.next()),
        catchError(this._handleBadReqSubmit.bind(this)),
        finalize(() => {
          this.loadingSubscription.next(false);
          this.cd.detectChanges();
        }),
      );
  }

  private _downloadClipListFromStateReflector(
    noObjectUrl?: boolean,
    toastMsg?: string,
  ): Observable<void | File> {
    const {jobUuid} = this.data;
    return this.etlJobService
      .downloadMestClipList(jobUuid, this.statusControl.value, toastMsg)
      .pipe(untilDestroyed(this))
      .pipe(
        switchMap((response: {url: string}) =>
          from(
            response?.url
              ? this.downloaderService.downloadFile(response.url, noObjectUrl)
              : Promise.resolve(),
          ).pipe(
            untilDestroyed(this),
            tap((_) => this.closeDialog.next()),
            catchError(this._handleBadReqSubmit.bind(this)),
            finalize(() => {
              this.loadingSubscription.next(false);
              this.cd.detectChanges();
            }),
          ),
        ),
      );
  }

  private _handleBadReqSubmit(err: HttpErrorResponse): Observable<void | File> {
    return this._handleError(err);
  }

  private _handleBadReqForClipList(err: HttpErrorResponse): Observable<ClipList> {
    return this._handleError(err);
  }

  private _handleError(err: HttpErrorResponse): Observable<null> {
    if (err.status === HttpStatusCode.BadRequest) {
      this.clipsListNotFoundMsg =
        'Download is not available for this job, clip list was not found or was deleted.';
    }
    return of(null);
  }
}
