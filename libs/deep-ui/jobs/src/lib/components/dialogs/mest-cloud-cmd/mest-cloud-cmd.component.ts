import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {DataLoaderService, MestCloudCmdResponse} from 'deep-ui/shared/core';
import {BehaviorSubject, of} from 'rxjs';
import {catchError, debounceTime, finalize} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-mest-cloud-cmd',
  templateUrl: './mest-cloud-cmd.component.html',
  styleUrls: ['./mest-cloud-cmd.component.scss'],
  animations: [MeFadeInOutAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MeErrorFeedbackComponent,
    AsyncPipe,
  ],
})
export class MestCloudCmdComponent implements OnInit {
  @Output()
  closeDialog = new EventEmitter<void>();

  data = inject(MAT_DIALOG_DATA);
  private dataLoaderService = inject(DataLoaderService);
  private snackbar = inject(MeSnackbarService);

  private loadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  errorMsg: string;

  cmdControl = new FormControl<string>({value: '', disabled: true});

  ngOnInit(): void {
    const {jobUuid} = this.data;
    this.loadingSubscription.next(true);
    this.dataLoaderService
      .getMestCloudCmd(jobUuid)
      .pipe(
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, false),
          }),
        ),
        untilDestroyed(this),
        finalize(() => this.loadingSubscription.next(false)),
      )
      .subscribe((response: MestCloudCmdResponse) => {
        if (response.error) {
          this.errorMsg = response.error;
        } else {
          this.cmdControl.setValue(response.cmd);
        }
      });
  }

  copyCmdToClipboard(value: string): void {
    copy(value);
    this.snackbar.onCopyToClipboard();
  }
}
