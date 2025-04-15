import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {FormBuilder, FormControl, FormControlStatus, Validators} from '@angular/forms';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {
  generateHtmlMessageFromObject,
  getErrorHtmlMsgFromResponse,
} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {ClipToLogOutputsComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/clip-to-log/clip-to-log-outputs';
import {LaunchService, LogsDirFilterType, ValidateDatasetResponse} from 'deep-ui/shared/core';
import {EtlJobRunType} from 'deep-ui/shared/models';
import {OnChange} from 'property-watch-decorator';
import {BehaviorSubject, forkJoin, Observable, of} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  first,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-clip-to-log-outputs-step',
  templateUrl: './clip-to-log-outputs-step.component.html',
  styleUrls: ['./clip-to-log-outputs-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    MatProgressSpinnerModule,
    ClipToLogOutputsComponent,
    MeErrorFeedbackComponent,
    MeSafePipe,
    AsyncPipe,
  ],
})
export class ClipToLogOutputsStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  triggerValidateStep: Observable<void>;

  @Input()
  runType: EtlJobRunType;

  @Input()
  filterType: LogsDirFilterType;

  @OnChange<void>('_onFileChanged')
  @Input()
  file: any;

  @OnChange<void>('_onClipListIdChanged')
  @Input()
  clipListId: number;

  private launchService = inject(LaunchService);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private hostElement = inject(ElementRef);

  mainErrorFeedback: string;

  dependentErrorFeedback: string;

  mainEgoMotionFeedback: string;

  dependentEgoMotionFeedback: string;

  loadingSubscription = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  form = this.fb.group({
    selectOutputDirs: this.fb.group({
      mainItrksDir: new FormControl<string>('', Validators.required),
      mainLogDirs: new FormControl<Partial<{logDirs: string}>[]>(null, Validators.required),
      mainS3Path: new FormControl<string>(''),
      mainMetadata: new FormControl<any>(null),
      dependentItrksDir: new FormControl<string>(''),
      dependentLogDirs: new FormControl<Partial<{logDirs: string}>[]>(null),
      dependentS3Path: new FormControl<string>(''),
      dependentMetadata: new FormControl<any>(null),
      file: new FormControl<any>(null),
    }),
    isValid: new FormControl<boolean>(true, MeFormValidations.trueValidator()),
  });

  EtlJobRunType = EtlJobRunType;

  ngOnInit(): void {
    this._setValidation();
    this._registerEvents();
  }

  onSelectOutputNextClicked(): void {
    if (this.runType === EtlJobRunType.COMPARE_VERSIONS) {
      this._scrollToBottom();
      this._handleCompareVersionFlow();
    } else {
      this._handleRegularFlow();
    }
  }

  onValidateEgoMotion(isMain: boolean): void {
    const {mainS3Path, dependentS3Path} = this.form.controls.selectOutputDirs.value;
    const s3Path = isMain ? mainS3Path : dependentS3Path;
    this.form.controls.isValid.setValue(false);
    this.loadingSubscription.next(true);
    if (s3Path) {
      this.handleValidateEgoMotion(isMain)
        .pipe(
          finalize(() => {
            this.loadingSubscription.next(false);
            this.form.controls.isValid.setValue(true);
          }),
        )
        .subscribe();
    } else {
      this.handleValidateClipToLogOutputs(isMain)
        .pipe(
          filter((response: any) => !response.error),
          switchMap(this.handleValidateEgoMotion.bind(this, isMain)),
          finalize(() => {
            this.loadingSubscription.next(false);
            this.form.controls.isValid.setValue(true);
          }),
        )
        .subscribe();
    }
  }

  onOutputDirFormChanged(
    value: Partial<{logDirs: Partial<{logDirs: string}>[]; itrksDir: string}>,
    isMain: boolean,
  ): void {
    const {itrksDir, logDirs} = value || {};

    if (isMain) {
      this.form.controls.selectOutputDirs.patchValue({
        mainItrksDir: itrksDir || null,
        mainLogDirs: logDirs || null,
        mainS3Path: null,
      });
    } else {
      this.form.controls.selectOutputDirs.patchValue({
        dependentItrksDir: itrksDir || null,
        dependentLogDirs: logDirs || null,
        dependentS3Path: null,
      });
    }
  }

  private _scrollToBottom(): void {
    this.hostElement.nativeElement.parentElement.scroll({
      top: this.hostElement.nativeElement.parentElement.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  private _onFileChanged(file: any): void {
    this.form.controls.selectOutputDirs.controls.file.setValue(file ?? null);
    this.mainErrorFeedback = '';
    this.mainEgoMotionFeedback = '';
    this.dependentErrorFeedback = '';
    this.dependentEgoMotionFeedback = '';
  }

  private _onClipListIdChanged(_: number): void {
    this.mainErrorFeedback = '';
    this.mainEgoMotionFeedback = '';
    this.dependentErrorFeedback = '';
    this.dependentEgoMotionFeedback = '';
  }

  private _handleCompareVersionFlow(): void {
    const {mainS3Path, dependentS3Path} = this.form.controls.selectOutputDirs.value;
    if (mainS3Path && dependentS3Path) {
      this.moveToNextStep.emit();
    } else {
      this.form.controls.isValid.setValue(false);
      this.loadingSubscription.next(true);
      forkJoin([
        this.handleValidateClipToLogOutputs(true),
        this.handleValidateClipToLogOutputs(false),
      ])
        .pipe(
          finalize(() => {
            this.loadingSubscription.next(false);
            this.form.controls.isValid.setValue(true);
          }),
          filter((responses: Array<any>) => {
            return !responses[0].error && !responses[1].error;
          }),
        )
        .subscribe(() => this.moveToNextStep.emit());
    }
  }

  private _handleRegularFlow(): void {
    const {mainS3Path} = this.form.controls.selectOutputDirs.value;
    if (mainS3Path) {
      this.moveToNextStep.emit();
    } else {
      this.form.controls.isValid.setValue(false);
      this.loadingSubscription.next(true);
      this.handleValidateClipToLogOutputs(true)
        .pipe(
          finalize(() => {
            this.loadingSubscription.next(false);
            this.form.controls.isValid.setValue(true);
          }),
          filter((response: any) => !response.error),
        )
        .subscribe(() => this.moveToNextStep.emit());
    }
  }

  private handleValidateEgoMotion(isMain: boolean): Observable<any> {
    if (isMain) {
      this.mainErrorFeedback = '';
      this.mainEgoMotionFeedback = '';
    } else {
      this.dependentErrorFeedback = '';
      this.dependentEgoMotionFeedback = '';
    }
    const {mainS3Path, dependentS3Path} = this.form.controls.selectOutputDirs.value;
    const s3Path = isMain ? mainS3Path : dependentS3Path;
    return this.launchService.validateEgoMotion(s3Path).pipe(
      map((response: any) => generateHtmlMessageFromObject(response)),
      catchError((response: HttpErrorResponse) =>
        of({
          error: getErrorHtmlMsgFromResponse(response, true),
        }),
      ),
      tap((response: any) => {
        if (response.error) {
          if (isMain) {
            this.mainErrorFeedback = response.error;
          } else {
            this.dependentErrorFeedback = response.error;
          }
        } else if (isMain) {
          this.mainEgoMotionFeedback = response;
        } else {
          this.dependentEgoMotionFeedback = response;
        }
        this.cd.detectChanges();
      }),
      first(),
    );
  }

  private handleValidateClipToLogOutputs(isMain: boolean): Observable<any> {
    if (isMain) {
      this.mainErrorFeedback = '';
      this.mainEgoMotionFeedback = '';
    } else {
      this.dependentErrorFeedback = '';
      this.dependentEgoMotionFeedback = '';
    }
    const {mainLogDirs, dependentLogDirs, file} = this.form.controls.selectOutputDirs.value;
    const logDirs = isMain ? mainLogDirs : dependentLogDirs;
    const logDirsValue = logDirs.map((obj) => obj.logDirs);
    const filterListS3Path = file && file.s3Path ? file.s3Path : undefined;
    const filterType = this.filterType;
    const filterByClipListId = this.clipListId;
    return this.launchService
      .validateClipToLogOutputs(logDirsValue, filterType, filterByClipListId, filterListS3Path)
      .pipe(
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response, true),
          }),
        ),
        tap((response: ValidateDatasetResponse) => {
          this.form.controls.selectOutputDirs.patchValue({
            ...this.form.controls.selectOutputDirs.value,
          });
          if (isMain) {
            this.form.controls.selectOutputDirs.patchValue({
              mainS3Path: null,
              mainMetadata: null,
            });
          } else {
            this.form.controls.selectOutputDirs.patchValue({
              dependentS3Path: null,
              dependentMetadata: null,
            });
          }
          if (response.error) {
            if (isMain) {
              this.mainErrorFeedback = response.error;
            } else {
              this.dependentErrorFeedback = response.error;
            }
            this.cd.detectChanges();
          } else if (isMain) {
            this.form.controls.selectOutputDirs.patchValue({
              ...this.form.controls.selectOutputDirs.value,
              mainS3Path: response.s3Path,
              mainMetadata: this._getMetadata(response),
            });
          } else {
            this.form.controls.selectOutputDirs.patchValue({
              ...this.form.controls.selectOutputDirs.value,
              dependentS3Path: response.s3Path,
              dependentMetadata: this._getMetadata(response),
            });
          }
        }),
        first(),
      );
  }

  private _getMetadata(response: ValidateDatasetResponse): {[p: string]: any} {
    if (this.clipListId) {
      return {...response.metadata, filtered_list_id: this.clipListId};
    }
    return response.metadata;
  }

  private _setValidation(): void {
    if (this.runType === EtlJobRunType.COMPARE_VERSIONS) {
      this.form.controls.selectOutputDirs.controls.dependentItrksDir.setValidators(
        Validators.required,
      );
      this.form.controls.selectOutputDirs.controls.dependentLogDirs.setValidators(
        Validators.required,
      );
    }
  }

  private _registerEvents(): void {
    this.triggerValidateStep
      ?.pipe(untilDestroyed(this))
      .subscribe(() => this.onSelectOutputNextClicked());
    this.form.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.form.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => {
        this.formState.emit(value);
      });
  }
}
