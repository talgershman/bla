import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
  viewChild,
} from '@angular/core';
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
import {Params} from '@angular/router';
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
import {PickerControlComponent} from 'deep-ui/shared/components/src/lib/controls/picker-control';
import {SelectParsingListComponent} from 'deep-ui/shared/components/src/lib/selection/select-parsing-list';
import {EtlService} from 'deep-ui/shared/core';
import {
  EtlDagService,
  EtlServiceName,
  EtlServiceTypes,
  EtlTypeEnum,
  ParsingConfiguration,
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
import {BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {catchError, delay, distinctUntilChanged, finalize, first, tap} from 'rxjs/operators';

import {EtlFormBaseDirective} from '../etl-form-base.directive';
import {DEFAULT_ETL_INFERENCE_SDK_VERSION} from '../etl-model-inference-form/etl-model-inference-form-entities';
import {EtlValidationFormService} from './etl-validation-form.service';
import {
  DEFAULT_ETL_SDK_VERSION,
  EtlValidationProbeLogicFormGroupType,
} from './etl-validation-form-entities';

const RAM_DEFAULT_VALUE = 4;

const RUN_TIME_DEFAULT_VALUE = 10;

@UntilDestroy()
@Component({
  selector: 'de-etl-validation-form',
  templateUrl: './etl-validation-form.component.html',
  styleUrls: ['./etl-validation-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    PickerControlComponent,
    SelectParsingListComponent,
    NgTemplateOutlet,
    AsyncPipe,
  ],
  providers: [EtlValidationFormService],
})
export class EtlValidationFormComponent
  extends EtlFormBaseDirective
  implements OnInit, AfterViewInit
{
  @Input()
  parsingConfigs: Array<ParsingConfiguration>;

  @ViewChild('rootForm', {static: false})
  rootFormTemplate: TemplateRef<any>;

  @ViewChild('rootFormElement', {static: false, read: FormGroupDirective})
  rootFormElement: FormGroupDirective;

  @ViewChild('dataPrepForm', {static: false})
  dataPrepFormTemplate: TemplateRef<any>;

  @ViewChild('dataPrepFormElement', {static: false, read: FormGroupDirective})
  dataPrepFormElement: FormGroupDirective;

  @ViewChild('probeLogicForm', {static: false})
  probeLogicFormTemplate: TemplateRef<any>;

  @ViewChild('probeLogicFormElement', {static: false, read: FormGroupDirective})
  probeLogicFormElement: FormGroupDirective;

  private etlFormService = inject(EtlValidationFormService);
  private etlService = inject(EtlService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  etlLogicServicesOptions: Array<MeAutoCompleteOption>;

  dataPrepServicesOptions: Array<MeAutoCompleteOption>;

  selectParsingDialogTemplate = viewChild<TemplateRef<any>>('selectParsingDialogTemplate');

  parsingDialogTitle = 'Select Parsing Configuration';

  parsingDeserialized = new ReplaySubject<ParsingConfiguration>(1);

  readonly parsingTableComponentId = 'etl-validation-form-select-parsing';

  parsingInitialTableFilters: Params;

  parsingValueSelected = new Subject<ParsingConfiguration>();

  get etlLogicVersionOptions(): Array<MeAutoCompleteOption> {
    return this._etlLogicVersionOptions;
  }

  set etlLogicVersionOptions(options: Array<MeAutoCompleteOption>) {
    this._etlLogicVersionOptions = options;
    if (this.etlForm.controls.probeLogicForm) {
      this.etlForm.controls.probeLogicForm.controls.versionOptions.setValue(options);
    }
  }

  get dataPrepVersionOptions(): Array<MeAutoCompleteOption> {
    return this._dataPrepVersionOptions;
  }

  set dataPrepVersionOptions(options: Array<MeAutoCompleteOption>) {
    this._dataPrepVersionOptions = options;
    if (this.etlForm.controls.dataPrepForm) {
      this.etlForm.controls.dataPrepForm.controls.versionOptions.setValue(options);
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
      parsingConfiguration: new FormControl<{id: number | string; entity: ParsingConfiguration}>(
        null,
        {
          validators: Validators.required,
        },
      ),
      tags: new FormControl<Array<string>>([]),
      description: new FormControl<string>(''),
    }),
    dataPrepForm: this.fb.group(
      {
        dataPrep: new FormControl<MeAutoCompleteOption & (EtlServiceName | EtlDagService)>(null, {
          validators: Validators.required,
        }),
        version: new FormControl<MeAutoCompleteOption>(null, {
          validators: Validators.required,
        }),
        versionOptions: new FormControl<Array<MeAutoCompleteOption>>([], {
          validators: Validators.required,
        }),
        dockerImagePath: new FormControl<string>({value: null, disabled: true}),
        sdkVersion: new FormControl<string>({value: DEFAULT_ETL_SDK_VERSION, disabled: true}),
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
    probeLogicForm: this._generateLogicFormGroup(),
  });

  selectedDataPrepServices: Array<EtlDagService> = [];

  selectedProbeLogicServices: Array<EtlDagService> = [];

  selectedDataPrepGitUrl: string;

  selectedProbeLogicGitUrl: string;

  warningKey = warningKey;

  hintKey = hintKey;

  forceErrorMsgKey = forceErrorMsgKey;

  showForm = new BehaviorSubject(false);

  showForm$ = this.showForm.asObservable();

  EtlServiceTypes = EtlServiceTypes;

  readonly RAM_DEFAULT_VALUE = RAM_DEFAULT_VALUE;

  readonly RUN_TIME_DEFAULT_VALUE = RUN_TIME_DEFAULT_VALUE;

  private _etlLogicVersionOptions: Array<MeAutoCompleteOption>;

  private _dataPrepVersionOptions: Array<MeAutoCompleteOption>;

  // eslint-disable-next-line
  private dataPrepVersionLoadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  dataPrepVersionLoading$ = this.dataPrepVersionLoadingSubscription.asObservable();

  // eslint-disable-next-line
  private etlLogicVersionLoadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  etlLogicVersionLoading$ = this.etlLogicVersionLoadingSubscription.asObservable();

  ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    this._registerEvents();
    this._updateSelectedServices();
    this._setDiagramNodes();
    this._setEtlLogicServicesOptions();
    this._setDataPrepServicesOptions();
    this.showForm.next(true);
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.etlForm.markAllAsTouched();
    this.onTriggerSubmitForNestedForms();
    this.etlForm.controls.rootForm.controls.name.updateValueAndValidity({onlySelf: true});
    this.isFormValid.next();
  }

  onTriggerSubmitForNestedForms(): void {
    this.rootFormElement?.onSubmit(undefined);
    this.dataPrepFormElement?.onSubmit(undefined);
    this.probeLogicFormElement?.onSubmit(undefined);
  }

  onServiceChanged(selected: MatAutocompleteSelectedEvent, type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.ProbeLogic) {
      this.etlForm.controls.probeLogicForm.controls.version.setValue(null);
      this.etlForm.controls.probeLogicForm.controls.dockerImagePath.setValue(null);
      this.etlForm.controls.probeLogicForm.controls.sdkVersion.setValue(DEFAULT_ETL_SDK_VERSION);
      this.etlForm.controls.probeLogicForm.controls.sdkStatus.setValue(null);
      this.etlForm.controls.probeLogicForm.controls.configuration.setValue(null);
      this.etlForm.controls.probeLogicForm.controls.sdkVersion.markAsTouched();
    } else if (type === EtlServiceTypes.DataPrep) {
      this.etlForm.controls.dataPrepForm.controls.version.setValue(null);
      this.etlForm.controls.dataPrepForm.controls.dockerImagePath.setValue(null);
      this.etlForm.controls.dataPrepForm.controls.sdkVersion.setValue(DEFAULT_ETL_SDK_VERSION);
      this.etlForm.controls.dataPrepForm.controls.sdkStatus.setValue(null);
      this.etlForm.controls.dataPrepForm.controls.configuration.setValue(null);
      this.etlForm.controls.dataPrepForm.controls.sdkVersion.markAsTouched();
    }
  }

  onVersionChanged(
    selected: MeAutoCompleteOption,
    serviceName: string,
    type: EtlServiceTypes,
  ): void {
    const selectedService: EtlDagService = this.etlFormService.getSelectedEtlDagService(
      type === EtlServiceTypes.DataPrep
        ? this.selectedDataPrepServices
        : this.selectedProbeLogicServices,
      serviceName,
      selected?.name,
      type,
    );
    const config = selectedService?.configuration;
    if (type === EtlServiceTypes.ProbeLogic) {
      this.etlForm.controls.probeLogicForm.controls.configuration.setValue(config);
      this.etlForm.controls.probeLogicForm.controls.dockerImagePath.setValue(
        selectedService?.dockerImagePath ?? '',
      );
      this.etlForm.controls.probeLogicForm.controls.sdkVersion.setValue(
        selectedService?.sdkVersion ?? DEFAULT_ETL_SDK_VERSION,
      );
      this.etlForm.controls.probeLogicForm.controls.sdkStatus.setValue(selectedService?.sdkStatus);
      this.selectedProbeLogicGitUrl = selectedService?.gitUrl;
      this.etlForm.controls.probeLogicForm.controls.sdkVersion.markAsTouched();
    } else if (type === EtlServiceTypes.DataPrep) {
      this.etlForm.controls.dataPrepForm.controls.configuration.setValue(config);
      this.etlForm.controls.dataPrepForm.controls.dockerImagePath.setValue(
        selectedService?.dockerImagePath ?? '',
      );
      this.etlForm.controls.dataPrepForm.controls.sdkVersion.setValue(
        selectedService?.sdkVersion ?? DEFAULT_ETL_SDK_VERSION,
      );
      this.etlForm.controls.dataPrepForm.controls.sdkStatus.setValue(selectedService?.sdkStatus);
      this.selectedDataPrepGitUrl = selectedService?.gitUrl;
      this.etlForm.controls.dataPrepForm.controls.sdkVersion.markAsTouched();
    }
  }

  onDeleteNode(formGroupName: 'probeLogicForm' | 'logicForm', nodeId: string): void {
    super.onDeleteNode(formGroupName, nodeId);
    this.etlForm.removeControl(formGroupName as 'probeLogicForm');
  }

  onShowProbeLogicNode(value: MatSlideToggleChange): void {
    if (value.checked) {
      this._restoreLogicNode();
    } else {
      this.onDeleteNode('probeLogicForm', 'probeLogic');
    }
  }

  onCapacityCheckBoxChange(value: MatCheckboxChange, serviceType: EtlServiceTypes): void {
    if (serviceType === EtlServiceTypes.DataPrep) {
      this.etlForm.controls.dataPrepForm.controls.capacityChecked.setValue(value.checked);
    } else if (serviceType === EtlServiceTypes.ProbeLogic) {
      this.etlForm.controls.probeLogicForm.controls.capacityChecked.setValue(value.checked);
    }
    if (value.checked) {
      this._openWarningCapacityDialog();
    } else {
      this._setDefaultValuesForResourcesDefinitionControls();
    }
  }

  onParsingChanged(parsingConfigurations: ParsingConfiguration[]): void {
    const parsingConfig = parsingConfigurations.length ? parsingConfigurations[0] : null;
    this.parsingValueSelected.next(parsingConfig);
  }

  protected onFormValid(): void {
    this._publish();
  }

  private _setDefaultValuesForResourcesDefinitionControls(): void {
    this.etlForm.controls?.dataPrepForm?.controls?.resourcesDefinition?.setValue({
      ram: RAM_DEFAULT_VALUE,
      runtime: RUN_TIME_DEFAULT_VALUE,
    });
    this.etlForm.controls?.probeLogicForm?.controls?.resourcesDefinition?.setValue({
      ram: RAM_DEFAULT_VALUE,
      runtime: RUN_TIME_DEFAULT_VALUE,
    });
  }

  private _openWarningCapacityDialog(): void {
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
    if (this.selectedDataPrepServices?.length) {
      services.push(...this.selectedDataPrepServices);
    }

    if (this.selectedProbeLogicServices?.length) {
      services.push(...this.selectedProbeLogicServices);
    }

    return services;
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

  private _initForm(): void {
    this._initFromBuilder();
    this._defineControls();
    this._deSerializeDataAndPatchForm();
    if (this.formMode === 'create') {
      this.initialFormData = this.etlForm.getRawValue();
    }
    this.etlForm.controls.dataPrepForm?.controls.sdkVersion?.markAsTouched();
    this.etlForm.controls.probeLogicForm?.controls.sdkVersion?.markAsTouched();
  }

  private _setDataPrepVersionOptions(): void {
    const selected = this.etlForm.controls.dataPrepForm.controls.dataPrep?.value;
    this.dataPrepVersionOptions =
      selected && this.selectedDataPrepServices
        ? this.etlFormService.getVersionsByService(this.selectedDataPrepServices)
        : [];
  }

  private _setEtlLogicVersionOptions(): void {
    const selected = this.etlForm.controls.probeLogicForm.controls.probeLogic?.value;
    this.etlLogicVersionOptions =
      selected && this.selectedProbeLogicServices
        ? this.etlFormService.getVersionsByService(this.selectedProbeLogicServices)
        : [];
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

  private _removeUnusedNodes(): void {
    if (this.formMode === 'create') {
      return;
    }
    const services = this._getEtlServices();
    const hasEtlLogicService = _some(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.ProbeLogic,
    );
    const hasDataPrepService = _some(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.DataPrep,
    );
    if (!hasDataPrepService) {
      this.etlForm.removeControl('dataPrepForm');
    }
    if (!hasEtlLogicService) {
      this.etlForm.removeControl('probeLogicForm');
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

  private _defineControls(): void {
    // root form
    this.teamControl = this.etlForm.controls.rootForm.controls.team;
    this.tagsControl = this.etlForm.controls.rootForm.controls.tags;
  }

  private _setVersionLoading(isLoading: boolean, type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.DataPrep) {
      this.dataPrepVersionLoadingSubscription.next(isLoading);
    } else if (type === EtlServiceTypes.ProbeLogic) {
      this.etlLogicVersionLoadingSubscription.next(isLoading);
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
          if (type === EtlServiceTypes.DataPrep) {
            this.selectedDataPrepServices = [...response];
            this._setDataPrepVersionOptions();
          } else if (type === EtlServiceTypes.ProbeLogic) {
            this.selectedProbeLogicServices = [...response];
            this._setEtlLogicVersionOptions();
          }
        }
      }),
      finalize(() => this._setVersionLoading(false, type)),
    );
  }

  private _resetVersionOptions(type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.DataPrep) {
      this.selectedDataPrepServices = [];
      this._setDataPrepVersionOptions();
    } else if (type === EtlServiceTypes.ProbeLogic) {
      this.selectedProbeLogicServices = [];
      this._setEtlLogicVersionOptions();
    }
  }

  private _registerEvents(): void {
    this._registerDataPrepEvents();
    this._registerProbeLogicEvents();
  }

  private _registerDataPrepEvents(): void {
    if (this.etlForm.controls.dataPrepForm) {
      this.etlForm.controls.dataPrepForm.controls.dataPrep.valueChanges
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe((option: MeAutoCompleteOption & (EtlServiceName | EtlDagService)) => {
          this._onDataPrepServiceNameChanged(option);
        });
    }
  }

  private _registerProbeLogicEvents(): void {
    if (this.etlForm.controls.probeLogicForm) {
      this.etlForm.controls.probeLogicForm.controls.probeLogic.valueChanges
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe((option: MeAutoCompleteOption) => {
          this._onEtlLogicServiceNameChanged(option);
        });
    }
  }

  private _onDataPrepServiceNameChanged(option: MeAutoCompleteOption): void {
    if (option?.id) {
      this._fetchServices(option.id, EtlServiceTypes.DataPrep)
        .pipe(untilDestroyed(this))
        .subscribe();
    } else {
      this.selectedDataPrepServices = [];
      this._setDataPrepVersionOptions();
    }
  }

  private _onEtlLogicServiceNameChanged(option: MeAutoCompleteOption): void {
    if (option?.id) {
      this._fetchServices(option.id, EtlServiceTypes.ProbeLogic)
        .pipe(untilDestroyed(this))
        .subscribe();
    } else {
      this.selectedProbeLogicServices = [];
      this._setEtlLogicVersionOptions();
    }
  }

  private _updateSelectedServices(): void {
    if (this.formMode === 'create') {
      return;
    }

    const services = this._getEtlServices();

    const dataPrepService = _find(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.DataPrep,
    );

    const etlLogicService = _find(
      services,
      (service: EtlDagService) => service.type === EtlServiceTypes.ProbeLogic,
    );

    const observables: Array<Observable<any>> = [];

    if (dataPrepService) {
      observables.push(this._fetchServices(dataPrepService.name, EtlServiceTypes.DataPrep));
    }

    if (etlLogicService) {
      observables.push(this._fetchServices(etlLogicService.name, EtlServiceTypes.ProbeLogic));
    }

    combineLatest(observables)
      .pipe(delay(200), untilDestroyed(this))
      .subscribe((_) => {
        this.initialFormData = this.etlForm.getRawValue();
      });
  }

  private _deSerializeDataAndPatchForm(): void {
    if (Object.keys(this.etl || {}).length) {
      const formValue = this.etlFormService.deSerializeEtlToFormObj(this.etl);
      this.etlForm.patchValue(formValue);
      this._setParsingConfig(formValue.rootForm.parsingConfiguration);
      if (formValue?.dataPrepForm && this.etlForm.controls.dataPrepForm.controls.version) {
        const dataPrepValue = this.etlForm.controls.dataPrepForm.controls.dataPrep
          .value as MeAutoCompleteOption & EtlDagService;
        this.etlForm.controls.dataPrepForm.controls.version.setValue({
          name: dataPrepValue.version,
          id: dataPrepValue.version,
        });
        this.selectedDataPrepGitUrl = dataPrepValue['git_url'];
        this.etlForm.controls.dataPrepForm.controls.dockerImagePath.setValue(
          dataPrepValue.dockerImagePath,
        );
        this.etlForm.controls.dataPrepForm.controls.sdkVersion.setValue(
          dataPrepValue.sdkVersion ?? DEFAULT_ETL_SDK_VERSION,
        );
        this.etlForm.controls.dataPrepForm.controls.sdkStatus.setValue(dataPrepValue.sdkStatus);
      }
      if (formValue.probeLogicForm && this.etlForm.controls.probeLogicForm.controls.version) {
        const probeLogicValue = this.etlForm.controls.probeLogicForm.controls.probeLogic
          .value as MeAutoCompleteOption & EtlDagService;
        this.etlForm.controls.probeLogicForm.controls.version.setValue({
          name: probeLogicValue.version,
          id: probeLogicValue.version,
        });
        this.selectedProbeLogicGitUrl = probeLogicValue['git_url'];
        this.etlForm.controls.probeLogicForm.controls.dockerImagePath.setValue(
          probeLogicValue.dockerImagePath,
        );
        this.etlForm.controls.probeLogicForm.controls.sdkVersion.setValue(
          probeLogicValue.sdkVersion ?? DEFAULT_ETL_SDK_VERSION,
        );
        this.etlForm.controls.probeLogicForm.controls.sdkStatus.setValue(probeLogicValue.sdkStatus);
      }
      if (formValue?.dataPrepForm?.resourcesDefinition) {
        this.etlForm.controls.dataPrepForm.controls.capacityChecked.setValue(true);
      }
      if (formValue?.probeLogicForm?.resourcesDefinition) {
        this.etlForm.controls.probeLogicForm.controls.capacityChecked.setValue(true);
      }
    }
  }

  private _setDiagramNodes(): void {
    this.nodes = this.etlFormService.getDiagramNodes(this.etlForm);
  }

  private _setEtlLogicServicesOptions(): void {
    this.etlLogicServicesOptions = this.etlFormService
      .getEtlLogicServices(this.serviceNames)
      .map((item: EtlServiceName) => {
        return {
          ...item,
          id: item.name,
        };
      });
  }

  private _setDataPrepServicesOptions(): void {
    this.dataPrepServicesOptions = this.etlFormService
      .getDataPrepServices(this.serviceNames)
      .map((item: EtlServiceName) => {
        return {
          ...item,
          id: item.name,
        };
      });
  }

  private _setParsingConfig(id: number): void {
    if (!id) {
      return;
    }
    const config = _find(this.parsingConfigs, {
      id,
    }) as ParsingConfiguration;
    this.parsingDeserialized.next(config);
    this.etlForm.controls.rootForm.controls.parsingConfiguration.setValue({
      id: config.id,
      entity: config,
    });
  }

  private _generateLogicFormGroup(): FormGroup<EtlValidationProbeLogicFormGroupType> {
    return new FormGroup(
      {
        probeLogic: new FormControl<MeAutoCompleteOption & (EtlServiceName | EtlDagService)>(null, {
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

  private _restoreLogicNode(): void {
    const logicFormGroup = this._generateLogicFormGroup();
    this.etlForm.addControl('probeLogicForm', logicFormGroup);
    const node = this.etlFormService.generateProbeLogicNode(this.etlForm);
    this.nodes.splice(2, 0, node);
    this._registerProbeLogicEvents();
    this.cd.detectChanges();
  }
}
