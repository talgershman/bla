import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Signal,
  signal,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MeDragDropListComponent} from '@mobileye/material/src/lib/components/form/drag-drop-list';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {
  MeParametersListComponent,
  MeParametersListItem,
  MeParametersListItemType,
} from '@mobileye/material/src/lib/components/form/parameters-list';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeTour} from '@mobileye/material/src/lib/services/tour';
import {isArrayEmptyValues, padArr} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectMestItem} from 'deep-ui/shared/components/src/lib/common';
import {BaseFormDirective} from 'deep-ui/shared/components/src/lib/forms';
import {MEST_FORM_TOUR_ID} from 'deep-ui/shared/configs';
import {MestFoundPathsResponse, MestService, OnPremService} from 'deep-ui/shared/core';
import {MEST, MestParams} from 'deep-ui/shared/models';
import {DeepFormValidations} from 'deep-ui/shared/validators';
import {memoize} from 'lodash-decorators/memoize';
import _isEqual from 'lodash-es/isEqual';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {first, switchMap} from 'rxjs/operators';

export interface MestFormStateEvent {
  mest?: SelectMestItem;
}

const FILES_TOOLTIP = `Root path="/mobileye/trees_archive/PSW/bundle/4.22.06.01/pre-release/PC0_2022_09_13/executables/eyeq4/release/" ( insert in wizard phase )
            Executable="GV_Wono_EyeQ4sw_tbb"
            Lib="libMono_EyeQ4sw_tbb.so"
            BrainLib="brainLibs_EyeQ4sw_tbb"`;

@UntilDestroy()
@Component({
  selector: 'de-mest-form',
  templateUrl: './mest-form.component.html',
  styleUrls: ['./mest-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MeInputComponent,
    MeSelectComponent,
    MeTooltipDirective,
    MeDragDropListComponent,
    MatFormFieldModule,
    MeParametersListComponent,
    MeTextareaComponent,
    MatButtonModule,
  ],
})
export class MestFormComponent extends BaseFormDirective implements OnInit, OnDestroy {
  @ViewChild('mestFormElement', {static: true, read: FormGroupDirective})
  mestFormElement: FormGroupDirective;

  @Input()
  mest: SelectMestItem = {} as any;

  @Input()
  createButtonLabel = 'Create MEST CMD';

  @Input()
  cancelButtonLabel = 'Back';

  @Input()
  triggerSubmitClicked: Observable<void>;

  @HostBinding('style.--min-height')
  @Input()
  minHeight: string;

  @Output()
  fromValueChanged = new EventEmitter<MestFormStateEvent>();

  @Output()
  backButtonClicked = new EventEmitter();

  public viewContainerRef = inject(ViewContainerRef);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private mestService = inject(MestService);
  private onPremService = inject(OnPremService);

  selectedExecutable: WritableSignal<string> = signal(undefined);

  executableWithoutBasePath: Signal<string> = computed(() => {
    if (!this.selectedExecutable()) {
      return '';
    }
    return this.selectedExecutable().replace(this.mestForm.controls.rootPath.value.trim(), '');
  });

  selectedLib: WritableSignal<string> = signal(undefined);

  libWithoutBasePath: Signal<string> = computed(() => {
    if (!this.selectedLib()) {
      return '';
    }
    return this.selectedLib().replace(this.mestForm.controls.rootPath.value.trim(), '');
  });

  selectedBrainLib: WritableSignal<string> = signal(undefined);

  brainLibWithoutBasePath: Signal<string> = computed(() => {
    if (!this.selectedBrainLib()) {
      return '';
    }
    return this.selectedBrainLib().replace(this.mestForm.controls.rootPath.value.trim(), '');
  });

  submitButtonTooltip: string;

  FILES_TOOLTIP = FILES_TOOLTIP;

  mestForm = this.fb.group({
    nickname: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.compose([Validators.required]),
      updateOn: 'change',
    }),
    group: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.compose([Validators.required]),
      updateOn: 'change',
    }),
    rootPath: new FormControl<string>(''),
    executables: new FormControl<Array<string>>(['', '', ''], {
      validators: Validators.compose([
        MeFormValidations.arrayAllEmptyValues(),
        MeFormValidations.arrayValuesInvalidPrefix('/'),
        MeFormValidations.arrayIsValidPath(),
        MeFormValidations.arrayInvalidRegexValidation('//'),
      ]),
      updateOn: 'blur',
    }),
    libs: new FormControl<Array<string>>(['', '', ''], {
      validators: Validators.compose([
        MeFormValidations.arrayAllEmptyValues(),
        MeFormValidations.arrayValuesInvalidPrefix('/'),
        MeFormValidations.arrayIsValidPath(),
        MeFormValidations.arrayInvalidRegexValidation('//'),
      ]),
      updateOn: 'blur',
    }),
    brainLibs: new FormControl<Array<string>>(['', '', ''], {
      validators: Validators.compose([
        MeFormValidations.arrayValuesInvalidPrefix('/'),
        MeFormValidations.arrayIsValidPath(),
        MeFormValidations.arrayInvalidRegexValidation('//'),
      ]),
      updateOn: 'blur',
    }),
    args: [
      '',
      {
        validators: MeFormValidations.invalidBlackList(['--sync', '--clip']),
        updateOn: 'change',
      },
    ],
    params: new FormControl<Array<MeParametersListItem>>([], {
      validators: MeFormValidations.isObjectArrayAllEmptyValues(['key', 'value']),
      updateOn: 'blur',
    }),
  });

  private initialMest: MEST;

  // eslint-disable-next-line
  private formIsValid = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  private formIsValid$ = this.formIsValid
    .asObservable()
    .pipe(switchMap(this._isFormValid.bind(this)), untilDestroyed(this))
    .subscribe();

  override ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    this._markAsTouchAndValidateControls();
    this._registerTriggerSubmitClicked();
    this.submitButtonTooltip = this._getSubmitTooltip();
  }

  override async startTour(): Promise<void> {
    await this.tourService.startTour(MEST_FORM_TOUR_ID);

    this.tourService
      .getOnTourOpenedObs()
      .pipe(untilDestroyed(this))
      .subscribe(() => this._onTourOpened());
    this.tourService
      .getOnTourClosedObj()
      .pipe(untilDestroyed(this))
      .subscribe(() => this._onTourClosed());
  }

  getTeamProp(): string {
    return 'group';
  }

  getEntityType(): string {
    return 'mest';
  }

  onSubmit(): void {
    this.mestForm.markAllAsTouched();
    if (this.isFormModeOverride()) {
      this._validateFileSystemPaths(true);
    } else if (this.mestForm.valid) {
      this.formIsValid.next(true);
    }
    this.cd.detectChanges();
  }

  removeBasePathFromString(absolutePath: string): string {
    if (!absolutePath) {
      return '';
    }
    return absolutePath.replace(this.mestForm.controls.rootPath.value.trim(), '');
  }

  onBackClicked(): void {
    this.backButtonClicked.emit();
  }

  getTour(): MeTour {
    return this.tourService.getTourById(MEST_FORM_TOUR_ID);
  }

  // eslint-disable-next-line
  @memoize()
  isFormModeOverride(): boolean {
    return this.formMode === 'override';
  }

  private _registerTriggerSubmitClicked(): void {
    this.triggerSubmitClicked?.pipe(untilDestroyed(this)).subscribe(() => {
      this.mestFormElement.onSubmit(null);
    });
  }

  private _getSubmitTooltip(): string {
    if (
      this.formMode === 'edit' &&
      !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(this.mest, this.getTeamProp())
    ) {
      return `You are not allowed to edit the MEST CMD, only a member of the team: ${this.mest.group} can delete this.`; // todo: change to 'team'
    }
    return '';
  }

  private _validateFileSystemPaths(submitForm: boolean): void {
    this._validateAsyncValidators()
      .pipe(first())
      .subscribe((response: MestFoundPathsResponse) => {
        if (submitForm && !response) {
          this.formIsValid.next(false);
          return;
        }
        const {executable, lib, brainLib} = response || {};
        if (executable) {
          this.selectedExecutable.set(executable.foundPath ? executable.foundPath : 'not-found');
        }
        if (lib) {
          this.selectedLib.set(lib.foundPath ? lib.foundPath : 'not-found');
        }
        if (brainLib) {
          this.selectedBrainLib.set(brainLib.foundPath ? brainLib.foundPath : 'not-found');
        }
        this._markAsTouchFilesControls();
        if (submitForm) {
          const isValid =
            this.mestForm.valid &&
            this.selectedExecutable() !== 'not-found' &&
            this.selectedLib() !== 'not-found' &&
            this.selectedBrainLib() !== 'not-found';
          this.formIsValid.next(isValid);
        }
        this.cd.detectChanges();
      });
  }

  private _validateExecutablesPaths(paths): void {
    if (this.mestForm.controls.rootPath.value) {
      this.mestService
        .getMestSelectedPaths(this.mestForm.controls.rootPath.value, paths, [], [])
        .subscribe((response: MestFoundPathsResponse) => {
          if (response !== null) {
            const {executable} = response;
            this.selectedExecutable.set(executable.foundPath ? executable.foundPath : 'not-found');
          }
          this.cd.detectChanges();
        });
    }
  }

  private _validateBrainLibsPaths(paths): void {
    if (this.mestForm.controls.rootPath.value) {
      this.mestService
        .getMestSelectedPaths(this.mestForm.controls.rootPath.value, [], [], paths)
        .subscribe((response: MestFoundPathsResponse) => {
          if (response !== null) {
            const {brainLib} = response;
            if (brainLib) {
              this.selectedBrainLib.set(brainLib.foundPath ? brainLib.foundPath : 'not-found');
            }
          }
          this.cd.detectChanges();
        });
    }
  }

  private _validateLibsPaths(paths): void {
    if (this.mestForm.controls.rootPath.value) {
      this.mestService
        .getMestSelectedPaths(this.mestForm.controls.rootPath.value, [], paths, [])
        .subscribe((response: MestFoundPathsResponse) => {
          if (!response === null) {
            const {lib} = response;
            this.selectedLib.set(lib.foundPath ? lib.foundPath : 'not-found');
          }
          this.cd.detectChanges();
        });
    }
  }

  private _validateAsyncValidators(): Observable<MestFoundPathsResponse> {
    if (!this.mestForm.controls.rootPath.value) {
      return of(null);
    }
    const executablesPaths = this.mestForm.controls.executables.value as unknown as Array<string>;
    const libsPaths = this.mestForm.controls.libs.value as unknown as Array<string>;
    const brainLibsPaths = this.mestForm.controls.brainLibs.value as unknown as Array<string>;
    return this.mestService.getMestSelectedPaths(
      this.mestForm.controls.rootPath.value,
      executablesPaths,
      libsPaths,
      brainLibsPaths,
    );
  }

  private _setInitialFormState(): void {
    const {defaultTeam, executables, libs, brainLibs} = this._getInitValues();
    this.mestForm.controls.group.setValue(defaultTeam);
    this.mestForm.controls.executables.setValue(executables);
    this.mestForm.controls.libs.setValue(libs);
    this.mestForm.controls.brainLibs.setValue(brainLibs);
  }

  private _setFormToEmptyValues(): void {
    const {defaultTeam, executables, libs, brainLibs} = this._getInitValues();
    this.mestForm.patchValue({
      nickname: '',
      group: defaultTeam,
      executables,
      libs,
      brainLibs,
      args: '',
      params: [],
    });
  }

  private _initRootControl(): void {
    if (this.isFormModeOverride()) {
      this.mestForm.controls.rootPath.addValidators([
        Validators.required,
        MeFormValidations.invalidRegexValidation('/{2,}'),
        MeFormValidations.isValidPath(),
        MeFormValidations.mustEndWith('/'),
      ]);
      this.mestForm.controls.rootPath.addAsyncValidators([
        DeepFormValidations.checkInFileSystem(this.onPremService, 'folder', this.cd),
      ]);
    }
  }

  private _registerControlValueChanges(): void {
    if (this.isFormModeOverride()) {
      this.mestForm.controls.rootPath.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this._validateFileSystemPaths(false);
      });
      this.mestForm.controls.executables.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((paths) => {
          this._validateExecutablesPaths(paths);
        });
      this.mestForm.controls.libs.valueChanges.pipe(untilDestroyed(this)).subscribe((paths) => {
        this._validateLibsPaths(paths);
      });
      this.mestForm.controls.brainLibs.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((paths) => {
          this._validateBrainLibsPaths(paths);
        });
    }
  }

  private _initForm(): void {
    this._setInitialFormState();
    this._initRootControl();
    this._deSerializeDataAndPatchForm();
    this._registerControlValueChanges();
    this.initialMest = this._serializeData(); // save initial data to check if dirty later
  }

  private _isFormValid(isValid: boolean): Observable<any> {
    if (!isValid) {
      return of(null);
    }
    const mest = this._serializeData();
    if (this._isFormModeCreate()) {
      this.fromValueChanged.emit({
        mest,
      });
      return of(null);
    }
    // formMode is override or edit
    this.fromValueChanged.emit({
      mest: !this._isFormDirty(mest) ? null : mest,
    });
    return of(null);
  }

  private _isFormDirty(newMest: MEST): boolean {
    return this.mestForm.dirty && !_isEqual(this.initialMest, newMest);
  }

  private _serializeData(): any {
    const rawData = this.mestForm.getRawValue();
    const executables = rawData.executables.filter((execFile) => execFile.trim() !== '');
    const libs = rawData.libs.filter((lib: string) => lib.trim() !== '');
    const brainLibs = rawData.brainLibs.filter((brainLib) => brainLib.trim() !== '');
    const params = this._serializeParams(rawData.params as unknown as Array<MeParametersListItem>);
    const id = this.isFormModeOverride() ? this.mest.id : undefined;

    return {
      ...rawData,
      params,
      executables,
      libs,
      brainLibs,
      id,
    };
  }

  private _deSerializeDataAndPatchForm(): any {
    const executables = padArr(this.mest.executables, '', 3);
    const libs = padArr(this.mest.libs, '', 3);
    const brainLibs = padArr(this.mest.brainLibs, '', 3);
    this.mestForm.patchValue({
      brainLibs,
      libs,
      executables,
    });
    if (Object.keys(this.mest || {}).length) {
      const params = this._deSerializeParams(this.mest.params);
      const formValue = {
        ...this.mest,
        params,
        executables,
        libs,
        brainLibs,
      };
      const group = this.deepTeamOptions.includes(formValue.group) ? formValue.group : undefined;
      this.mestForm.patchValue({
        brainLibs: formValue.brainLibs,
        libs: formValue.libs,
        executables: formValue.executables,
        group: group,
        params: formValue.params,
        args: formValue.args,
        rootPath: this.isFormModeOverride() ? formValue.rootPath || '' : undefined,
        nickname: formValue.nickname || '',
      });
    }
  }

  private _serializeParams(params: MeParametersListItem[]): MestParams[] {
    if (!params || !params.length) {
      return [];
    }
    const arr: MestParams[] = [];
    params.forEach((param: MeParametersListItem) => {
      const item: MestParams = {} as any;
      if (param.type === MeParametersListItemType.SINGLE && param.key.trim()) {
        item.key = param.key;
      }
      if (
        param.type === MeParametersListItemType.KEY_VALUE &&
        param.key.trim() &&
        param.value.trim()
      ) {
        item.key = param.key;
        item.value = param.value;
      }
      if (Object.keys(item).length) {
        arr.push(item);
      }
    });
    return arr;
  }

  private _deSerializeParams(mestParams: MestParams[]): MeParametersListItem[] {
    if (!mestParams || !mestParams.length) {
      return [];
    }
    const params = [];
    mestParams.forEach((mestParam: MestParams) => {
      const param: MeParametersListItem = {...mestParam} as any;
      param.type = mestParam.value
        ? MeParametersListItemType.KEY_VALUE
        : MeParametersListItemType.SINGLE;
      params.push(param);
    });
    return params;
  }

  private _markAsTouchAndValidateControls(): void {
    if (this._isFormModeCreate()) {
      return;
    }
    if (this.isFormModeOverride()) {
      this.mestForm.markAllAsTouched();
      if (this.mest.rootPath?.length) {
        this.mestForm.controls.rootPath.markAsTouched({onlySelf: true});
        this._validateFileSystemPaths(false);
      }
    }
    if (this._isFormModeEdit()) {
      this._markAsTouchFilesControls();
    }
  }

  private async _onTourOpened(): Promise<void> {
    this.prevTourFormValue = {
      ...this.mestForm.getRawValue(),
    };
    this._setFormToEmptyValues();
    this.mestForm.markAsUntouched();
    this.cd.detectChanges();
  }

  private async _onTourClosed(): Promise<void> {
    //clear form before reset to previous state
    this._setFormToEmptyValues();
    this.mestForm.patchValue({
      group: this.prevTourFormValue.group || '',
      params: this.prevTourFormValue.params,
      args: this.prevTourFormValue.args,
      rootPath: this.prevTourFormValue.rootPath || '',
      nickname: this.prevTourFormValue.nickname,
      brainLibs: this.prevTourFormValue.brainLibs,
      libs: this.prevTourFormValue.libs,
      executables: this.prevTourFormValue.executables,
    });
    this.mestForm.markAsUntouched();
    this.prevTourFormValue = null;
    this.cd.detectChanges();
  }

  private _markAsTouchFilesControls(): void {
    if (!isArrayEmptyValues(this.mestForm.controls.executables.value)) {
      this.mestForm.controls.executables.markAsTouched({onlySelf: true});
    }
    if (!isArrayEmptyValues(this.mestForm.controls.libs.value)) {
      this.mestForm.controls.libs.markAsTouched({onlySelf: true});
    }
    if (!isArrayEmptyValues(this.mestForm.controls.brainLibs.value)) {
      this.mestForm.controls.brainLibs.markAsTouched({onlySelf: true});
    }
  }

  private _getInitValues(): any {
    const defaultTeam = this.getDefaultTeam();
    const executables = ['', '', ''];
    const libs = ['', '', ''];
    const brainLibs = ['', '', ''];
    return {
      defaultTeam,
      executables,
      libs,
      brainLibs,
    };
  }

  // eslint-disable-next-line
  @memoize()
  private _isFormModeEdit(): boolean {
    return this.formMode === 'edit';
  }
  // eslint-disable-next-line
  @memoize()
  private _isFormModeCreate(): boolean {
    return this.formMode === 'create';
  }
}
