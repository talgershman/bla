import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectChange} from '@angular/material/select';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {
  MeAutocompleteComponent,
  MeAutoCompleteOption,
} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {getDiffKeys} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BUDGET_GROUP_TOOLTIP_MSG} from 'deep-ui/shared/common';
import {BudgetGroupControl} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {DatasourceService, EtlService} from 'deep-ui/shared/core';
import {
  Datasource,
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
import {BehaviorSubject, firstValueFrom, Observable, of} from 'rxjs';
import {catchError, distinctUntilChanged, finalize, first, tap} from 'rxjs/operators';

import {EtlFormBaseDirective} from '../etl-form-base.directive';
import {EtlPerfectTransformFormService} from './etl-perfect-transform-form.service';
import {DEFAULT_ETL_PERFECT_SDK_VERSION} from './etl-perfect-transform-form-entities';

@UntilDestroy()
@Component({
  selector: 'de-etl-perfect-transform-form',
  templateUrl: './etl-perfect-transform-form.component.html',
  styleUrls: ['./etl-perfect-transform-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MeInputComponent,
    MeTextareaComponent,
    MeSelectComponent,
    MeAutocompleteComponent,
    MatIconModule,
    MeTooltipDirective,
    MeFormControlChipsFieldComponent,
    MeJsonEditorComponent,
    MatCheckboxModule,
    MatSlideToggleModule,
    HintIconComponent,
    MeSafePipe,
    BudgetGroupControl,
    NgTemplateOutlet,
    AsyncPipe,
  ],
  providers: [EtlPerfectTransformFormService],
})
export class EtlPerfectTransformFormComponent
  extends EtlFormBaseDirective
  implements OnInit, AfterViewInit
{
  @ViewChild('rootForm', {static: false})
  rootFormTemplate: TemplateRef<any>;

  @ViewChild('rootFormElement', {static: false, read: FormGroupDirective})
  rootFormElement: FormGroupDirective;

  @ViewChild('perfectTransformForm', {static: false})
  perfectTransformFormTemplate: TemplateRef<any>;

  @ViewChild('perfectTransformFormElement', {static: false, read: FormGroupDirective})
  perfectTransformFormElement: FormGroupDirective;

  private etlPerfectTransformFormService = inject(EtlPerfectTransformFormService);
  private etlService = inject(EtlService);
  private fb = inject(FormBuilder);
  private dataSourceService = inject(DatasourceService);

  perfectTransformServicesOptions: Array<MeAutoCompleteOption>;

  _perfectTransformVersionOptions: Array<MeAutoCompleteOption>;

  get perfectTransformVersionOptions(): Array<MeAutoCompleteOption> {
    return this._perfectTransformVersionOptions;
  }

  set perfectTransformVersionOptions(options: Array<MeAutoCompleteOption>) {
    this._perfectTransformVersionOptions = options;
    if (this.etlForm.controls.perfectTransformForm) {
      this.etlForm.controls.perfectTransformForm.controls.versionOptions.setValue(options);
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
      budgetGroup: new FormControl<string>(''),
      triggerDataSourcesUpdate: new FormControl<boolean>(false),
    }),
    perfectTransformForm: this.fb.group(
      {
        perfectTransform: new FormControl<MeAutoCompleteOption & (EtlServiceName | EtlDagService)>(
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
        dockerImagePath: new FormControl<string>({value: null, disabled: true}),
        sdkVersion: new FormControl<string>({
          value: DEFAULT_ETL_PERFECT_SDK_VERSION,
          disabled: true,
        }),
        sdkStatus: new FormControl<SdkStatus>(null),
        configuration: new FormControl(null),
        params: new FormControl(null),
      },
      {
        validators: Validators.compose([
          this.warningSdkVersion('sdkStatus', 'sdkVersion'),
          this.deprecationWarningSdkVersion('sdkStatus', 'sdkVersion'),
          this.deprecatedSdkVersion('sdkStatus', 'sdkVersion'),
        ]),
      },
    ),
  });

  dataSourcesControl = new FormControl<string[]>({
    value: [],
    disabled: false,
  });

  dataSourcesOptions: Array<MeSelectOption> = [];

  selectedPerfectTransformServices: Array<EtlDagService> = [];

  selectedGitUrl: string;

  showDataSources = false;

  dataSources: Array<Datasource> = [];

  selectedDataSources: Array<Datasource> = [];

  warningKey = warningKey;

  hintKey = hintKey;

  triggerDatasourceUpdateTooltip: string;

  readonly BUDGET_GROUP_TOOLTIP_MSG = BUDGET_GROUP_TOOLTIP_MSG;

  private readonly ALLOWED_AUTO_UPDATE_DS_STATUSES = ['active', 'needs_sync'];

  forceErrorMsgKey = forceErrorMsgKey;

  // eslint-disable-next-line
  private perfectTransformVersionLoadingSubscription = new BehaviorSubject<boolean>(false);

  // eslint-disable-next-line
  perfectTransformVersionLoading$ = this.perfectTransformVersionLoadingSubscription.asObservable();

  ngOnInit(): void {
    super.ngOnInit();
    this._initForm();
    this._registerEvents();
    this._updateSelectedServices();
    this._setDiagramNodes();
    this._setPerfectTransformServicesOptions();
    this._setTriggerDatasourceUpdateTooltip();
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.etlForm.markAllAsTouched();
    this.onTriggerSubmitForNestedForms();
    this.etlForm.controls.rootForm.controls.name.updateValueAndValidity();
    this.isFormValid.next();
  }

  onServiceChanged(selected: MatAutocompleteSelectedEvent, type: EtlServiceTypes): void {
    if (type === EtlServiceTypes.PerfectTransform) {
      this.etlForm.controls.perfectTransformForm.controls.version.setValue(null);
      this.etlForm.controls.perfectTransformForm.controls.dockerImagePath.setValue(null);
      this.etlForm.controls.perfectTransformForm.controls.sdkVersion.setValue(
        DEFAULT_ETL_PERFECT_SDK_VERSION,
      );
      this.etlForm.controls.perfectTransformForm.controls.sdkStatus.setValue(null);
      this.etlForm.controls.perfectTransformForm.controls.configuration.setValue(null);
      this.etlForm.controls.perfectTransformForm.controls.params.setValue(null);
      this.etlForm.controls.perfectTransformForm.controls.sdkVersion.markAsTouched();
      this._enableOrDisableTriggerDataSourcesUpdate();
    }
  }

  onVersionChanged(
    selected: MeAutoCompleteOption,
    serviceName: string,
    type: EtlServiceTypes,
  ): void {
    const selectedService: EtlDagService =
      this.etlPerfectTransformFormService.getSelectedEtlDagService(
        this.selectedPerfectTransformServices,
        serviceName,
        selected?.name,
        type,
      );
    if (type === EtlServiceTypes.PerfectTransform) {
      this.etlForm.controls.perfectTransformForm.controls.dockerImagePath.setValue(
        selectedService?.dockerImagePath ?? '',
      );
      this.etlForm.controls.perfectTransformForm.controls.sdkVersion.setValue(
        selectedService?.sdkVersion ?? DEFAULT_ETL_PERFECT_SDK_VERSION,
      );
      this.etlForm.controls.perfectTransformForm.controls.sdkStatus.setValue(
        selectedService?.sdkStatus,
      );
      this.selectedGitUrl = selectedService?.gitUrl;
      this._setConfigurationValue(selectedService);
      this.etlForm.controls.perfectTransformForm.controls.sdkVersion.markAsTouched();
      this._enableOrDisableTriggerDataSourcesUpdate();
    }
  }

  onFormValid(): void {
    const formValue = this.etlForm.getRawValue();
    let budgetGroup;
    if (this.dataSourcesControl?.value?.length) {
      budgetGroup = formValue?.rootForm?.budgetGroup;
    }
    const diffKeys = getDiffKeys(this.initialFormData, formValue);
    const currentValue = this.etlPerfectTransformFormService.serializeFormToEtlObj(
      this.selectedPerfectTransformServices,
      formValue,
      this.etl?.metadata,
    );
    const nextValue = this.getNextFormValue(currentValue, diffKeys);
    delete nextValue?.budgetGroup;
    this._setSelectedDataSources();
    this.fromValueChanged.emit({
      etl: nextValue,
      dataSources: this.selectedDataSources,
      ...(budgetGroup?.length && {budgetGroup: budgetGroup}),
    });
  }

  async onTriggerDatasourceChange(value: MatSlideToggleChange): Promise<void> {
    this._resetDatasources();
    if (value.checked) {
      await this._getEtlDataSources();
    }
  }

  onTriggerDatasourceOptionChange(event: MatSelectChange): void {
    if (event.value?.length > 0) {
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.setValue(true);
      this._setTriggerDatasourceUpdateTooltip();
    } else {
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.setValue(false);
      this._setTriggerDatasourceUpdateTooltip();
    }
  }

  private _setConfigurationValue(selectedService: EtlDagService): void {
    const copyConfig = {
      ...(selectedService?.configuration || {}),
    };
    const params = {
      ...(selectedService?.configuration?.params || {}),
    };
    delete copyConfig.params;
    this.etlForm.controls.perfectTransformForm.controls.configuration.setValue(copyConfig);
    this.etlForm.controls.perfectTransformForm.controls.params.setValue(params);
  }

  private async _getEtlDataSources(): Promise<void> {
    const dataSources = await firstValueFrom(
      this.dataSourceService.getMulti({dataType: 'perfects', etlName: this.etl.name}),
    );
    this.dataSources = dataSources.filter((ds: Datasource) =>
      this.ALLOWED_AUTO_UPDATE_DS_STATUSES.includes(ds.status),
    );
    this.dataSourcesOptions = this.dataSources.map((ds: Datasource) => ({
      id: ds.id,
      value: ds.name,
    }));
    this.dataSourcesControl.setValue(this.dataSourcesOptions.map((ds: MeSelectOption) => ds.id));
    this.showDataSources = true;
    this.cd.detectChanges();
  }

  private _resetDatasources(): void {
    this.dataSources = [];
    this.selectedDataSources = [];
    this.dataSourcesOptions = [];
    this.dataSourcesControl.setValue([]);
    this.showDataSources = false;
  }

  private _setSelectedDataSources(): void {
    if (
      !this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.value ||
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.disabled
    ) {
      return;
    }

    for (const dsId of this.dataSourcesControl.value) {
      const ds = this.dataSources.find((d: Datasource) => d.id === dsId);
      if (ds) {
        this.selectedDataSources.push(ds);
      }
    }
  }

  private _isServiceOrVersionChanged(): boolean {
    const services = Object.values(this.etl.services);
    for (const service of services) {
      const {name, version} = service;
      if (
        name !== this.etlForm.controls.perfectTransformForm.controls.perfectTransform.value?.name ||
        version !== this.etlForm.controls.perfectTransformForm.controls.version.value?.name
      ) {
        return true;
      }
    }
    return false;
  }

  private _enableOrDisableTriggerDataSourcesUpdate(): void {
    if (this.formMode !== 'edit' || !this.etl.metadata?.triggerDataSourcesUpdate) {
      return;
    }

    if (this._isServiceOrVersionChanged()) {
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.enable();
      this.dataSourcesControl.enable();
      this._setTriggerDatasourceUpdateTooltip();
    } else {
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.disable();
      this.dataSourcesControl.disable();
      this._setTriggerDatasourceUpdateTooltip();
    }
  }

  onTriggerSubmitForNestedForms(): void {
    this.rootFormElement?.onSubmit(undefined);
    this.perfectTransformFormElement?.onSubmit(undefined);
  }

  private _initForm(): void {
    this._setFormDefaults();
    this._defineControls();
    this._deSerializeDataAndPatchForm();
    if (this.formMode !== 'edit') {
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.disable();
      this.dataSourcesControl.disable();
    }
    this.etlForm.controls.perfectTransformForm.controls.sdkVersion?.markAsTouched();
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

  private _setPerfectTransformVersionOptions(): void {
    const selected = this.etlForm.controls.perfectTransformForm.controls.perfectTransform?.value;
    this.perfectTransformVersionOptions =
      selected && this.selectedPerfectTransformServices
        ? this.etlPerfectTransformFormService.getVersionsByService(
            this.selectedPerfectTransformServices,
          )
        : [];
  }

  private _defineControls(): void {
    this._defineRootFormGroup();
  }
  private _fetchServices(name: string, callback?: () => void): Observable<Array<EtlDagService>> {
    this._resetVersionOptions();
    this.perfectTransformVersionLoadingSubscription.next(true);
    return this.etlService.getServices({name, type: EtlServiceTypes.PerfectTransform}).pipe(
      catchError(() => of(null)),
      first(),
      tap((response: Array<EtlDagService>) => {
        if (response) {
          this.selectedPerfectTransformServices = [...response];
          this._setPerfectTransformVersionOptions();
          if (callback) {
            callback();
          }
        }
      }),
      finalize(() => this.perfectTransformVersionLoadingSubscription.next(false)),
    );
  }

  private _resetVersionOptions(): void {
    this.selectedPerfectTransformServices = [];
    this._setPerfectTransformVersionOptions();
  }

  private _registerEvents(): void {
    if (this.etlForm.controls.perfectTransformForm) {
      this.etlForm.controls.perfectTransformForm.controls.perfectTransform.valueChanges
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe((option: MeAutoCompleteOption) => {
          this._onPerfectTransformNameChanged(option);
        });
    }
  }

  private _onPerfectTransformNameChanged(option: MeAutoCompleteOption): void {
    if (option?.id) {
      this._fetchServices(option.id).pipe(untilDestroyed(this)).subscribe();
    } else {
      this.selectedPerfectTransformServices = [];
      this._setPerfectTransformVersionOptions();
    }
  }

  private _updateSelectedServices(): void {
    if (this.formMode === 'create' || !this.etl) {
      return;
    }

    const perfectTransformService: EtlDagService = this.etl.services[this.etl.servicesDag.root];
    if (perfectTransformService) {
      this._fetchServices(perfectTransformService.name)
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.initialFormData = this.etlForm.getRawValue();
        });
    }
  }

  private _deSerializeDataAndPatchForm(): void {
    if (Object.keys(this.etl || {}).length) {
      const formValue = this.etlPerfectTransformFormService.deSerializeEtlToFormObj(this.etl);
      this.etlForm.patchValue(formValue);
      const perfectTransformValue = this.etlForm.controls.perfectTransformForm.controls
        .perfectTransform.value as MeAutoCompleteOption & EtlDagService;
      this.etlForm.controls.perfectTransformForm.controls.version.setValue({
        name: perfectTransformValue.version,
        id: perfectTransformValue.version,
      });
      this.selectedGitUrl = perfectTransformValue['git_url'];
      this.etlForm.controls.perfectTransformForm.controls.dockerImagePath.setValue(
        perfectTransformValue.dockerImagePath,
      );
      this.etlForm.controls.perfectTransformForm.controls.sdkVersion.setValue(
        perfectTransformValue.sdkVersion ?? DEFAULT_ETL_PERFECT_SDK_VERSION,
      );
      this.etlForm.controls.perfectTransformForm.controls.sdkStatus.setValue(
        perfectTransformValue.sdkStatus,
      );
    }
  }

  private _setDiagramNodes(): void {
    this.nodes = this.etlPerfectTransformFormService.getDiagramNodes(this.etlForm);
  }

  private _setPerfectTransformServicesOptions(): void {
    this.perfectTransformServicesOptions = this.etlPerfectTransformFormService
      .getPerfectTransformServices(this.serviceNames)
      .map((item: EtlServiceName) => {
        return {
          ...item,
          id: item.name,
        };
      });
  }

  private _defineRootFormGroup(): void {
    this.teamControl = this.etlForm.controls.rootForm.controls.team;
    this.tagsControl = this.etlForm.controls.rootForm.controls.tags;
  }

  private _setTriggerDatasourceUpdateTooltip() {
    if (
      this.formMode === 'edit' &&
      this.etlForm.controls.rootForm.controls.triggerDataSourcesUpdate.disabled
    ) {
      this.triggerDatasourceUpdateTooltip =
        'Change the ETL service or its version to update the data sources';
    } else if (this.formMode === 'edit') {
      this.triggerDatasourceUpdateTooltip =
        'By checking this option DEEP will trigger jobs updating all Data Sources created by this ETL when a new ETL version is published';
    } else {
      this.triggerDatasourceUpdateTooltip = 'Enabled only in new revision of ETL';
    }
  }
}
