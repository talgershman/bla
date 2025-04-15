import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
  Signal,
  signal,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormControlStatus,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatChipListbox, MatChipListboxChange, MatChipOption} from '@angular/material/chips';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTabsModule} from '@angular/material/tabs';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {
  addDaysToDate,
  dateNow,
  PERMANENT_DATE,
  toShortDate,
} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ApiCallState} from 'deep-ui/shared/components/src/lib/common';
import {
  DataRetentionControlComponent,
  sortDataRetentionKeys,
} from 'deep-ui/shared/components/src/lib/controls/data-retention-control';
import {OverrideEtlParamsControlComponent} from 'deep-ui/shared/components/src/lib/controls/override-etl-params-control';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {DeepUtilService, EtlService, LaunchService, OnPremService} from 'deep-ui/shared/core';
import {
  DataRetentionConfig,
  DataRetentionKnownKeysEnum,
  DataRetentionObj,
  ETL,
  EtlDagService,
  EtlJobRunType,
} from 'deep-ui/shared/models';
import {DeepFormValidations} from 'deep-ui/shared/validators';
import _cloneDeep from 'lodash-es/cloneDeep';
import _filter from 'lodash-es/filter';
import _isEqual from 'lodash-es/isEqual';
import _isString from 'lodash-es/isString';
import _startCase from 'lodash-es/startCase';
import {derivedAsync} from 'ngxtension/derived-async';
import {OnChange} from 'property-watch-decorator';
import {combineLatest, lastValueFrom, of} from 'rxjs';
import {catchError, distinctUntilChanged, map, startWith} from 'rxjs/operators';

import {RunConfigStepService} from './run-config-step.service';

const OUTPUT_PATH_TOOLTIP = `Tip: Use the output path as a versioning tool to track ETL results and align them with your latest changes or updates.
       * If you append version numbers to your path names (e.g., SRD8_1.0.3 or v0.10.1), our built-in features can suggest the next version for you.
       * For tools or engines that query data from a shared S3 folder, you can save multiple ETL execution results to the same output path for seamless querying
`;

@UntilDestroy()
@Component({
  selector: 'de-run-config-step',
  templateUrl: './run-config-step.component.html',
  styleUrls: ['./run-config-step.component.scss'],
  providers: [RunConfigStepService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule,
    MeSelectComponent,
    MeInputComponent,
    MeFormControlChipsFieldComponent,
    DataRetentionControlComponent,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    OverrideEtlParamsControlComponent,
    MatAccordion,
    MatExpansionPanelDescription,
    MatExpansionPanelTitle,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelContent,
    HintIconComponent,
    MeSafePipe,
    MatChipListbox,
    MatChipOption,
    MatIcon,
    MatProgressSpinner,
  ],
})
export class RunConfigStepComponent extends BaseStepDirective implements OnInit {
  @Input()
  showNext: boolean;

  @Input()
  @OnChange<void>('_onShown')
  wasShown: boolean;

  @Input()
  runType: EtlJobRunType;

  @Input()
  enableOutputPath: boolean;

  @Input()
  enableMergeParsedData: boolean;

  @Input()
  enableSkipMestRetry: boolean;

  @Input()
  enableServices: boolean;

  @Input()
  enableForceParsing: boolean;

  @Input()
  dataRetentionInfoObj: DataRetentionConfig;

  @Output()
  technologyChanged = new EventEmitter<string>();

  etl = input<ETL>(null);

  etlState = computed(() => {
    return {
      etl: this.etl(),
      derivedLogic: async () => {
        if (this.etl()) {
          this.show.set(false);
          await this._setInitialParamsControlValue();
          this.show.set(true);
        } else {
          this.show.set(true);
        }
      },
    };
  });

  EtlJobRunType = EtlJobRunType;

  private fb = inject(FormBuilder);
  private deepUtilService = inject(DeepUtilService);
  private etlService = inject(EtlService);
  private timerService = inject(MeTimerService);
  private runConfigStepService = inject(RunConfigStepService);
  private onPremService = inject(OnPremService);
  private launchService = inject(LaunchService);

  dataRetentionPanelDescription = signal<string>('');

  etlParamsPanelDescription = signal<string>('');

  defaultOverrideParams: any;

  expandOverrideParams = false;

  deepTeamOptions: Array<string>;

  runConfigForm = this.fb.group({
    tags: new FormControl<Array<string>>([]),
    mergeParsedData: this.jobFormBuilderService.createNewFormControl<boolean>(
      false,
      'metadata.merge_parsed_data',
    ),
    outputPath: this.jobFormBuilderService.createNewFormControl<string>(null, 'output_path'),
    createDatasourceFromParsedData: this.jobFormBuilderService.createNewFormControl<boolean>(
      false,
      'metadata.create_datasource_from_parsed_data',
    ),
    overrideParams: new FormControl(null, {
      asyncValidators: DeepFormValidations.validateUserParams(this.launchService, this.etl),
    }),
    skipMestRetry: this.jobFormBuilderService.createNewFormControl<boolean>(
      false,
      'metadata.mest_settings.skip_mest_retry',
    ),
    team: new FormControl<string>(null, Validators.required),
    dataRetention: new FormControl<any>(null),
    forceParsing: this.jobFormBuilderService.createNewFormControl<boolean>(
      false,
      'metadata.force_parsing',
    ),
  });

  show = signal(false);

  teamSignal = toSignal(this.runConfigForm.controls.team.valueChanges);

  outputPathSignal = toSignal(this.runConfigForm.controls.outputPath.valueChanges);

  previewOutputPath = computed(() => {
    const originalTeam = this.teamSignal() || this.runConfigForm.controls.team.value;
    const etl = this.etl();
    const outputPath = this.outputPathSignal() || this.runConfigForm.controls.outputPath.value;
    return this.runConfigStepService.getPreviewOutputPath(etl, originalTeam, outputPath);
  });

  outputPathSuggestions: Signal<ApiCallState<Array<{value: string; label: string}>>> = derivedAsync(
    () => {
      const originalTeam = this.teamSignal() || this.runConfigForm.controls.team.value;
      const etl = this.etl();
      return this.runConfigStepService.getOutputPathSuggestions(etl, originalTeam).pipe(
        map((res) => ({status: 'loaded' as const, result: res})),
        startWith({status: 'loading' as const, result: []}),
        catchError((err) => of({status: 'error' as const, error: err})),
      );
    },
    {requireSync: true},
  );

  dataRetentionObj: DataRetentionObj;

  OUTPUT_PATH_TOOLTIP = OUTPUT_PATH_TOOLTIP;

  reTriggerJobUserParams: any;

  initialOverrideParams: any;

  constructor() {
    super();
    this.reTriggerJobUserParams = this.jobFormBuilderService.getValue('user_params');
  }

  ngOnInit(): void {
    this.etlState().derivedLogic();
    this._setDeepTeamOptions();
    this._setOutputControls();
    this._registerEvents();
    this.runConfigForm.controls.team.setValue(this._getDefaultTeam());
    this.runConfigForm.controls.tags.setValue(this._getTagsValue());
    this._setDataRetentionObj();
  }

  onCreateDataSourceToggleChanged(change: MatSlideToggleChange): void {
    this.runConfigForm.controls.mergeParsedData.setValue(change.checked);
  }

  onSkipMESTRetryChanged(change: MatSlideToggleChange): void {
    this.runConfigForm.controls.skipMestRetry.setValue(change.checked);
  }

  onForceParsingToggleChanged(change: MatSlideToggleChange): void {
    this.runConfigForm.controls.forceParsing.setValue(change.checked);
  }

  onSuggestionSelected(event: MatChipListboxChange): void {
    if (event.value) {
      this.runConfigForm.controls.outputPath.setValue(event.value);
    }
  }

  onParamsToggleStateChanged(state: any): void {
    const msg = this._generateEtlParamsMsg(state);
    this.etlParamsPanelDescription.set(msg);
  }

  private _onShown(): void {
    if (this.wasShown) {
      this.etlState().derivedLogic();
    }
  }

  private _getTagsValue(): Array<string> {
    return this.jobFormBuilderService.getValue('tags') || [];
  }

  private async _setInitialParamsControlValue(): Promise<void> {
    const services = this.etl().services;
    const value = {
      params: {},
    };
    const defaultEtlServicesValue = {
      params: {},
    };
    const initialDefaultToggleState = {};
    for (const service of Object.values(services)) {
      const type = service.type;

      value.params[type] = {};
      defaultEtlServicesValue.params[type] = {};

      value.params[type].id = service.id;
      defaultEtlServicesValue.params[type].id = service.id;

      value.params[type].configuration = await this._getReTriggerJobParamsByServiceName(service);
      const uploadFiles = await this._extractUploadFiles(
        value.params[type].configuration?.upload_files?.map(
          (item: string | {path: string; type: string}) =>
            typeof item === 'object' ? item.path : item.trim(),
        ),
      );
      defaultEtlServicesValue.params[type].configuration = service.configuration || {};
      initialDefaultToggleState[type] = _isEqual(
        {
          ...(service?.configuration || {}),
          uploadFiles: null,
        },
        {
          ...(value?.params?.[type]?.configuration || {}),
          uploadFiles: null,
        },
      );

      if (uploadFiles) {
        value.params[type].configuration.upload_files = uploadFiles;
        defaultEtlServicesValue.params[type].configuration.upload_files = uploadFiles;
      }
    }
    this.runConfigForm.controls.overrideParams.setValue(value);
    const msg = this._generateEtlParamsMsg(initialDefaultToggleState);
    this.etlParamsPanelDescription.set(msg);
    this.initialOverrideParams = value;
    this.defaultOverrideParams = _cloneDeep(defaultEtlServicesValue);
  }

  private async _extractUploadFiles(
    list: Array<string>,
  ): Promise<Array<{type: string; path: string}>> {
    if (!list?.length) {
      return Promise.resolve(null);
    }
    const filteredList = _filter(list, (item: string) => !!item.trim());
    const result: Array<{type: string; path: string}> = [];
    for (const path of filteredList) {
      if (_isString(path)) {
        let type;
        try {
          const response = await lastValueFrom(this.onPremService.queryFileSystem(path, 'path'));
          if (_isString(response)) {
            type = 'file';
          } else {
            type = response.paths?.[0]?.type || 'file';
          }
          const item = {
            type,
            path,
          };
          result.push(item);
          //eslint-disable-next-line
        } catch (_) {
          result.push({
            type: 'file',
            path,
          });
        }
      }
    }
    return result;
  }

  private _setDeepTeamOptions(): void {
    const teams = this.deepUtilService.getCurrentUserTeams();
    this.deepTeamOptions = teams;
  }

  private _setDataRetentionObj(): void {
    const keys = Object.keys(this.dataRetentionInfoObj || {});
    if (!keys.length) {
      return;
    }
    this.dataRetentionObj = {};
    keys.forEach((key) => {
      const defaultDate = addDaysToDate(dateNow(), this.dataRetentionInfoObj[key].default);
      this.dataRetentionObj[key] = toShortDate(defaultDate);
    });
  }

  private _setOutputControls(): void {
    if (this.enableOutputPath) {
      this.runConfigForm.controls.outputPath.setValidators(
        Validators.compose([
          Validators.required,
          Validators.maxLength(100),
          Validators.pattern(new RegExp('^[a-zA-Z0-9_.]+$', 'i')),
        ]),
      );
    }
  }

  private _registerEvents(): void {
    combineLatest({
      statusChanges: this.runConfigForm.statusChanges,
      manualStatusCheck: this.timerService.interval(1000),
    })
      .pipe(untilDestroyed(this))
      .subscribe(({statusChanges}) => {
        if (statusChanges === 'PENDING' && this.runConfigForm.status !== 'PENDING') {
          this.runConfigForm.updateValueAndValidity();
        }
      });
    this.runConfigForm.statusChanges
      .pipe(
        startWith<FormControlStatus>(this.runConfigForm.status),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe((value: FormControlStatus) => {
        this.formState.emit(value);
      });

    this.runConfigForm.controls.dataRetention.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((dataRetentionValue) => {
        if (!dataRetentionValue) {
          this.dataRetentionPanelDescription.set('');
          return;
        }
        let msg = '';
        const sortedKeys = sortDataRetentionKeys(
          Object.keys(dataRetentionValue) as Array<DataRetentionKnownKeysEnum>,
        );
        for (const key of sortedKeys) {
          const value = dataRetentionValue[key];
          if (!value?.trim()) {
            continue;
          }
          const title = _startCase(key);
          // need to reverse the date, to display correctly in : DD-MM-YYYY format.
          const strValue =
            value === PERMANENT_DATE ? 'permanent' : value.split('-').reverse().join('-');
          msg += `${title} : ${strValue} , `;
        }
        msg = msg.trim();
        if (msg.endsWith(',')) {
          msg = msg.slice(0, -1); // Remove the last character (comma)
        }
        this.dataRetentionPanelDescription.set(msg);
      });

    this.runConfigForm.controls.overrideParams.statusChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((status) => {
        if (!this.expandOverrideParams && status === 'INVALID') {
          this.expandOverrideParams = true;
        }
      });
  }

  private _getDefaultTeam(): string {
    if (!this.deepTeamOptions?.length) {
      return '';
    }
    const reTriggerTeam = this.jobFormBuilderService.getValue('team');
    if (this.deepTeamOptions.includes(reTriggerTeam)) {
      return reTriggerTeam;
    }
    // if the user has only one team, pick it
    if (this.deepTeamOptions.length === 1) {
      return this.deepTeamOptions[0];
    }
    return '';
  }

  // tries to get reTrigger params for each service, if not restore default ETL params.
  private async _getReTriggerJobParamsByServiceName(service: EtlDagService): Promise<any> {
    const name = service.name;
    const id = service.id;
    const type = service.type;
    let params = service.configuration || {};
    if (!this.reTriggerJobUserParams) {
      return params;
    }
    //if this the same service exactly, return it
    if (this.reTriggerJobUserParams?.[id]) {
      return {
        ...this.reTriggerJobUserParams?.[id],
      };
    }
    //case the service is new, search the service name to get correct params
    const reTriggerServices = await this._getReTriggerServices();
    for (const service of reTriggerServices) {
      if (service.name === name && service.type === type) {
        params = {
          ...this.reTriggerJobUserParams[service.id],
        };
        break;
      }
    }

    return params;
  }

  private async _getReTriggerServices(): Promise<Array<EtlDagService>> {
    const requests = [];
    Object.keys(this.reTriggerJobUserParams || {}).forEach((serviceId) => {
      const id = parseInt(serviceId);
      const request = lastValueFrom(
        this.etlService.getService(id, true).pipe(
          //eslint-disable-next-line
          catchError((_) => {
            return of(null);
          }),
        ),
      );
      requests.push(request);
    });
    const services = await Promise.all(requests);
    return services.filter((service) => !!service);
  }

  private _generateEtlParamsMsg(state: any): string {
    const messages = [];
    Object.keys(state || {})
      .sort()
      .forEach((key) => {
        messages.push(`${_startCase(key)} : ${state[key] ? 'Default' : 'Custom'}`);
      });
    return messages.join(' , ');
  }
}
