import {CdkStep, StepperSelectionEvent} from '@angular/cdk/stepper';
import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  Signal,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Params} from '@angular/router';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {
  DatasourceService,
  EtlService,
  LaunchService,
  SubmitJobPerfectTransform,
  SubmitJobResponse,
} from 'deep-ui/shared/core';
import {
  DataRetentionConfig,
  Datasource,
  ETL,
  EtlTypeEnum,
  PerfectList,
  PerfectTransformRunType,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import {BehaviorSubject, firstValueFrom, of, Subject} from 'rxjs';
import {catchError, debounceTime, first} from 'rxjs/operators';

import {DatasourceDetailsStepComponent} from './steps/datasource-details-step/datasource-details-step.component';
import {PerfectListStepComponent} from './steps/perfect-list-step/perfect-list-step.component';
import {SelectFlowStepComponent} from './steps/select-flow-step/select-flow-step.component';
import {UpdateMsgStepComponent} from './steps/update-msg-step/update-msg-step.component';

@Component({
  selector: 'de-perfect-transform-wizard',
  templateUrl: './perfect-transform-wizard.component.html',
  styleUrls: ['./perfect-transform-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    SelectFlowStepComponent,
    UpdateMsgStepComponent,
    EtlStepComponent,
    PerfectListStepComponent,
    DatasourceDetailsStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class PerfectTransformWizardComponent implements OnInit, AfterViewInit {
  @ViewChild(MeWizardComponent, {static: false}) wizard: MeWizardComponent;

  @ViewChild(EtlStepComponent) etlStep: EtlStepComponent;

  @ViewChild(PerfectListStepComponent) perfectListStep: PerfectListStepComponent;

  @ViewChild(DatasourceDetailsStepComponent) datasourceDetailsStep: DatasourceDetailsStepComponent;

  @Input()
  disableRefreshInterval: boolean;

  @Output()
  submitJobFired = new EventEmitter<void>();

  public data = inject<{
    dataRetentionInfoObj: DataRetentionConfig;
    showSelectFlowStep: boolean;
    runType: PerfectTransformRunType;
    selectedDatasource: Datasource;
    selectedDatasourceEtl: ETL;
    siblingsDatasources: Array<Datasource>;
    duplicateDatasource: Datasource;
    duplicateDatasourceEtl: ETL;
  }>(MAT_DIALOG_DATA);
  private launchService = inject(LaunchService);
  private etlService = inject(EtlService);
  private datasourceService = inject(DatasourceService);

  currentStep: CdkStep;

  showSelectFlowStep: boolean;

  selectedDatasource: Datasource;

  duplicateDatasource: Datasource;

  siblingsDatasources: Array<Datasource>;

  selectedEtl: ETL;

  initialEtl: ETL;

  duplicateDatasourceEtl: ETL;

  dataRetentionInfoObj: DataRetentionConfig;

  loadingSubscription = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  submitJobFeedbackLabel = '';

  submitJobFeedbackItems: Array<SubmitJobFeedbackItem> = [];

  EtlTypeEnum = EtlTypeEnum;

  etlStepNextDisabled = true;

  perfectListStepNextDisabled = true;

  selectFlowStepNextDisabled = true;

  detailsStepNextDisabled = true;

  submitJobDisablePrevButton = true;

  triggerDataSourceFormValidation = new Subject<void>();

  triggerDataSourceFormValidation$ = this.triggerDataSourceFormValidation.asObservable();

  runType: WritableSignal<PerfectTransformRunType> = signal<PerfectTransformRunType>(null);

  isEditFlow: Signal<boolean> = computed(() => this.runType() === 'UPDATE');

  readonly etlStepTableComponentId: string = this.getStepTableComponentId('de-etl-step');

  readonly parsingListStepTableComponentId: string =
    this.getStepTableComponentId('de-perfect-list-step');

  perfectListInitialTableFilters: Signal<Params> = computed(() => {
    const params = {status: 'active'};
    if (this.runType() === 'UPDATE') {
      return {
        ...params,
        technology: this.selectedDatasource.technology,
      };
    }
    return params;
  });

  constructor() {
    const data = this.data;

    this.showSelectFlowStep = data.showSelectFlowStep;
    this.runType.set(data.runType);
    this.selectedDatasource = data.selectedDatasource;
    this.siblingsDatasources = data.siblingsDatasources;
    this.initialEtl = data.selectedDatasourceEtl;
    this.selectedEtl = data.selectedDatasourceEtl;
    this.duplicateDatasource = data.duplicateDatasource;
    this.duplicateDatasourceEtl = data.duplicateDatasourceEtl;
    this.dataRetentionInfoObj = data.dataRetentionInfoObj;
  }

  ngOnInit(): void {
    if (this.siblingsDatasources?.length) {
      this.selectedEtl = this.initialEtl;
    }
  }

  ngAfterViewInit(): void {
    this.currentStep = this.wizard.selectedStep;
    (this.currentStep as MeCdkStepComponent & Pick<BaseStepDirective, 'wasShown'>).wasShown = true;
  }

  onStepSelectionChanged(selection: StepperSelectionEvent) {
    this.currentStep = selection.selectedStep;
  }

  // eslint-disable-next-line
  @memoize()
  getStepTableComponentId(componentName: string): string {
    return `perfect_transform_${componentName}`;
  }

  onFormStateChanged(formState: string, nextPropKey: any): void {
    this[nextPropKey] = formState !== 'VALID';
  }

  onEtlChanged(etl: ETL): void {
    this.selectedEtl = etl;
  }

  onNextClicked(): void {
    this.wizard.next();
    (this.currentStep as MeCdkStepComponent & Pick<BaseStepDirective, 'wasShown'>).wasShown = true;
  }

  onPrevClicked(): void {
    (this.currentStep as MeCdkStepComponent & Pick<BaseStepDirective, 'wasShown'>).wasShown = false;
    this.wizard.previous();
  }

  onLastStepClicked(): void {
    this.loadingSubscription.next(true);
    // go to loading step
    this.onNextClicked();
    // delay to generate request with the right data
    setTimeout(() => {
      this._generateRequest();
    }, 300);
  }

  onSubmitJobStepPrevClicked(): void {
    // skip to loading step
    this.onPrevClicked();
    // skip to last step before loading
    this.onPrevClicked();
  }

  onEtlStepNextClicked(): void {
    this.onNextClicked();
  }

  async onSelectFlowNextClicked(): Promise<void> {
    if (this.selectedDatasource) {
      this.initialEtl = await this._getSelectedDatasourceEtl(this.selectedDatasource.etlId);
      this.siblingsDatasources = await this.datasourceService.getSiblingDatasources(
        this.selectedDatasource,
      );
      this.selectedEtl = this.initialEtl;
      this.runType.set('UPDATE');
    } else {
      this.initialEtl = null;
      this.siblingsDatasources = [];
      this.selectedEtl = null;
      this.runType.set('CREATE');
    }
    this.onNextClicked();
  }

  async onDataSourceChanged(datasource: Datasource): Promise<void> {
    this.selectedDatasource = datasource;
  }

  private _getFirstPerfectList(): PerfectList {
    let firstPerfectList: PerfectList;
    const effectedPerfectListIds = this.perfectListStep.getEffectedPerfectListIds();
    const perfectListData = this.perfectListStep.getEffectedSyncLists();
    for (const perfectList of perfectListData) {
      if (effectedPerfectListIds.includes(perfectList.id)) {
        firstPerfectList = perfectList;
        break;
      }
    }
    return firstPerfectList;
  }

  private _generateRequest(): void {
    const perfectListIds = this.perfectListStep.getEffectedPerfectListIds();
    const technology = this._getFirstPerfectList()?.technology;
    const etl = this.etlStep?.etlListForm.controls.etl?.value;
    const params = this.datasourceDetailsStep.dataSourceDetailsForm.controls.overrideParams?.value;
    const budgetGroup =
      this.datasourceDetailsStep.dataSourceDetailsForm.controls.budgetGroup?.value;

    let submitJobRequest: SubmitJobPerfectTransform = {
      flowType: 'PERFECT_TRANSFORM',
      runType: this.runType(),
      ...(!!budgetGroup && {budgetGroup}),
      probeId: etl.id,
      name: this.datasourceDetailsStep.dataSourceDetailsForm.controls.name.value,
      dataSourceId: this.selectedDatasource?.id,
      ...params,
      rawDataOwner: this.datasourceDetailsStep.dataSourceDetailsForm.controls.rawDataOwner.value,
      team: this.datasourceDetailsStep.dataSourceDetailsForm.controls.team.value
        ? this.datasourceDetailsStep.dataSourceDetailsForm.controls.team?.value
        : this.selectedDatasource?.team,
      tags: this.datasourceDetailsStep.dataSourceDetailsForm.controls.tags.value,
      description: this.datasourceDetailsStep.dataSourceDetailsForm.controls.description.value,
      dataRetention:
        this.datasourceDetailsStep.dataSourceDetailsForm.controls.dataRetention?.value ?? null,
      technology,
      perfectListIds,
    };

    submitJobRequest = this._clearPropsFromSubmitRequest(submitJobRequest);

    this.launchService
      .submitJob(submitJobRequest)
      .pipe(
        first(),
        catchError((response: HttpErrorResponse) =>
          of({
            error: getErrorHtmlMsgFromResponse(response),
          }),
        ),
      )
      .subscribe((response: SubmitJobResponse) => {
        this.loadingSubscription.next(false);
        if (!response.error) {
          this.submitJobFired.next();
        }
        this.submitJobFeedbackItems = [
          {
            ...response,
          },
        ];
        // go to submit job feedback
        this.onNextClicked();
      });
  }

  private _clearPropsFromSubmitRequest(
    submitJobRequest: SubmitJobPerfectTransform,
  ): SubmitJobPerfectTransform {
    const request = {
      ...submitJobRequest,
    };
    if (this.isEditFlow()) {
      delete request.name;
      delete request.rawDataOwner;
      delete request.technology;
      delete request.team;
    } else {
      delete request.dataSourceId;
    }

    if (!request.tags?.length) {
      delete request.tags;
    }
    if (!request.description) {
      delete request.description;
    }
    return request;
  }

  private async _getSelectedDatasourceEtl(etlId: number): Promise<ETL> {
    return firstValueFrom(this.etlService.getSingle(etlId));
  }
}
