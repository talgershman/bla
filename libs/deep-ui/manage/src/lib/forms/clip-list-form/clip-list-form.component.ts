import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewContainerRef,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeUploadFileComponent} from '@mobileye/material/src/lib/components/upload-file';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeZipService} from '@mobileye/material/src/lib/services/zip';
import {getDiffKeys} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {BaseFormDirective} from 'deep-ui/shared/components/src/lib/forms';
import {CLIP_LIST_FORM_TOUR_ID} from 'deep-ui/shared/configs';
import {AssetManagerService, ClipListService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';
import {DeepFormValidations} from 'deep-ui/shared/validators';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  first,
  startWith,
  switchMap,
} from 'rxjs/operators';

import {typeOptions} from './clip-list-form-entities';

@UntilDestroy()
@Component({
  selector: 'de-clip-list-form',
  templateUrl: './clip-list-form.component.html',
  styleUrls: ['./clip-list-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [MeFadeInOutAnimation],
  imports: [
    ReactiveFormsModule,
    MeInputComponent,
    MeSelectComponent,
    MeFormControlChipsFieldComponent,
    MeTextareaComponent,
    MeUploadFileComponent,
    MatFormFieldModule,
    MatButtonModule,
    MeTooltipDirective,
    AsyncPipe,
  ],
})
export class ClipListFormComponent extends BaseFormDirective implements OnInit {
  @Input()
  clipList: ClipList;

  @Input()
  createButtonLabel = 'Create Clip List';

  @Input()
  cancelButtonLabel = 'Back';

  @Input()
  file: File;

  @Output()
  backButtonClicked = new EventEmitter<void>();

  @Output()
  fromValueChanged = new EventEmitter<any>();

  public viewContainerRef = inject(ViewContainerRef);
  private fb = inject(FormBuilder);
  private assetManagerService = inject(AssetManagerService);
  private clipListService = inject(ClipListService);
  private zipService = inject(MeZipService);
  private cd = inject(ChangeDetectorRef);

  technologyOptions: MeSelectOption[];

  typeOptions = typeOptions;

  clipListForm = this.fb.group({
    name: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
      },
    ],
    team: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
        updateOn: 'change',
      },
    ],
    type: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
      },
    ],
    technology: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
      },
    ],
    brain: ['', {nonNullable: true}],
    camera: ['', {nonNullable: true}],
    tags: new FormControl<Array<string>>([]),
    clipListFile: [
      null as any,
      {
        validators: Validators.required,
        nonNullable: true,
      },
    ],
    description: ['', {nonNullable: true}],
  });

  fileLimitExceeded: boolean;

  selectedFileName: string;

  submitButtonTooltip: string;

  // eslint-disable-next-line
  private isFormValid = new Subject<void>();

  // eslint-disable-next-line
  isFormValidObj = this.isFormValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this));

  // eslint-disable-next-line
  private isFormValid$ = this.isFormValidObj.subscribe((status: FormControlStatus) => {
    if (status === 'VALID') {
      this._onFormValid();
    }
  });

  // eslint-disable-next-line
  private fileIsLoading = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  fileIsLoading$ = this.fileIsLoading.asObservable().pipe(distinctUntilChanged());

  ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    // eslint-disable-next-line
    this.assetManagerService.getTechnologiesOptions().subscribe((options: MeSelectOption[]) => {
      this.technologyOptions = options;
    });
    this.submitButtonTooltip = this._getSubmitTooltip();
  }

  async startTour(): Promise<void> {
    await this.tourService.startTour(CLIP_LIST_FORM_TOUR_ID);
    this.tourService
      .getOnTourOpenedObs()
      .pipe(untilDestroyed(this))
      .subscribe(() => this._onTourOpened());
    this.tourService
      .getOnTourClosedObj()
      .pipe(untilDestroyed(this))
      .subscribe(() => this._onTourClosed());
  }

  getEntityType(): string {
    return 'clipList';
  }

  getTeamProp(): string {
    return 'team';
  }

  onSubmit(): void {
    this.clipListForm.controls.name.updateValueAndValidity();
    this.clipListForm.markAllAsTouched();
    this.isFormValid.next();
  }

  onBackClicked(): void {
    this.backButtonClicked.emit();
  }

  onFileChanged(files: NgxFileDropEntry[]): void {
    this.fileLimitExceeded = false;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this._tryGenerateZipFile(file);
        });
      }
    }
  }

  private _getSubmitTooltip(): string {
    if (
      this.formMode === 'edit' &&
      !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(this.clipList, this.getTeamProp())
    ) {
      return `You are not allowed to edit the clip list, only a member of the team: ${this.clipList.team} can delete this.`;
    }
    return '';
  }

  private _onFormValid(): void {
    let value;
    if (this.formMode !== 'create' && this.formMode !== 'createFromId') {
      value = this._getDirtyObject();
    } else {
      value = this.clipListForm.getRawValue();
    }
    this.fromValueChanged.emit(value);
  }

  private _isFormValid(): Observable<FormControlStatus> {
    return this.clipListForm.statusChanges.pipe(
      startWith(this.clipListForm.status),
      filter((value: FormControlStatus) => value !== 'PENDING'),
      first(),
    );
  }

  private _initForm(): void {
    this._setInitialFormState();
    this._setFormValidations();
    this._deSerializeDataAndPatchForm();
  }

  private _setFormValidations(): void {
    this.clipListForm.controls.name.addAsyncValidators(
      DeepFormValidations.checkClipListName(
        this.clipListService,
        this.formMode === 'create' ? undefined : this.clipList?.id,
        this.cd,
      ),
    );
  }

  private _setInitialFormState(): void {
    const defaultTeam = this.getDefaultTeam();
    this.clipListForm.controls.team.setValue(defaultTeam);
    this.clipListForm.controls.type.setValue(this.clipList?.type);
    if (this.formMode !== 'create') {
      this.clipListForm.controls.type.disable();
    }
  }
  private _deSerializeDataAndPatchForm(): void {
    if (Object.keys(this.clipList || {}).length) {
      const team = this.deepTeamOptions.includes(this.clipList.team)
        ? this.clipList.team
        : undefined;
      this.clipListForm.patchValue({
        name:
          this.formMode === 'create'
            ? `${this.clipList.name}${DUPLICATE_SUFFIX_STR}`
            : this.clipList.name,
        team: team,
        type: this.clipList.type,
        technology: this.clipList.technology,
        camera: this.clipList.camera,
        brain: this.clipList.brain,
        tags: this.clipList.tags || [],
        description: this.clipList.description,
      });
      if (this.clipList.team) {
        this.clipListForm.controls.team.setValue(this.clipList.team);
      }
      if (this.formMode === 'edit') {
        this.selectedFileName = 'Clip List File';
        this.clipListForm.controls.clipListFile.setValue(true);
      }
    }
    if (this.file && (this.formMode === 'create' || this.formMode === 'createFromId')) {
      this._tryGenerateZipFile(this.file);
    }
  }

  private _getDirtyObject(): any {
    const keys = this._getDirtyKeys();
    return this._getDirtyControls(keys);
  }

  private _getDirtyControls(dirtyKeys: string[]): Partial<ClipList> {
    const dirtyValues = {};
    for (const key of dirtyKeys) {
      dirtyValues[key] = this.clipListForm.get(key).value;
    }
    return Object.keys(dirtyValues).length ? dirtyValues : null;
  }

  private _getDirtyKeys(): string[] {
    const formValue = {
      ...this.clipListForm.value,
    };
    delete formValue.clipListFile;
    const dirtyKeys: Array<string> = getDiffKeys(formValue, {
      name: this.clipList.name,
      technology: this.clipList.technology,
      camera: this.clipList.camera,
      brain: this.clipList.brain,
      description: this.clipList.description,
      team: this.clipList.team,
      tags: !this.clipList.tags ? [] : this.clipList.tags,
    });
    if (this.clipListForm.controls.clipListFile.value !== true) {
      dirtyKeys.push('clipListFile');
    }
    return dirtyKeys;
  }

  private async _onTourOpened(): Promise<void> {
    this.prevTourFormValue = {
      ...this.clipListForm.getRawValue(),
    };
    this.clipListForm.controls.type.enable();
    this._setFormToEmptyValues();
    this.clipListForm.controls.type.setValue(this.typeOptions[0].id);
    this.clipListForm.controls.technology.setValue(this.technologyOptions[0].id);
    this.clipListForm.markAsUntouched();
    this.cd.detectChanges();
  }

  private async _onTourClosed(): Promise<void> {
    //clear form before reset to previous state
    this._setFormToEmptyValues();
    this.clipListForm.patchValue(this.prevTourFormValue);
    if (this.formMode === 'edit') {
      this.clipListForm.controls.type.disable();
    }
    this.clipListForm.markAsUntouched();
    this.prevTourFormValue = null;
    this.cd.detectChanges();
  }

  private _setFormToEmptyValues(): void {
    this.clipListForm.reset();
  }

  private _tryGenerateZipFile(file: File): void {
    this.fileIsLoading.next(true);
    this.zipService
      .tryGenerateZipFile(file)
      .pipe(
        catchError((_) => {
          this.fileLimitExceeded = true;
          return of(null);
        }),
        finalize(() => this.cd.detectChanges()),
      )
      .subscribe((fileOrZip?: File) => {
        this.fileIsLoading.next(false);
        this.selectedFileName = fileOrZip?.name ?? '';
        this.clipListForm.controls.clipListFile.setValue(fileOrZip);
      });
  }
}
