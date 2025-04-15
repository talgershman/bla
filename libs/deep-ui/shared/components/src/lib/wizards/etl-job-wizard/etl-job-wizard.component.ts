import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatRadioChange} from '@angular/material/radio';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeWizardButtonsComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BUDGET_GROUP_TOOLTIP_MSG} from 'deep-ui/shared/common';
import {BudgetGroupControl} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {SelectFlowComponent} from 'deep-ui/shared/components/src/lib/selection/select-flow';
import {CloudMcoComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/cloud-mco';
import {DataRetentionService, JobFormBuilderService} from 'deep-ui/shared/core';
import {
  DataRetentionConfig,
  EtlJob,
  EtlJobFlowsEnum,
  EtlJobRunType,
  getEtlJobRunTypeOption,
  isRefJobIdByRunTypeEnabled,
  RE_TRIGGER_INVALID_RUN_TYPES,
} from 'deep-ui/shared/models';
import {throttle} from 'lodash-decorators/throttle';
import _camelCase from 'lodash-es/camelCase';
import _startCase from 'lodash-es/startCase';
import {BehaviorSubject} from 'rxjs';
import {first} from 'rxjs/operators';

import {AvPipelineComponent} from './av-pipeline/av-pipeline.component';
import {ClipToLogComponent} from './clip-to-log/clip-to-log.component';
import {MetroComponent} from './metro/metro.component';
import {PCRunComponent} from './pc-run/pc-run.component';
import {SingleVersionComponent} from './single-version/single-version.component';
import {VersionPerfectComponent} from './version-perfect/version-perfect.component';

@UntilDestroy()
@Component({
  selector: 'de-etl-job-wizard',
  templateUrl: './etl-job-wizard.component.html',
  styleUrls: ['./etl-job-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [MeFadeInOutAnimation],
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    SelectFlowComponent,
    MeSelectComponent,
    HintIconComponent,
    MeInputComponent,
    ReactiveFormsModule,
    AsyncPipe,
    BudgetGroupControl,
    MeWizardButtonsComponent,
  ],
})
export class EtlJobWizardComponent implements OnInit, OnDestroy {
  @ViewChild('selectedWizardContainer', {
    static: false,
    read: ViewContainerRef,
  })
  selectedWizardContainer: ViewContainerRef;

  @Output()
  triggerNewJob = new EventEmitter<void>();

  private dataRetentionService = inject(DataRetentionService);
  data = inject<{
    mainJob: EtlJob;
    depJobs: Array<EtlJob>;
  }>(MAT_DIALOG_DATA);
  private jobFormBuilderService = inject(JobFormBuilderService);
  private fb = inject(FormBuilder);

  etlJobWizardForm: FormGroup<{
    flowType: FormControl<EtlJobFlowsEnum>;
    runType: FormControl<EtlJobRunType>;
    jobIdParsedDataControl: FormControl<string>;
    budgetGroup: FormControl<string>;
  }>;

  showJobIdParsedData: boolean;

  reTriggerFlow: boolean;

  dataRetentionInfoObj: DataRetentionConfig;

  runTypeOptions: Array<MeSelectOption>;

  readonly BUDGET_GROUP_TOOLTIP_MSG = BUDGET_GROUP_TOOLTIP_MSG;

  private showSelectFlowView = new BehaviorSubject<boolean>(true);

  // eslint-disable-next-line
  showSelectFlowView$ = this.showSelectFlowView.asObservable();

  private formInitialValue: any;

  constructor() {
    this.jobFormBuilderService.setJobsLookup(this.data.mainJob, this.data.depJobs);
    this.reTriggerFlow = !!this.data.mainJob;
    const runTypeValue = this.jobFormBuilderService.getValue('run_type') || EtlJobRunType.FULL_RUN;
    this.etlJobWizardForm = this.fb.group({
      flowType: this.jobFormBuilderService.createNewFormControl<EtlJobFlowsEnum>(
        EtlJobFlowsEnum.VERSION_PERFECT,
        'job_type',
        null,
        {validators: [Validators.required]},
      ),
      runType: new FormControl<EtlJobRunType>(runTypeValue, {validators: [Validators.required]}),
      jobIdParsedDataControl: this.jobFormBuilderService.createNewFormControl<string>(
        null,
        'metadata.job_id_parsed_data',
        null,
        {validators: [MeFormValidations.isValidUuid()]},
      ),
      budgetGroup: this.jobFormBuilderService.createNewFormControl<string>(
        null,
        'metadata.budget_group',
        null,
      ),
    });
    this.formInitialValue = this.etlJobWizardForm.getRawValue();
  }

  ngOnInit(): void {
    this._setRunTypeOptions(this.etlJobWizardForm.controls.flowType.value);
    this.onRunTypeChanged();
  }

  ngOnDestroy(): void {
    this.jobFormBuilderService.resetAll();
  }

  @throttle(500)
  async onFlowNext(): Promise<void> {
    const flowType = this.etlJobWizardForm.controls.flowType.value;
    this.selectedWizardContainer.clear();
    let compRef;
    switch (flowType) {
      case EtlJobFlowsEnum.CLIP_2_LOG: {
        compRef = await this._loadClipToLogComponent();
        this.dataRetentionInfoObj = this.dataRetentionService.getClip2LogDataRetentionConfig();
        break;
      }
      case EtlJobFlowsEnum.VERSION_PERFECT: {
        compRef = await this._loadVersionPerfectComponent();
        this.dataRetentionInfoObj =
          this.dataRetentionService.getVersionPerfectDataRetentionConfig();
        break;
      }
      case EtlJobFlowsEnum.SINGLE_VERSION: {
        compRef = await this._loadSingleVersionComponent();
        this.dataRetentionInfoObj = this.dataRetentionService.getSingleVersionDataRetentionConfig();
        break;
      }
      case EtlJobFlowsEnum.PC_RUN: {
        compRef = await this._loadPCRunComponent();
        this.dataRetentionInfoObj = this.dataRetentionService.getPCRunDataRetentionConfig();
        break;
      }
      case EtlJobFlowsEnum.METRO: {
        compRef = await this._loadMetroComponent();
        this.dataRetentionInfoObj = this.dataRetentionService.getMetroDataRetentionConfig();
        break;
      }
      case EtlJobFlowsEnum.AV_PIPELINE: {
        compRef = await this._loadAvPipelineComponent();
        this.dataRetentionInfoObj = this.dataRetentionService.getAVPipelineDataRetentionConfig();
        break;
      }
      case EtlJobFlowsEnum.CLOUD_MCO:
        compRef = await this._loadCloudMcoComponent();
        this.dataRetentionInfoObj = this.dataRetentionService.getCloudMcoDataRetentionConfig();
        break;
      default:
        // eslint-disable-next-line
        const exhaustiveCheck = flowType;
        throw new Error(`Unhandled onFlowNext case: ${exhaustiveCheck}`);
    }
    compRef.setInput('runType', this.etlJobWizardForm.controls.runType.value);
    compRef.instance.refJobId = this.etlJobWizardForm.controls.jobIdParsedDataControl.value;
    compRef.instance.budgetGroup = this.etlJobWizardForm.controls.budgetGroup.value;
    compRef.instance.dataRetentionInfoObj = this.dataRetentionInfoObj;
    compRef.instance.triggerNewJob.pipe(first()).subscribe(() => this.triggerNewJob.next());
    compRef.instance.backToMainFlowClicked
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onBackToMainFlowClicked());

    this.showSelectFlowView.next(false);
  }

  onBackToMainFlowClicked(): void {
    this.selectedWizardContainer.clear();
    this._restoreControlsToDefaultValues();
    this.showSelectFlowView.next(true);
  }

  onFlowChanged(flow: Partial<MatRadioChange>): void {
    this.etlJobWizardForm.controls.flowType.setValue(flow.value.id);
    this._setRunTypeOptions(this.etlJobWizardForm.controls.flowType.value);
    if (this.runTypeOptions?.length) {
      this.etlJobWizardForm.controls.runType.setValue(this.runTypeOptions[0].id as EtlJobRunType);
    }
    this.onRunTypeChanged();
  }

  onRunTypeChanged(): void {
    this.showJobIdParsedData = isRefJobIdByRunTypeEnabled(
      this.etlJobWizardForm.controls.flowType.value,
      this.etlJobWizardForm.controls.runType.value,
    );
    if (!this.showJobIdParsedData) {
      this.etlJobWizardForm.controls.jobIdParsedDataControl.setValue(null);
      this.etlJobWizardForm.controls.jobIdParsedDataControl.removeValidators(
        MeFormValidations.isValidUuid(),
      );
    }
  }

  private _restoreControlsToDefaultValues(): void {
    this.etlJobWizardForm.patchValue(this.formInitialValue);
    this._setRunTypeOptions(this.etlJobWizardForm.controls.flowType.value);
  }

  private _setRunTypeOptions(flow: EtlJobFlowsEnum): void {
    const options = getEtlJobRunTypeOption(flow);
    let disabledRunTypes = [];
    if (this.reTriggerFlow) {
      disabledRunTypes = [...RE_TRIGGER_INVALID_RUN_TYPES];
    }

    if (options) {
      this.runTypeOptions = options.map((runType: string) => {
        return {
          id: runType,
          value: _startCase(_camelCase(runType)),
          isDisabled: disabledRunTypes.includes(runType),
        } as MeSelectOption;
      });
    } else {
      this.runTypeOptions = null;
    }
  }

  private async _loadClipToLogComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<ClipToLogComponent>(ClipToLogComponent);
  }

  private async _loadAvPipelineComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<AvPipelineComponent>(AvPipelineComponent);
  }

  private async _loadCloudMcoComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<CloudMcoComponent>(CloudMcoComponent);
  }

  private async _loadVersionPerfectComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<VersionPerfectComponent>(
      VersionPerfectComponent,
    );
  }

  private async _loadSingleVersionComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<SingleVersionComponent>(
      SingleVersionComponent,
    );
  }

  private async _loadPCRunComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<PCRunComponent>(PCRunComponent);
  }

  private async _loadMetroComponent(): Promise<ComponentRef<any>> {
    this.selectedWizardContainer.clear();
    return this.selectedWizardContainer.createComponent<MetroComponent>(MetroComponent);
  }
}
