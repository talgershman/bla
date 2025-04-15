import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  model,
  OnInit,
} from '@angular/core';
import {FormBuilder, FormControl, FormControlStatus, Validators} from '@angular/forms';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeUploadFileComponent} from '@mobileye/material/src/lib/components/upload-file';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {LaunchService, ValidateDatasetResponse} from 'deep-ui/shared/core';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, distinctUntilChanged, first} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-log-file-step',
  templateUrl: './log-file-step.component.html',
  styleUrls: ['./log-file-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeUploadFileComponent, MeErrorFeedbackComponent, AsyncPipe],
})
export class LogFileStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  logFileStepNextClicked: Observable<void>;

  logFileFormFile = model<{
    s3Path: string;
    clipsToParamsHashPath: string;
  }>();

  private fb = inject(FormBuilder);
  private launchService = inject(LaunchService);
  private cd = inject(ChangeDetectorRef);

  selectedFileName: string;

  errorMsg: string;

  logFileForm = this.fb.group({
    file: new FormControl<{
      s3Path: string;
      clipsToParamsHashPath: string;
    }>(null, Validators.required),
  });

  // eslint-disable-next-line
  private fileIsLoading = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  fileIsLoading$ = this.fileIsLoading.asObservable().pipe(distinctUntilChanged());

  ngOnInit(): void {
    this._registerEvents();
  }

  onFileChanged(files: NgxFileDropEntry[]): void {
    this.errorMsg = '';
    this.selectedFileName = '';
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        this.fileIsLoading.next(true);
        fileEntry.file((file: File) => {
          this.launchService
            .uploadPCRunLogFile(file, droppedFile.relativePath)
            .pipe(
              catchError((response) =>
                of({
                  error: getErrorHtmlMsgFromResponse(response, false, true),
                }),
              ),
              first(),
            )
            .subscribe((response: ValidateDatasetResponse) => {
              this.fileIsLoading.next(false);
              this.logFileForm.controls.file.setValue(null);
              if (response?.s3Path) {
                this.selectedFileName = file.name;
                this.logFileForm.controls.file.setValue({
                  s3Path: response.s3Path,
                  clipsToParamsHashPath: response.clipsToParamsHashPath,
                });
              } else {
                const errorObj: any = response.error ? response.error : response;
                this.errorMsg = errorObj.error || errorObj;
              }
              this.cd.detectChanges();
            });
        });
      }
    }
  }

  onNextClicked(): void {
    this.logFileForm.markAsTouched();
    if (this.logFileForm.valid) {
      this.moveToNextStep.emit();
    }
    this.cd.detectChanges();
  }

  private _registerEvents(): void {
    this.logFileStepNextClicked?.pipe(untilDestroyed(this)).subscribe(() => this.onNextClicked());

    this.logFileForm.statusChanges
      ?.pipe(untilDestroyed(this))
      .subscribe((value: FormControlStatus) => this.formState.emit(value));

    this.logFileForm.controls.file.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((val: {s3Path: string; clipsToParamsHashPath: string}) =>
        this.logFileFormFile.set(val),
      );
  }
}
