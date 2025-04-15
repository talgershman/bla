import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {JobFormBuilderService, OnPremService} from 'deep-ui/shared/core';
import {DeepFormValidations} from 'deep-ui/shared/validators';
import {Partial} from 'lodash-decorators';
import {OnChange} from 'property-watch-decorator';
import {filter} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-clip-to-log-outputs',
  templateUrl: './clip-to-log-outputs.component.html',
  styleUrls: ['./clip-to-log-outputs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MeInputComponent,
    MatButtonModule,
    MeControlListComponent,
    MatFormFieldModule,
    MatIconModule,
  ],
})
export class ClipToLogOutputsComponent implements OnInit {
  @OnChange<void>('disableConditionChanged')
  @Input()
  disableCondition: boolean;

  @HostBinding('style.--width')
  @Input()
  width: string;

  @Output()
  formChanged = new EventEmitter<
    Partial<{logDirs: Partial<{logDirs: string}>[]; itrksDir: string}>
  >();

  @Output()
  validateEgoMotion = new EventEmitter<void>();

  /* eslint-disable */
  private jobFormBuilderService = inject(JobFormBuilderService);
  private fb = inject(FormBuilder);
  private onPremService = inject(OnPremService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  /* eslint-enable */

  outputDirsForm = this.fb.group({
    logDirs: new FormArray<
      FormGroup<{
        logDirs: FormControl<string>;
      }>
    >([]),
    itrksDir: this.jobFormBuilderService.createNewFormControl<string>(
      '',
      'metadata.itrks_dir',
      null,
      {
        validators: [Validators.required, MeFormValidations.isValidFilePath],
        asyncValidators: DeepFormValidations.checkInFileSystem(
          this.onPremService,
          'folder',
          this.changeDetectorRef,
        ),
      },
    ),
  });

  ngOnInit(): void {
    this.registerEvents();
    this._addDefaultLogsFiles();
    if (this.jobFormBuilderService.mainJob) {
      //trigger blur controls value change
      setTimeout(() => {
        this.outputDirsForm.controls.logDirs.updateValueAndValidity({emitEvent: true});
        this.outputDirsForm.controls.itrksDir.updateValueAndValidity({emitEvent: true});
      }, 200);
    }
  }

  addLogItem(): void {
    if (this.disableCondition) {
      return;
    }
    this.createLogDirControl();
  }

  removeAt(i: number): void {
    if (this.disableCondition) {
      return;
    }
    this.outputDirsForm.controls.logDirs.removeAt(i);
  }

  createLogDirControl(value = ''): void {
    this.outputDirsForm.controls.logDirs.push(this.generateLogDirControlFunc(value));
  }

  generateLogDirControlFunc(pathValue: string): FormGroup<{
    logDirs: FormControl<string>;
  }> {
    const formGroup = this.fb.group({
      logDirs: new FormControl<string>(pathValue, {
        validators: Validators.compose([
          Validators.required,
          MeFormValidations.isValidFolderPath(),
        ]),
        asyncValidators: DeepFormValidations.checkInFileSystem(
          this.onPremService,
          'folder',
          this.changeDetectorRef,
        ),
      }),
    });
    if (pathValue) {
      formGroup.updateValueAndValidity();
      formGroup.markAsTouched();
    }
    return formGroup;
  }

  private _addDefaultLogsFiles() {
    if (this.jobFormBuilderService.mainJob) {
      const logsFiles =
        this.jobFormBuilderService.getValue('metadata.clip2log_metadata.log_dirs') || [];
      if (!logsFiles.length) {
        //didn't find any logsDirs, create a empty one
        this.createLogDirControl('');
      } else {
        for (const file of logsFiles) {
          this.createLogDirControl(file);
        }
      }
    } else {
      if (!this.outputDirsForm.controls.logDirs.controls.length) {
        this.addLogItem();
      }
    }
  }

  private registerEvents(): void {
    this.outputDirsForm.statusChanges
      .pipe(
        filter((value: FormControlStatus) => value !== 'PENDING'),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => {
        if (value === 'VALID') {
          this.formChanged.emit(this.outputDirsForm.value);
        } else {
          this.formChanged.emit(null);
        }
      });
  }

  private disableConditionChanged(isDisabled: boolean): void {
    if (isDisabled) {
      this.outputDirsForm.controls.itrksDir.setValue(null);
      this.outputDirsForm.controls.logDirs.clear();
      this.createLogDirControl();
    }
  }
}
