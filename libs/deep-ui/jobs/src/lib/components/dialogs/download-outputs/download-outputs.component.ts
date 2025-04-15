import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeLinkItem} from '@mobileye/material/src/lib/components/header';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {DataPrepOutputResponse, EtlJobService, LogicOutputResponse} from 'deep-ui/shared/core';
import {JobEntity} from 'deep-ui/shared/models';
import {BehaviorSubject, of} from 'rxjs';
import {catchError, debounceTime, finalize} from 'rxjs/operators';

export enum DownloadOutputTypeEnum {
  DATA_PREP = 'DATA_PREP',
  LOGIC = 'LOGIC',
}

@Component({
  selector: 'de-download-outputs',
  templateUrl: './download-outputs.component.html',
  styleUrls: ['./download-outputs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MeInputComponent,
    MatProgressSpinnerModule,
    MeErrorFeedbackComponent,
    MatButtonModule,
    AsyncPipe,
  ],
})
export class DownloadOutputsComponent {
  @Input()
  etlJob: JobEntity;

  @Input()
  outputType: DownloadOutputTypeEnum;

  @Output()
  closeDialog = new EventEmitter<void>();

  errorMsg = '';

  outputTypeName = {
    [DownloadOutputTypeEnum.DATA_PREP]: 'data preparation',
    [DownloadOutputTypeEnum.LOGIC]: 'logic',
  };

  outputTypeDataRetention = {
    [DownloadOutputTypeEnum.DATA_PREP]: 'two weeks',
    [DownloadOutputTypeEnum.LOGIC]: 'one week',
  };

  linksItems: Array<MeLinkItem>;

  showLogicOutputs = false;

  private downloader = inject(MeDownloaderService);
  private fb = inject(FormBuilder);
  private etlJobService = inject(EtlJobService);

  form = this.fb.group({
    clipName: new FormControl<string>(null, Validators.required),
  });

  private loadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  onSaveClicked(): void {
    this.form.controls.clipName.markAsTouched();
    if (this.form.controls.clipName.valid) {
      this.errorMsg = '';
      const clipName = this.form.controls.clipName.value.trim();
      this.loadingSubscription.next(true);
      switch (this.outputType) {
        case DownloadOutputTypeEnum.DATA_PREP: {
          this._handleDataPrep(clipName);
          break;
        }
        case DownloadOutputTypeEnum.LOGIC: {
          this._handleLogic(clipName);
          break;
        }
        default: {
          // eslint-disable-next-line
          const exhaustiveCheck: never = this.outputType;
          throw new Error(`Unhandled onSaveClicked case: ${exhaustiveCheck}`);
        }
      }
    }
  }

  private _handleDataPrep(clipName: string): void {
    this.etlJobService
      .downloadDataPrepOutput(this.etlJob.jobUuid, clipName)
      .pipe(
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, false),
          }),
        ),
        finalize(() => this.loadingSubscription.next(false)),
      )
      .subscribe(async (response: DataPrepOutputResponse): Promise<void> => {
        await this._handleDownloadProbeLogs(response);
      });
  }

  private _handleLogic(clipName: string): void {
    this.showLogicOutputs = false;
    this.linksItems = [];
    this.etlJobService
      .downloadLogicOutput(this.etlJob.jobUuid, clipName)
      .pipe(
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, false),
          }),
        ),
        finalize(() => this.loadingSubscription.next(false)),
      )
      .subscribe((response: LogicOutputResponse) => this._handleDownloadLogicLogs(response));
  }

  private async _handleDownloadProbeLogs(response: DataPrepOutputResponse): Promise<void> {
    if (response.error) {
      this.errorMsg = response.error;
    } else {
      this.closeDialog.emit();
      await this.downloader.downloadFile(response.url);
    }
  }

  private _handleDownloadLogicLogs(response: LogicOutputResponse): void {
    if (response.error) {
      this.errorMsg = response.error;
    } else {
      this.showLogicOutputs = true;
      for (const [classifier, url] of Object.entries(response)) {
        this.linksItems.push({
          label: classifier,
          href: url,
        });
      }
    }
  }
}
