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
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {DataPrepOutputResponse, EtlJobService} from 'deep-ui/shared/core';
import {JobEntity} from 'deep-ui/shared/models';
import {BehaviorSubject, of} from 'rxjs';
import {catchError, debounceTime, finalize} from 'rxjs/operators';

@Component({
  selector: 'de-download-data-prep-output',
  templateUrl: './download-data-prep-output.component.html',
  styleUrls: ['./download-data-prep-output.component.scss'],
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
export class DownloadDataPrepOutputComponent {
  @Input()
  etlJob: JobEntity;

  @Output()
  closeDialog = new EventEmitter<void>();

  private downloader = inject(MeDownloaderService);
  private fb = inject(FormBuilder);
  private etlJobService = inject(EtlJobService);

  errorMsg = '';

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
  }

  private async _handleDownloadProbeLogs(response: DataPrepOutputResponse): Promise<void> {
    if (response.error) {
      this.errorMsg = response.error;
    } else {
      this.closeDialog.emit();
      await this.downloader.downloadFile(response.url);
    }
  }
}
