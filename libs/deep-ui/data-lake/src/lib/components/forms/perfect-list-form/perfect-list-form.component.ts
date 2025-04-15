import {AsyncPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectChange} from '@angular/material/select';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeControlListComponent} from '@mobileye/material/src/lib/components/form/control-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeUploadFileComponent} from '@mobileye/material/src/lib/components/upload-file';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeZipService} from '@mobileye/material/src/lib/services/zip';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {BaseFormDirectiveV2} from 'deep-ui/shared/components/src/lib/forms';
import {AssetManagerService, OnPremService, PerfectListService} from 'deep-ui/shared/core';
import {
  PerfectList,
  PerfectListTypeEnum,
  PerfectListTypeOptions,
  RawDataOwnerTypes,
} from 'deep-ui/shared/models';
import {DeepFormValidations, PerfectListFormValidations} from 'deep-ui/shared/validators';
import _isEqual from 'lodash-es/isEqual';
import _pullAll from 'lodash-es/pullAll';
import _uniq from 'lodash-es/uniq';
import {FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import {BehaviorSubject, of} from 'rxjs';
import {catchError, distinctUntilChanged, finalize} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-perfect-list-form',
  templateUrl: './perfect-list-form.component.html',
  styleUrls: ['./perfect-list-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [MeFadeInOutAnimation],
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MeTooltipDirective,
    MeInputComponent,
    MeSelectComponent,
    MeFormControlChipsFieldComponent,
    MeTextareaComponent,
    MeUploadFileComponent,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MeControlListComponent,
    MeJsonEditorComponent,
  ],
})
export class PerfectListFormComponent extends BaseFormDirectiveV2<PerfectList> implements OnInit {
  override mainForm = this.fb.group({
    name: [
      '',
      {
        nonNullable: true,
        validators: Validators.required,
      },
    ],
    type: [
      '',
      {
        validators: Validators.required,
        nonNullable: true,
      },
    ],
    locationsOnMobileye: new FormArray<FormGroup<{folder: FormControl<string>}>>([]),
    file: [null],
    perfectSearchUrl: new FormControl<string>(''),
    team: [
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
    tags: new FormControl<Array<string>>([]),
    description: ['', {nonNullable: true}],
    rawDataOwner: [
      '',
      {
        validators: Validators.required,
        nonNullable: true,
      },
    ],
  });

  technologyOptions: MeSelectOption[];

  rawDataOwnerOptions = RawDataOwnerTypes;

  fileLimitExceeded: boolean;

  selectedFileName: string;

  typeOptions = PerfectListTypeOptions;

  PerfectListTypeEnum = PerfectListTypeEnum;

  perfectSearchUrlDecoded = new FormControl<any>(null);

  // eslint-disable-next-line
  private fileIsLoading = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  fileIsLoading$ = this.fileIsLoading.asObservable().pipe(distinctUntilChanged());

  private assetManagerService = inject(AssetManagerService);
  private perfectListService = inject(PerfectListService);
  private onPremService = inject(OnPremService);
  private zipService = inject(MeZipService);

  override ngOnInit(): void {
    super.ngOnInit();
    this._getTechnologiesOptions();
    this._registerEvents();
  }

  getEntityType(): string {
    return 'perfectList';
  }

  getTeamProp(): string {
    return 'team';
  }

  getMainForm(): FormGroup {
    return this.mainForm;
  }

  override onSubmit(): void {
    this.mainForm.controls.name.updateValueAndValidity();
    this.mainForm.controls.locationsOnMobileye.updateValueAndValidity();
    super.onSubmit();
  }

  override serializeData(formValue: any): any {
    const type: PerfectListTypeEnum =
      (formValue?.type as PerfectListTypeEnum) ||
      (this.mainForm.controls.type.value as PerfectListTypeEnum);
    switch (type) {
      case PerfectListTypeEnum.FILE: {
        return this._handleFileSerializeData(formValue);
      }
      case PerfectListTypeEnum.PerfectSearch: {
        return formValue;
      }
      case PerfectListTypeEnum.DIRECTORY: {
        return this._handleDirectorySerializeData(formValue);
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = type;
        throw new Error(`Unhandled serializeData case: ${exhaustiveCheck}`);
      }
    }
  }
  generateLocationFormControlFunc(pathValue: string, disabled = false): FormGroup {
    return new FormGroup({
      folder: new FormControl<string>(
        {value: pathValue, disabled},
        {
          validators: Validators.compose([
            Validators.required,
            MeFormValidations.isValidFolderPath(),
            MeFormValidations.mustStartWith('/mobileye/Perfects/PerfectResults/'),
          ]),
          asyncValidators: DeepFormValidations.checkInFileSystem(
            this.onPremService,
            'folder',
            this.cd,
          ),
          updateOn: 'change',
        },
      ),
    });
  }

  onFileChanged(files: NgxFileDropEntry[]): void {
    this.fileLimitExceeded = false;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        this.fileIsLoading.next(true);
        fileEntry.file((file: File) => {
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
              this.mainForm.controls.file.setValue(fileOrZip);
            });
        });
      }
    }
  }

  onTypeChanged(option: MatSelectChange): void {
    const selectedOption: PerfectListTypeEnum = option.value;

    this._resetTypeControls();

    switch (selectedOption) {
      case PerfectListTypeEnum.FILE: {
        this.mainForm.controls.file.addValidators(Validators.required);
        break;
      }
      case PerfectListTypeEnum.PerfectSearch: {
        this.mainForm.controls.perfectSearchUrl.addValidators([
          Validators.required,
          MeFormValidations.mustStartWith('https://pac.perfcloud.perfects.mobileye.com/'),
        ]);
        break;
      }
      case PerfectListTypeEnum.DIRECTORY: {
        this.addEmptyFolderPath();
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = selectedOption;
        throw new Error(`Unhandled onTypeChanged case: ${exhaustiveCheck}`);
      }
    }
    this._updateAndValidateTypeControls();
  }

  protected override initForm(): void {
    this._initInitialFormState();
    this.setFormValidations();
    this.deSerializeDataAndPatchForm();
    this.initialFormData = this.getMainForm().getRawValue();
  }

  protected setFormValidations(): void {
    this.mainForm.controls.name.addAsyncValidators(
      PerfectListFormValidations.checkPerfectListName(
        this.perfectListService,
        this.formMode === 'create' ? undefined : this.entity?.id,
        this.cd,
      ),
    );
  }

  protected _initInitialFormState(): void {
    const defaultTeam = this.getDefaultTeam();
    this.mainForm.controls.team.setValue(defaultTeam);
    this.mainForm.controls.type.setValue(this.typeOptions[0].id);
    const isTypeReadOnly = this.formMode === 'edit';
    if (isTypeReadOnly) {
      this.mainForm.controls.type.disable();
      this.mainForm.controls.perfectSearchUrl.disable();
    }
  }

  protected deSerializeDataAndPatchForm(): void {
    if (Object.keys(this.entity || {}).length) {
      const folders = this.entity.locationsOnMobileye || [];
      delete this.entity.locationsOnMobileye;
      const team = this.deepTeamOptions.includes(this.entity.team) ? this.entity.team : undefined;
      this.mainForm.patchValue({
        ...this.entity,
        tags: this.entity.tags || [],
        locationsOnMobileye: null,
        team: team,
        name:
          this.formMode === 'create'
            ? `${this.entity.name}${DUPLICATE_SUFFIX_STR}`
            : this.entity.name,
      });
      this._patchPerfectFolders(folders);
      this.initialFormData = this.mainForm.getRawValue() as any;
    } else {
      this.addEmptyFolderPath();
    }
    if (this.formMode === 'edit') {
      this.selectedFileName = 'Perfect List File';
      this.mainForm.controls.file.setValue(true);
    }
  }

  addEmptyFolderPath(): void {
    this.mainForm.controls.locationsOnMobileye.push(
      this.generateLocationFormControlFunc(null) as any,
    );
  }

  private _registerEvents(): void {
    if (this.entity?.perfectSearchUrl) {
      this.setPerfectSearchControl(this.entity?.perfectSearchUrl);
    }
    this.mainForm.controls.perfectSearchUrl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        if (value) {
          this.setPerfectSearchControl(value);
        } else {
          this.perfectSearchUrlDecoded.setValue(null);
        }
      });
  }

  private setPerfectSearchControl(value: string) {
    try {
      const criteriaObj = this._extractPerfectSearchQueryParams(value);
      this.perfectSearchUrlDecoded.setValue(criteriaObj);
      // eslint-disable-next-line
    } catch (e) {
      this.perfectSearchUrlDecoded.setValue(null);
    }
  }

  private _extractPerfectSearchQueryParams(value: string): void {
    const decodedURL = decodeURIComponent(value);
    const urlObj = new URL(decodedURL);
    const params = new URLSearchParams(urlObj.search);
    const criteria = params.get('criteria').trim();
    const criteriaObj = JSON.parse(criteria);
    return criteriaObj;
  }

  private _handleFileSerializeData(formValue: any): void {
    if (formValue.file === true) {
      // eslint-disable-next-line
      delete formValue.file;
    }
    // eslint-disable-next-line
    return formValue;
  }

  private _handleDirectorySerializeData(formValue: any): any {
    const nextData = {
      ...formValue,
    };

    const initData = (this.initialFormData?.locationsOnMobileye || []).map(
      (location: any) => location.folder,
    );
    const formData = (formValue?.locationsOnMobileye || []).map((location: any) => location.folder);
    if (_isEqual(formData, initData)) {
      delete nextData.locationsOnMobileye;
    }
    let diff;
    if (formValue.locationsOnMobileye?.length) {
      if (this.formMode === 'create') {
        diff = formData;
      } else if (this.formMode === 'edit' && initData.length && formData.length) {
        diff = _pullAll(formData, initData);
      } else {
        diff = [];
      }
      const locationsOnMobileye = _uniq(diff);
      if (!locationsOnMobileye?.length) {
        delete nextData.locationsOnMobileye;
      } else {
        nextData.locationsOnMobileye = diff;
      }
      return Object.keys(nextData).length ? nextData : null;
    }
    return formValue;
  }

  private _resetTypeControls(): void {
    this.mainForm.controls.locationsOnMobileye.clear();
    this.mainForm.controls.file.removeValidators(Validators.required);
    this.mainForm.controls.file.setValue(null);
    this.mainForm.controls.perfectSearchUrl.removeValidators([
      Validators.required,
      MeFormValidations.mustStartWith('https://'),
    ]);
    this.mainForm.controls.perfectSearchUrl.setValue('');
  }

  private _updateAndValidateTypeControls(): void {
    this.mainForm.controls.file.updateValueAndValidity();
    this.mainForm.controls.perfectSearchUrl.updateValueAndValidity();
    this.mainForm.controls.locationsOnMobileye.updateValueAndValidity();
  }

  private _patchPerfectFolders(folders: Array<string>): void {
    for (const folder of folders) {
      const isDisabled = this.formMode === 'edit';
      this.mainForm.controls.locationsOnMobileye.push(
        this.generateLocationFormControlFunc(folder, isDisabled) as any,
      );
    }
  }

  private _getTechnologiesOptions(): void {
    // eslint-disable-next-line
    this.assetManagerService.getTechnologiesOptions().subscribe((options: MeSelectOption[]) => {
      this.technologyOptions = options;
    });
  }

  removeFolderAt(index: number): void {
    this.mainForm.controls.locationsOnMobileye.removeAt(index);
  }
}
