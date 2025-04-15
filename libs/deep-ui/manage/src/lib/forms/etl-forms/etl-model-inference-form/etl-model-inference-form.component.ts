import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {AfterViewInit, Component, inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {
  MeAutocompleteComponent,
  MeAutoCompleteOption,
} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {getDiffKeys} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {EtlService} from 'deep-ui/shared/core';
import {
  EtlDagService,
  EtlServiceName,
  EtlServiceTypes,
  EtlTypeEnum,
  SdkStatus,
} from 'deep-ui/shared/models';
import {
  DeepFormValidations,
  forceErrorMsgKey,
  hintKey,
  warningKey,
} from 'deep-ui/shared/validators';
import _find from 'lodash-es/find';
import _some from 'lodash-es/some';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {catchError, distinctUntilChanged, finalize, first, tap} from 'rxjs/operators';

import {EtlFormBaseDirective} from '../etl-form-base.directive';
import {EtlModelInferenceFormService} from './etl-model-inference-form.service';
import {
  DEFAULT_ETL_INFERENCE_SDK_VERSION,
  EtlModelInferenceLogicFormGroupType,
} from './etl-model-inference-form-entities';

const RAM_DEFAULT_VALUE = 4;

const RUN_TIME_DEFAULT_VALUE = 10;

@UntilDestroy()
@Component({
  selector: 'de-etl-model-inference-form',
  templateUrl: './etl-model-inference-form.component.html',
  styleUrls: ['./etl-model-inference-form.component.scss'],
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MeInputComponent,
    MeTextareaComponent,
    MeSelectComponent,
    MeAutocompleteComponent,
    MatIconModule,
    MeFormControlChipsFieldComponent,
    MeJsonEditorComponent,
    MatCheckboxModule,
    MatSliderModule,
    MeTooltipDirective,
    HintIconComponent,
    MatSlideToggleModule,
    MeSafePipe,
    NgTemplateOutlet,
    AsyncPipe,
  ],
  providers: [EtlModelInferenceFormService],
})
export class EtlModelInferenceFormComponent
  extends EtlFormBaseDirective
  implements OnInit, AfterViewInit
{
  @ViewChild('rootForm', {static: false})
  rootFormTemplate: TemplateRef<any>;

  @ViewChild('rootFormElement', {static: false, read: FormGroupDirective})
  rootFormElement: FormGroupDirective;

  @ViewChild('genericDataPrepForm', {static: false})
  genericDataPrepFormTemplate: TemplateRef<any>;

  @ViewChild('genericDataPrepFormElement', {static: false, read: FormGroupDirective})
  genericDataPrepFormElement: FormGroupDirective;

  @ViewChild('logicForm', {static: false})
  logicFormTemplate: TemplateRef<any>;

  @ViewChild('logicFormElement', {static: false, read: FormGroupDirective})
  logicFormElement: FormGroupDirective;

  private etlFormService = inject(EtlModelInferenceFormService);
  private etlService = inject(EtlService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  logicServicesOptions: Array<MeAutoCompleteOption>;

  genericDataPrepServicesOptions: Array<MeAutoCompleteOption>;

  get logicVersionOptions(): Array<MeAutoCompleteOption> {
    return this._logicVersionOptions;
  }

  set logicVersionOptions(options: Array<MeAutoCompleteOption>) {
    this._logicVersionOptions = options;
    if (this.etlForm.controls.logicForm) {
      this.etlForm.controls.logicForm.controls.versionOptions.setValue(options);
    }
  }

  get genericDataPrepVersionOptions(): Array<MeAutoCompleteOption> {
    return this._genericDataPrepVersionOptions;
  }

  set genericDataPrepVersionOptions(options: Array<MeAutoCompleteOption>) {
    this._genericDataPrepVersionOptions = options;
    if (this.etlForm.controls.genericDataPrepForm) {
      this.etlForm.controls.genericDataPrepForm.controls.versionOptions.setValue(options);
    }
  }

  etlForm = this.fb.group({
    rootForm: this.fb.group({
      name: new FormControl<string>(''),
      type: new FormControl<EtlTypeEnum>(this.type, {
        validators: Validators.required,
      }),
      team: new FormControl<string>('', {
        validators: Validators.required,
      }),
      tags: new FormControl<Array<string>>([]),
      description: new FormControl<string>(''),
    }),
    genericDataPrepForm: this.fb.group(
      {
        genericDataPrep: new FormControl<MeAutoCompleteOption & (EtlServiceName | EtlDagService)>(
          null,
          {
            validators: Validators.required,
          },
        ),
        version: new FormControl<MeAutoCompleteOption>(null, {
          validators: Validators.required,
        }),
        versionOptions: new FormControl<Array<MeAutoCompleteOption>>([], {
          validators: Validators.required,
        }),
        dockerImagePath: new FormControl<string>({value: '', disabled: true}),
        sdkVersion: new FormControl<string>({
          value: DEFAULT_ETL_INFERENCE_SDK_VERSION,
          disabled: true,
        }),
        sdkStatus: new FormControl<SdkStatus>(null),
        configuration: new FormControl(null),
        capacityChecked: new FormControl<boolean>(false),
        resourcesDefinition: new FormGroup({
          ram: new FormControl<number>(RAM_DEFAULT_VALUE),
          runtime: new FormControl<number>(RUN_TIME_DEFAULT_VALUE),
        }),
      },
      {
        validators: Validators.compose([
          this.warningSdkVersion('sdkStatus', 'sdkVersion'),
          this.deprecationWarningSdkVersion('sdkStatus', 'sdkVersion'),
          this.deprecatedSdkVersion('sdkStatus', 'sdkVersion'),
        ]),
      },
    ),
    logicForm: this._generateLogicFormGroup(),
  });

  selectedGenericDataPrepServices: Array<EtlDagService> = [];

  selectedLogicServices: Array<EtlDagService> = [];

  selectedGenericDataPrepGitUrl: string;

  selectedLogicGitUrl: string;

  warningKey = warningKey;

  hintKey = hintKey;

  forceErrorMsgKey = forceErrorMsgKey;

  showForm = new BehaviorSubject(false);

  showForm$ = this.showForm.asObservable();

  EtlServiceTypes = EtlServiceTypes;

  readonly RAM_DEFAULT_VALUE = RAM_DEFAULT_VALUE;

  readonly RUN_TIME_DEFAULT_VALUE = RUN_TIME_DEFAULT_VALUE;

  private _logicVersionOptions: Array<MeAutoCompleteOption>;

  private _genericDataPrepVersionOptions: Array<MeAutoCompleteOption>;

  // eslint-disable-next-line
  private genericDataPrepVersionLoadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  genericDataPrepVersionLoading$ = this.genericDataPrepVersionLoadingSubscription.asObservable();

  // eslint-disable-next-line
  private logicVersionLoadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  logicVersionLoading$ = this.logicVersionLoadingSubscription.asObservable();

  ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    this._registerEvents();
    this._updateSelectedServices();
    this._setDiagramNodes();
    this._setLogicServicesOptions();
    this._setGenericDataPrepServicesOptions();
    this.showForm.next(true);
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.etlForm.markAllAsTouched();
    this.onTriggerSubmitForNestedForms();
    this.etlForm.controls.rootForm.controls.name.updateValueAndValidity();
    this.isFormValid.next();
  }

  onServiceChanged(selected: MatAutocompleteSelectedEvent, type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.Logic) {
      this.etlForm.controls.logicForm.controls.version.setValue(null);
      this.etlForm.controls.logicForm.controls.dockerImagePath.setValue(null);
      this.etlForm.controls.logicForm.controls.sdkVersion.setValue(
        DEFAULT_ETL_INFERENCE_SDK_VERSION,
      );
      this.etlForm.controls.logicForm.controls.sdkStatus.setValue(null);
      this.etlForm.controls.logicForm.controls.configuration.setValue(null);
      this.etlForm.controls.logicForm.controls.sdkVersion.markAsTouched();
    } else if (type === EtlServiceTypes.GenericDataPrep) {
      this.etlForm.controls.genericDataPrepForm.controls.version.setValue(null);
      this.etlForm.controls.genericDataPrepForm.controls.dockerImagePath.setValue(null);
      this.etlForm.controls.genericDataPrepForm.controls.sdkVersion.setValue(
        DEFAULT_ETL_INFERENCE_SDK_VERSION,
      );
      this.etlForm.controls.genericDataPrepForm.controls.sdkStatus.setValue(null);
      this.etlForm.controls.genericDataPrepForm.controls.configuration.setValue(null);
      this.etlForm.controls.genericDataPrepForm.controls.sdkVersion.markAsTouched();
    }
  }

  onVersionChanged(
    selected: MeAutoCompleteOption,
    serviceName: string,
    type: EtlServiceTypes,
  ): void {
    const selectedService: EtlDagService = this.etlFormService.getSelectedEtlDagService(
      type === EtlServiceTypes.GenericDataPrep
        ? this.selectedGenericDataPrepServices
        : this.selectedLogicServices,
      serviceName,
      selected?.name,
      type,
    );
    const config = selectedService?.configuration;
    if (type === EtlServiceTypes.Logic) {
      this.etlForm.controls.logicForm.controls.configuration.setValue(config);
      this.etlForm.controls.logicForm.controls.dockerImagePath.setValue(
        selectedService?.dockerImagePath ?? '',
      );
      this.etlForm.controls.logicForm.controls.sdkVersion.setValue(
        selectedService?.sdkVersion ?? DEFAULT_ETL_INFERENCE_SDK_VERSION,
      );
      this.etlForm.controls.logicForm.controls.sdkStatus.setValue(selectedService?.sdkStatus);
      this.selectedLogicGitUrl = selectedService?.gitUrl;
      this.etlForm.controls.logicForm.controls.sdkVersion.markAsTouched();
    } else if (type === EtlServiceTypes.GenericDataPrep) {
      this.etlForm.controls.genericDataPrepForm.controls.configuration.setValue(config);
      this.etlForm.controls.genericDataPrepForm.controls.dockerImagePath.setValue(
        selectedService?.dockerImagePath ?? '',
      );
      this.etlForm.controls.genericDataPrepForm.controls.sdkVersion.setValue(
        selectedService?.sdkVersion ?? DEFAULT_ETL_INFERENCE_SDK_VERSION,
      );
      this.etlForm.controls.genericDataPrepForm.controls.sdkStatus.setValue(
        selectedService?.sdkStatus,
      );
      this.selectedGenericDataPrepGitUrl = selectedService?.gitUrl;
      this.etlForm.controls.genericDataPrepForm.controls.sdkVersion.markAsTouched();
    }
  }

  private _restoreLogicNode(): void {
    const logicFormGroup = this._generateLogicFormGroup();
    this.etlForm.addControl('logicForm', logicFormGroup);
    const node = this.etlFormService.generateLogicNode(this.etlForm);
    this.nodes.splice(2, 0, node);
    this._registerLogicEvents();
    this.cd.detectChanges();
  }

  onDeleteNode(formGroupName: 'probeLogicForm' | 'logicForm', nodeId: string): void {
    super.onDeleteNode(formGroupName, nodeId);
    this.etlForm.removeControl(formGroupName as 'logicForm');
  }

  onCapacityCheckBoxChange(value: MatCheckboxChange, serviceType: EtlServiceTypes): void {
    if (serviceType === EtlServiceTypes.GenericDataPrep) {
      this.etlForm.controls.genericDataPrepForm.controls.capacityChecked.setValue(value.checked);
    } else if (serviceType === EtlServiceTypes.Logic) {
      this.etlForm.controls.logicForm.controls.capacityChecked.setValue(value.checked);
    }
    if (value.checked) {
      this._openWarningCapacityDialog();
    } else {
      this._setDefaultValuesForResourcesDefinitionControls();
    }
  }

  onTriggerSubmitForNestedForms(): void {
    this.rootFormElement?.onSubmit(undefined);
    this.genericDataPrepFormElement?.onSubmit(undefined);
    this.logicFormElement?.onSubmit(undefined);
  }

  onShowProbeLogicNode(value: MatSlideToggleChange): void {
    if (value.checked) {
      this._restoreLogicNode();
    } else {
      this.onDeleteNode('logicForm', 'logic');
    }
  }

  protected onFormValid(): void {
    this._publish();
  }

  private _initForm(): void {
    this._initFromBuilder();
    this._defineControls();
    this._deSerializeDataAndPatchForm();
    if (this.formMode === 'create') {
      this.initialFormData = this.etlForm.getRawValue();
    }
    this.etlForm.controls.genericDataPrepForm?.controls.sdkVersion?.markAsTouched();
    this.etlForm.controls.logicForm?.controls.sdkVersion?.markAsTouched();
  }

  private _registerEvents(): void {
    this._registerGenericDataPrepEvents();
    this._registerLogicEvents();
  }

  private _registerGenericDataPrepEvents(): void {
    if (this.etlForm.controls.genericDataPrepForm) {
      this.etlForm.controls.genericDataPrepForm.controls.genericDataPrep.valueChanges
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe((option: MeAutoCompleteOption) => {
          this._onGenericDataPrepServiceNameChanged(option);
        });
    }
  }

  private _registerLogicEvents(): void {
    if (this.etlForm.controls.logicForm) {
      this.etlForm.controls.logicForm.controls.logic.valueChanges
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe((option: MeAutoCompleteOption) => {
          this._onLogicServiceNameChanged(option);
        });
    }
  }

  private _updateSelectedServices(): void {
    if (this.formMode === 'create') {
      return;
    }

    const services = this._getEtlServices();

    const genericDataPrepService = _find(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.GenericDataPrep,
    );

    const logicService = _find(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.Logic,
    );

    const observables: Array<Observable<any>> = [];

    if (genericDataPrepService) {
      observables.push(
        this._fetchServices(genericDataPrepService.name, EtlServiceTypes.GenericDataPrep),
      );
    }

    if (logicService) {
      observables.push(this._fetchServices(logicService.name, EtlServiceTypes.Logic));
    }

    combineLatest(observables).subscribe((_) => {
      this.initialFormData = this.etlForm.getRawValue();
    });
  }

  private _setDiagramNodes(): void {
    this.nodes = this.etlFormService.getDiagramNodes(this.etlForm);
  }

  private _setLogicServicesOptions(): void {
    this.logicServicesOptions = this.etlFormService
      .getLogicServices(this.serviceNames)
      .map((item: EtlServiceName) => {
        return {
          ...item,
          id: item.name,
        };
      });
  }

  private _setGenericDataPrepServicesOptions(): void {
    this.genericDataPrepServicesOptions = this.etlFormService
      .getGenericDataPrepServices(this.serviceNames)
      .map((item: EtlServiceName) => {
        return {
          ...item,
          id: item.name,
        };
      });
  }

  private _initFromBuilder(): void {
    this._setFormDefaults();
    this._removeUnusedNodes();
  }

  private _setFormDefaults(): void {
    this.etlForm.controls.rootForm.controls.name.reset({
      value: '',
      disabled: this.formMode === 'edit',
    });
    this.etlForm.controls.rootForm.controls.name.setValidators(
      this.formMode === 'create'
        ? [
            Validators.required,
            // eslint-disable-next-line
            Validators.pattern(/^[^\/:\\\s]*$/),
          ]
        : Validators.required,
    );
    this.etlForm.controls.rootForm.controls.name.setAsyncValidators(
      this.formMode === 'create'
        ? DeepFormValidations.checkEtlName(this.etlService, this.cd)
        : null,
    );
    this.etlForm.controls.rootForm.controls.team.setValue(this.getDefaultTeam());
    this.etlForm.controls.rootForm.controls.type.setValue(this.type);
  }

  private _defineControls(): void {
    // root form
    this.teamControl = this.etlForm.controls.rootForm.controls.team;
    this.tagsControl = this.etlForm.controls.rootForm.controls.tags;
  }

  private _deSerializeDataAndPatchForm(): void {
    if (Object.keys(this.etl || {}).length) {
      const formValue = this.etlFormService.deSerializeEtlToFormObj(this.etl);
      this.etlForm.patchValue(formValue);
      if (
        formValue?.genericDataPrepForm &&
        this.etlForm.controls.genericDataPrepForm.controls.version
      ) {
        const genericDataPrepValue = this.etlForm.controls.genericDataPrepForm.controls
          .genericDataPrep.value as MeAutoCompleteOption & EtlDagService;
        this.etlForm.controls.genericDataPrepForm.controls.version.setValue({
          name: genericDataPrepValue.version,
          id: genericDataPrepValue.version,
        });
        this.selectedGenericDataPrepGitUrl = genericDataPrepValue['git_url'];
        this.etlForm.controls.genericDataPrepForm.controls.dockerImagePath.setValue(
          genericDataPrepValue.dockerImagePath,
        );
        this.etlForm.controls.genericDataPrepForm.controls.sdkVersion.setValue(
          genericDataPrepValue.sdkVersion ?? DEFAULT_ETL_INFERENCE_SDK_VERSION,
        );
        this.etlForm.controls.genericDataPrepForm.controls.sdkStatus.setValue(
          genericDataPrepValue.sdkStatus,
        );
      }
      if (formValue.logicForm && this.etlForm.controls.logicForm.controls.version) {
        const logicValue = this.etlForm.controls.logicForm.controls.logic
          .value as MeAutoCompleteOption & EtlDagService;
        this.etlForm.controls.logicForm.controls.version.setValue({
          name: logicValue.version,
          id: logicValue.version,
        });
        this.selectedLogicGitUrl = logicValue['git_url'];
        this.etlForm.controls.logicForm.controls.dockerImagePath.setValue(
          logicValue.dockerImagePath,
        );
        this.etlForm.controls.logicForm.controls.sdkVersion.setValue(
          logicValue.sdkVersion ?? DEFAULT_ETL_INFERENCE_SDK_VERSION,
        );
        this.etlForm.controls.logicForm.controls.sdkStatus.setValue(logicValue.sdkStatus);
      }
      if (formValue?.genericDataPrepForm?.resourcesDefinition) {
        this.etlForm.controls.genericDataPrepForm.controls.capacityChecked.setValue(true);
      }
      if (formValue?.logicForm?.resourcesDefinition) {
        this.etlForm.controls.logicForm.controls.capacityChecked.setValue(true);
      }
    }
  }

  private _publish(): void {
    const formValue = this.etlForm.getRawValue();
    const diffKeys = getDiffKeys(this.initialFormData, formValue);
    const currentValue = this.etlFormService.serializeFormToEtlObj(
      this._getAllServices(),
      formValue,
    );
    const nextValue = this.getNextFormValue(currentValue, diffKeys);
    this.fromValueChanged.emit({
      etl: nextValue,
    });
  }

  private _removeUnusedNodes(): void {
    if (this.formMode === 'create') {
      return;
    }
    const services = this._getEtlServices();
    const hasLogicService = _some(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.Logic,
    );
    const hasGenericDataPrepService = _some(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.GenericDataPrep,
    );
    if (!hasGenericDataPrepService) {
      this.etlForm.removeControl('genericDataPrepForm');
    }
    if (!hasLogicService) {
      this.etlForm.removeControl('logicForm');
    }
  }

  private _getEtlServices(): Array<EtlDagService> {
    if (!this.etl) {
      return [];
    }
    const services: Array<EtlDagService> = [];
    Object.keys(this.etl.services || {}).forEach((serviceId: string) => {
      services.push(this.etl.services[serviceId]);
    });
    return services;
  }

  private _setDefaultValuesForResourcesDefinitionControls(): void {
    this.etlForm.controls?.genericDataPrepForm?.controls?.resourcesDefinition?.setValue({
      ram: RAM_DEFAULT_VALUE,
      runtime: RUN_TIME_DEFAULT_VALUE,
    });
    this.etlForm.controls?.logicForm?.controls?.resourcesDefinition?.setValue({
      ram: RAM_DEFAULT_VALUE,
      runtime: RUN_TIME_DEFAULT_VALUE,
    });
  }

  private async _openWarningCapacityDialog(): Promise<void> {
    const dialogRef = this.dialog.open(MeAreYouSureDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.title = 'Attention';
    dialogRef.componentInstance.hideCancelButton = true;
    dialogRef.componentInstance.contentHtml = `<div>
    Please modify your code to use the appropriate number of optimization resources needed.<br>
    Note - Increasing number of resources affects cloud cost.</div>`;
    dialogRef.componentInstance.confirmPlaceHolder = `Ok`;
  }

  private _getAllServices(): Array<EtlDagService> {
    const services: Array<EtlDagService> = [];
    if (this.selectedGenericDataPrepServices?.length) {
      services.push(...this.selectedGenericDataPrepServices);
    }

    if (this.selectedLogicServices?.length) {
      services.push(...this.selectedLogicServices);
    }

    return services;
  }

  private _setGenericDataPrepVersionOptions(): void {
    const selected = this.etlForm.controls.genericDataPrepForm.controls.genericDataPrep?.value;
    this.genericDataPrepVersionOptions =
      selected && this.selectedGenericDataPrepServices
        ? this.etlFormService.getVersionsByService(this.selectedGenericDataPrepServices)
        : [];
  }

  private _setLogicVersionOptions(): void {
    const selected = this.etlForm.controls.logicForm.controls.logic?.value;
    this.logicVersionOptions =
      selected && this.selectedLogicServices
        ? this.etlFormService.getVersionsByService(this.selectedLogicServices)
        : [];
  }

  private _setVersionLoading(isLoading: boolean, type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.GenericDataPrep) {
      this.genericDataPrepVersionLoadingSubscription.next(isLoading);
    } else if (type === EtlServiceTypes.Logic) {
      this.logicVersionLoadingSubscription.next(isLoading);
    }
  }

  private _fetchServices(name: string, type: EtlServiceTypes): Observable<Array<EtlDagService>> {
    this._resetVersionOptions(type);
    this._setVersionLoading(true, type);
    return this.etlService.getServices({name, type}).pipe(
      catchError(() => of(null)),
      first(),
      tap((response: Array<EtlDagService>) => {
        if (response) {
          if (type === EtlServiceTypes.GenericDataPrep) {
            this.selectedGenericDataPrepServices = [...response];
            this._setGenericDataPrepVersionOptions();
          } else if (type === EtlServiceTypes.Logic) {
            this.selectedLogicServices = [...response];
            this._setLogicVersionOptions();
          }
        }
      }),
      finalize(() => this._setVersionLoading(false, type)),
    );
  }

  private _resetVersionOptions(type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.GenericDataPrep) {
      this.selectedGenericDataPrepServices = [];
      this._setGenericDataPrepVersionOptions();
    } else if (type === EtlServiceTypes.Logic) {
      this.selectedLogicServices = [];
      this._setLogicVersionOptions();
    }
  }

  private _onGenericDataPrepServiceNameChanged(option: MeAutoCompleteOption): void {
    if (option?.id) {
      this._fetchServices(option.id, EtlServiceTypes.GenericDataPrep)
        .pipe(untilDestroyed(this))
        .subscribe();
    } else {
      this.selectedGenericDataPrepServices = [];
      this._setGenericDataPrepVersionOptions();
    }
  }

  private _onLogicServiceNameChanged(option: MeAutoCompleteOption): void {
    if (option?.id) {
      this._fetchServices(option.id, EtlServiceTypes.Logic).pipe(untilDestroyed(this)).subscribe();
    } else {
      this.selectedLogicServices = [];
      this._setLogicVersionOptions();
    }
  }

  private _generateLogicFormGroup(): FormGroup<EtlModelInferenceLogicFormGroupType> {
    return new FormGroup(
      {
        logic: new FormControl<MeAutoCompleteOption & (EtlServiceName | EtlDagService)>(null, {
          validators: Validators.required,
        }),
        version: new FormControl<MeAutoCompleteOption>(null, {
          validators: Validators.required,
        }),
        versionOptions: new FormControl<Array<MeAutoCompleteOption>>([], {
          validators: Validators.required,
        }),
        dockerImagePath: new FormControl<string>({value: null, disabled: true}),
        sdkVersion: new FormControl<string>({
          value: DEFAULT_ETL_INFERENCE_SDK_VERSION,
          disabled: true,
        }),
        sdkStatus: new FormControl<SdkStatus>(null),
        configuration: new FormControl(null),
        capacityChecked: new FormControl<boolean>(false),
        resourcesDefinition: new FormGroup({
          ram: new FormControl<number>(RAM_DEFAULT_VALUE),
          runtime: new FormControl<number>(RUN_TIME_DEFAULT_VALUE),
        }),
      },
      {
        validators: Validators.compose([
          this.warningSdkVersion('sdkStatus', 'sdkVersion'),
          this.deprecationWarningSdkVersion('sdkStatus', 'sdkVersion'),
          this.deprecatedSdkVersion('sdkStatus', 'sdkVersion'),
        ]),
      },
    );
  }
}
