import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatRadioChange, MatRadioModule} from '@angular/material/radio';
import {MeGroupButton} from '@mobileye/material/src/lib/common';
import {MeUploadFileComponent} from '@mobileye/material/src/lib/components/upload-file';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectClipListComponent} from 'deep-ui/shared/components/src/lib/selection/select-clip-list';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {LOGS_DIR_FILTER_BUTTONS} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {
  LaunchService,
  LogsDirFilterType,
  UploadClip2logFilterListResponse,
} from 'deep-ui/shared/core';
import {ClipList, EtlJobRunType} from 'deep-ui/shared/models';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {BehaviorSubject, of} from 'rxjs';
import {catchError, distinctUntilChanged, first} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-clip-to-log-logs-filter-step',
  templateUrl: './clip-to-log-logs-filter-step.component.html',
  styleUrls: ['./clip-to-log-logs-filter-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatRadioModule,
    NgTemplateOutlet,
    MeUploadFileComponent,
    SelectClipListComponent,
    AsyncPipe,
  ],
})
export class ClipToLogLogsFilterStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  runType: EtlJobRunType;

  @Output()
  fileChanged = new EventEmitter();

  @Output()
  clipListIdChanged = new EventEmitter<number>();

  @Output()
  filterTypeChanged = new EventEmitter<LogsDirFilterType>();

  @ViewChild('fileUploadControl', {static: true})
  fileUploadTmpl: TemplateRef<any>;

  @ViewChild('clipListCatalog', {static: true})
  clipListCatalogTmpl: TemplateRef<any>;

  /* eslint-disable */
  private launchService = inject(LaunchService);
  private cd = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  /* eslint-enable */

  selectedContainerTmpl: TemplateRef<any>;

  buttons: MeGroupButton[] = LOGS_DIR_FILTER_BUTTONS;

  form = this.fb.group(
    {
      filterType: this.jobFormBuilderService.createNewFormControl<LogsDirFilterType>(
        this.buttons[0].id,
        'metadata.clip2log_metadata.filter_type',
        '',
        {
          validators: [Validators.required],
        },
      ),
      file: new FormControl<any>(null),
      clipListId: this.jobFormBuilderService.createNewFormControl<number>(
        null,
        'metadata.clip2log_metadata.clip_list_id',
        '',
      ),
    },
    {
      validators: (
        formGroup: FormGroup<{
          filterType: FormControl<string>;
          file: FormControl<any>;
          clipListId: FormControl<string>;
        }>,
      ): ValidationErrors => {
        switch (formGroup.controls.filterType.value) {
          case LogsDirFilterType.FILTER_BY_FILE: {
            if (!formGroup.controls.file.value) {
              return {invalid: true};
            }
            break;
          }
          case LogsDirFilterType.FILTER_BY_CLIP_LIST: {
            if (!formGroup.controls.clipListId.value || !formGroup.controls.file.value) {
              return {invalid: true};
            }
            break;
          }
        }
        return null;
      },
    },
  );

  fileErrorMsg: string;

  selectedFileName: string;

  // eslint-disable-next-line
  private fileIsLoading = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  fileIsLoading$ = this.fileIsLoading.asObservable().pipe(distinctUntilChanged());

  // eslint-disable-next-line
  private fileIsCleared = new BehaviorSubject<boolean>(false);

  ngOnInit(): void {
    this._setInitialSelectionId();
    this._registerEvents();
    this.formState.emit(this.form.status);
    this._setControlsByFilterType();
  }

  onFilterTypeChanged(filterTypeButton: MatRadioChange): void {
    this.form.controls.filterType.setValue(filterTypeButton.value.id);
    this._resetFields();
    this._setControlsByFilterType();
    this.filterTypeChanged.emit(this.form.controls.filterType.value);
  }

  private _setControlsByFilterType() {
    switch (this.form.controls.filterType.value) {
      case LogsDirFilterType.NO_FILTER: {
        this.selectedContainerTmpl = null;
        this.form.controls.clipListId.setValue(null);
        this.clipListIdChanged.emit(null);
        break;
      }
      case LogsDirFilterType.FILTER_BY_FILE: {
        this.selectedContainerTmpl = this.fileUploadTmpl;
        this.form.controls.clipListId.setValue(null);
        this.clipListIdChanged.emit(null);
        break;
      }
      case LogsDirFilterType.FILTER_BY_CLIP_LIST: {
        this.selectedContainerTmpl = this.clipListCatalogTmpl;
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = this.form.controls.filterType.value;
        throw new Error(`Unhandled LogsDirFilterType case: ${exhaustiveCheck}`);
      }
    }
  }

  onFileChanged(files: NgxFileDropEntry[]): void {
    this.fileErrorMsg = '';
    this.selectedFileName = '';
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        this.fileIsLoading.next(true);
        fileEntry.file((file: File) => {
          this.launchService
            .uploadClipToLogFile(file, droppedFile.relativePath)
            .pipe(
              catchError((response) =>
                of({
                  error: getErrorHtmlMsgFromResponse(response, false, true),
                }),
              ),
              first(),
            )
            .subscribe((response: UploadClip2logFilterListResponse) => {
              this._onFileUploaded(response, file.name);
            });
        });
      }
    }
  }

  onFileCleared(): void {
    this.fileIsCleared.next(true);
  }

  onClipListsChanged(clipLists: ClipList[]): void {
    const clipList = clipLists.length ? clipLists[0] : null;
    this.form.controls.clipListId.setValue(clipList?.id);
    this.clipListIdChanged.emit(clipList?.id);

    const clipPath = {
      s3Path: clipList?.s3Path,
    };
    this.form.controls.file.setValue(clipPath);
    this.fileChanged.emit(clipPath);
  }

  private _registerEvents(): void {
    this.form.statusChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((value: FormControlStatus) => this.formState.emit(value));

    this.fileIsCleared.pipe(untilDestroyed(this)).subscribe((val: boolean) => {
      if (val) {
        this.selectedFileName = '';
        this.form.controls.file.setValue(null);
        this.fileChanged.emit(null);
      }
    });
  }

  private _resetFields(): void {
    this.selectedFileName = '';
    this.fileErrorMsg = '';
    this.form.controls.file.setValue(null);
    this.fileChanged.emit(null);
  }

  private _onFileUploaded(response: UploadClip2logFilterListResponse, fileName: string): void {
    this.fileIsLoading.next(false);
    this.form.controls.file.setValue(null);
    this.fileChanged.emit(null);
    if (response?.s3Path) {
      this.selectedFileName = fileName;
      const fileResponse = {
        s3Path: response.s3Path,
      };
      this.form.controls.file.setValue(fileResponse);
      this.fileChanged.emit(fileResponse);
    } else {
      const errorObj: any = response.error ? response.error : response;
      this.fileErrorMsg = errorObj.error || errorObj;
    }
    this.cd.detectChanges();
  }

  private _setInitialSelectionId(): void {
    this.initialSelectionId = this.jobFormBuilderService.getValue('clip_list_id');
  }
}
