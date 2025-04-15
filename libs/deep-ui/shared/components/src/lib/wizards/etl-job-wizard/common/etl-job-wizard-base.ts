import {CdkStep, StepperSelectionEvent} from '@angular/cdk/stepper';
import {
  ChangeDetectorRef,
  computed,
  Directive,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
  Signal,
  ViewChild,
} from '@angular/core';
import {FormControlStatus} from '@angular/forms';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse, removeSpaces} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Subset, ValidSelectedMest} from 'deep-ui/shared/components/src/lib/common';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {DatasourcesStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/datasources-step';
import {MestsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/mests-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {
  JobFormBuilderService,
  LaunchService,
  SubmitJobCompareVersionJob,
  SubmitJobCompareVersionJobWithDataset,
  SubmitJobCompareVersionsRequest,
  SubmitJobCompareVersionsRequestCommon,
  SubmitJobCompareVersionsRequestTypes,
  SubmitJobCompareVersionsWithMultiClipListsRequest,
  SubmitJobEtlParams,
  SubmitJobRefJobId,
  SubmitJobResponse,
} from 'deep-ui/shared/core';
import {
  DataRetentionConfig,
  DataRetentionKnownKeysEnum,
  ETL,
  EtlJobFlowsEnum,
  EtlJobRunType,
  FLOW_TYPES_WITH_CLIP_LIST_STEP,
  ParsingConfiguration,
} from 'deep-ui/shared/models';
import _merge from 'lodash-es/merge';
import _some from 'lodash-es/some';
import {BehaviorSubject, Observable, of, Subject, timer} from 'rxjs';
import {catchError, debounceTime, first, map} from 'rxjs/operators';

@UntilDestroy()
@Directive()
export abstract class EtlJobWizardBaseDirective implements OnInit {
  @ViewChild(MeWizardComponent, {static: false})
  flowWizard: MeWizardComponent;

  @ViewChild(RunConfigStepComponent) runConfigStep: RunConfigStepComponent;

  @ViewChild(DatasourcesStepComponent) datasourcesStep: DatasourcesStepComponent;

  @ViewChild(EtlStepComponent) etlStep: EtlStepComponent;

  @ViewChild(ParsingStepComponent) parsingStep: ParsingStepComponent;

  @ViewChild(ClipListStepComponent) clipListStep: ClipListStepComponent;

  @ViewChild(MestsStepComponent) mestsStep: MestsStepComponent;

  @Input()
  refJobId: string;

  runType = input<EtlJobRunType>();

  flowType = input<EtlJobFlowsEnum>();

  @Input()
  budgetGroup: string;

  @Input()
  dataRetentionInfoObj: DataRetentionConfig;

  @Output()
  backToMainFlowClicked = new EventEmitter();

  @Output()
  triggerNewJob = new EventEmitter<void>();

  protected cd = inject(ChangeDetectorRef);
  protected launchService = inject(LaunchService);
  protected jobFormBuilderService = inject(JobFormBuilderService);

  currentStep: CdkStep;

  submitJobFeedbackItems: Array<SubmitJobFeedbackItem> = [];

  baseViewState = computed(() => {
    return {
      flowType: this.flowType(),
      runType: this.runType(),
      derivedLogic: computed(() => {
        if (this.flowType() && this.runType() && !this.currentStep) {
          timer(0)
            .pipe(untilDestroyed(this))
            .subscribe(() => {
              this._initCurrentStep();
            });
        }
        return null;
      }),
    };
  });

  clipListStepTableComponentId: Signal<string> = computed(() =>
    this.getStepTableComponentId(this.flowType(), this.runType(), 'de-clip-list-step'),
  );

  parsingStepTableComponentId: Signal<string> = computed(() =>
    this.getStepTableComponentId(this.flowType(), this.runType(), 'de-parsing-step'),
  );

  etlStepTableComponentId: Signal<string> = computed(() =>
    this.getStepTableComponentId(this.flowType(), this.runType(), 'de-etl-step'),
  );

  mestsStepTableComponentId: Signal<string> = computed(() =>
    this.getStepTableComponentId(this.flowType(), this.runType(), 'de-mests-step'),
  );

  isRunTypeDataCreation: Signal<boolean> = computed(
    () => this.runType() === EtlJobRunType.DATA_CREATION,
  );

  isRunTypeFullRun: Signal<boolean> = computed(() => this.runType() === EtlJobRunType.FULL_RUN);

  isRunTypeCompareVersions: Signal<boolean> = computed(
    () => this.runType() === EtlJobRunType.COMPARE_VERSIONS,
  );

  isMultiSelection: Signal<boolean> = computed(
    () => this.runType() === EtlJobRunType.COMPARE_VERSIONS,
  );

  overriddenDisplayColumnsForMestStep: Signal<Array<string>> = computed(() => {
    if (this.runType() === EtlJobRunType.COMPARE_VERSIONS) {
      const arr = ['nickname', 'createdBy', 'createdAt', 'rootPath', 'isMain', 'isValid'];
      if (FLOW_TYPES_WITH_CLIP_LIST_STEP.includes(this.flowType())) {
        return [...arr, 'clipList'];
      }
      return arr;
    }
    return [];
  });

  overriddenDisplayColumnsForClipListStep: Signal<Array<string>> = computed(() => {
    if (this.runType() === EtlJobRunType.COMPARE_VERSIONS) {
      return ['name', 'createdBy', 'type', 'createdAt', 'count', 'tags'];
    }
    return [];
  });

  requiredSelection: Signal<number> = computed(() => {
    if (this.runType() === EtlJobRunType.COMPARE_VERSIONS) {
      return 2;
    }
    return 0;
  });

  runConfigStepNextDisabled = true;

  etlStepNextDisabled = true;

  parsingStepNextDisabled = true;

  clipListStepNextDisabled = true;

  clip2LogOutputsStepNextDisabled = true;

  mestsStepNextDisabled = true;

  logFileStepNextDisabled = true;

  selectFilterLogFileStepNextDisabled = true;

  cloudMcoCmdStepNextDisabled = true;

  showMestForm = false;

  returnToSelectMestClicked = new Subject<void>();

  returnToSelectMestClicked$ = this.returnToSelectMestClicked.asObservable();

  submitOverrideMestForm = new Subject<void>();

  submitOverrideMestForm$ = this.submitOverrideMestForm.asObservable();

  submitJobDisablePrevButton: boolean;

  loadingSubscription = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  submitJobFeedbackLabel = '';

  initialFiltersValue: any;

  selectedEtl: ETL;

  selectedParsing: ParsingConfiguration;

  mestStepLabel: string;

  clipListStepLabel: string;

  nextButtonLabel = 'Next';

  ngOnInit(): void {
    this._filterDataRetentionKeysByFlow(this.dataRetentionInfoObj, this.flowType());
  }

  onNextClicked(): void {
    this.flowWizard.next();
    (this.currentStep as MeCdkStepComponent & Pick<BaseStepDirective, 'wasShown'>).wasShown = true;
  }

  onConfigurationStepNextClick(refJobId: string): void {
    if (refJobId) {
      this.onConfigurationStepLastRequiredTabNextClick();
      return;
    } else if (this.nextButtonLabel === 'Finish') {
      this.onConfigurationStepLastRequiredTabNextClick();
    } else {
      this.onNextClicked();
    }
  }

  onPrevClicked(): void {
    if (this.flowWizard.selectedIndex === 0) {
      this.backToMainFlowClicked.emit();
    } else {
      (this.currentStep as MeCdkStepComponent & Pick<BaseStepDirective, 'wasShown'>).wasShown =
        false;
      this.flowWizard.previous();
    }
  }

  onSubmitJobStepPrevClicked(): void {
    // go back submit job feedback
    this.onPrevClicked();
    // go back loading step
    this.onPrevClicked();
  }

  getStepTableComponentId(
    flowType: EtlJobFlowsEnum,
    runType: EtlJobRunType,
    componentName: string,
  ): string {
    return `${flowType}_${runType}_${componentName}`;
  }

  onMestStepPrevClicked(): void {
    if (this.showMestForm) {
      this.returnToSelectMestClicked.next();
    } else {
      // go to prev step
      this.onPrevClicked();
    }
  }

  onFormStateChanged(formState: FormControlStatus, nextPropKey: any): void {
    const initValue = this[nextPropKey];
    this[nextPropKey] = formState !== 'VALID';
    if (initValue !== this[nextPropKey]) {
      this.cd.detectChanges();
    }
  }

  onShowMestFormChanged(isShown: boolean): void {
    this.showMestForm = isShown;
  }

  setMestStepLabel(runType: EtlJobRunType, customValue: string): void {
    let nextValue = 'Select MEST';
    if (customValue) {
      nextValue = customValue;
    } else if (runType === EtlJobRunType.COMPARE_VERSIONS) {
      nextValue = 'Select the main MEST version and a compare version';
    }
    this.mestStepLabel = nextValue;
  }

  setClipListStepLabel(runType: EtlJobRunType, customValue: string): void {
    let nextValue = 'Select a Clip List';
    if (customValue) {
      nextValue = customValue;
    } else if (runType === EtlJobRunType.COMPARE_VERSIONS) {
      nextValue = 'Select single / multiple clip lists';
    }
    this.clipListStepLabel = nextValue;
  }

  onStepSelectionChanged(selection: StepperSelectionEvent, runType: EtlJobRunType): void {
    this.currentStep = selection.selectedStep;
    this._setStepsLabels(runType);
    (selection.selectedStep as MeCdkStepComponent).isPassed = true;
    // the last two steps is always loading + feedback + 1 because index start from 0
    this.nextButtonLabel =
      this.flowWizard.getNumberOfSteps() === selection.selectedIndex + 3 ? 'Finish' : 'Next';
  }

  onEtlChanged(etl: ETL): void {
    this.selectedEtl = etl;
  }

  onParsingChanged(parsing: ParsingConfiguration): void {
    this.selectedParsing = parsing;
  }

  getEtlParams(): SubmitJobEtlParams {
    if (!this.runConfigStep) {
      return undefined;
    }
    return this.runConfigStep.runConfigForm.controls.overrideParams?.value || {};
  }

  getControlsValues(mest: ValidSelectedMest): any {
    const jobIdParsedData = this.refJobId;
    const budgetGroup = this.budgetGroup;
    const clipLists = this.clipListStep?.clipListForm.controls.clipLists?.value;
    const fpaPerfects = this.datasourcesStep?.dataSourcesForm.controls.fpaPerfects?.value
      ? this.datasourcesStep?.dataSourcesForm.controls.fpaPerfects?.value
      : undefined;
    const dataSourceUrls = this._getDataSourceUrls();
    const mergeParsedData =
      this.runConfigStep?.runConfigForm.controls.mergeParsedData?.value ?? false;
    const createDatasourceFromParsedData =
      this.runConfigStep?.runConfigForm.controls.createDatasourceFromParsedData?.value ?? false;
    const skipMestRetry = this.runConfigStep?.runConfigForm.controls.skipMestRetry?.value ?? false;
    const forceParsing = this.runConfigStep?.runConfigForm.controls.forceParsing?.value ?? false;
    const tags = this.runConfigStep?.runConfigForm.controls.tags?.value || [];
    const team = this.runConfigStep?.runConfigForm.controls.team?.value;
    const dataRetention = this.runConfigStep?.runConfigForm.controls.dataRetention?.value ?? null;
    const outputPath = this.runConfigStep?.runConfigForm.controls.outputPath?.value;
    const etlStep = this.etlStep?.etlListForm?.controls.etl?.value;
    const mainMEST = this.mestsStep?.mestForm.controls.mainVersion?.value;
    let probe;
    let parsingId;
    if (etlStep?.id) {
      parsingId = etlStep.parsingConfiguration;
      probe = {
        id: etlStep.id,
        ...this.getEtlParams(),
      };
    }
    const parsingStep = this.parsingStep?.parsingConfigurationControl?.value;
    let parsingConfiguration;
    if (parsingStep?.id) {
      parsingId = parsingStep.id;
      parsingConfiguration = {
        id: parsingStep.id,
      };
    }
    let args;
    if (mest) {
      args = removeSpaces(mest.args);
    }
    let isMainMEST;
    if (mainMEST && mest) {
      isMainMEST = mainMEST.id === mest.id;
    }

    return {
      clipLists,
      fpaPerfects,
      dataSourceUrls,
      mergeParsedData,
      createDatasourceFromParsedData,
      skipMestRetry,
      forceParsing,
      tags,
      probe,
      parsingConfiguration,
      args,
      parsingId,
      team,
      isMainMEST,
      outputPath,
      jobIdParsedData,
      dataRetention,
      budgetGroup,
    };
  }

  sendSubmitJobCompareVersionRequest(
    launchService: LaunchService,
    request: SubmitJobCompareVersionsRequestTypes,
  ): Observable<SubmitJobResponse | Array<SubmitJobResponse>> {
    this.loadingSubscription.next(true);
    return launchService.submitJob(request);
  }

  generateSubmitJobCompareVersionsRequest(
    flowType: string,
    runType: EtlJobRunType,
    overrides: Subset<SubmitJobCompareVersionsRequest> = {},
  ): SubmitJobCompareVersionsRequestTypes {
    let request: SubmitJobCompareVersionsRequestTypes;
    if (this._areClipListsInCommonObject()) {
      request = this._generateRequestCompareVersionsRegularFlow(flowType, runType);
    } else {
      request = this._generateRequestCompareVersionsWithMultiClipLists(flowType, runType);
    }
    return _merge(request, overrides) as SubmitJobCompareVersionsRequestTypes;
  }

  generateSubmitJobForRefJobId(): Array<Observable<SubmitJobResponse>> {
    const {
      fpaPerfects,
      dataSourceUrls,
      tags,
      probe,
      team,
      outputPath,
      jobIdParsedData,
      dataRetention,
      budgetGroup,
    } = this.getControlsValues(null);

    const request: SubmitJobRefJobId = {
      ...(budgetGroup?.length && {budgetGroup: budgetGroup}),
      flowType: this.flowType(),
      runType: this.runType(),
      dataRetention,
      outputPath,
      tags,
      team,
      probe,
      jobIdParsedData,
      perfects: {
        fpaPerfects,
        dataSourceUrls,
      },
    };
    if (!fpaPerfects && !dataSourceUrls?.length) {
      delete request.perfects;
    } else if (!request.perfects?.fpaPerfects) {
      delete request.perfects.fpaPerfects;
    } else if (!request.perfects?.dataSourceUrls?.length) {
      delete request.perfects.dataSourceUrls;
    }
    const request$ = this.launchService.submitJob(request).pipe(
      catchError((response) => {
        return of({
          error: getErrorHtmlMsgFromResponse(response),
        });
      }),
      map((response: SubmitJobResponse) => {
        return {
          ...response,
        };
      }),
      first(),
    );
    return [request$];
  }

  protected onConfigurationStepLastRequiredTabNextClick(): void {}

  private _initCurrentStep(): void {
    this.currentStep = this.flowWizard.selectedStep;
    this._initStepsLabelsValues();
    (this.currentStep as MeCdkStepComponent & Pick<BaseStepDirective, 'wasShown'>).wasShown = true;
  }

  private _getDataSourceUrls(): Array<string> | undefined {
    const dataSourcesControlValues =
      this.datasourcesStep?.dataSourcesForm.controls.dataSources?.value;
    if (!dataSourcesControlValues) {
      return undefined;
    }
    const arr = [];
    for (const dsSelection of dataSourcesControlValues) {
      //case latest version
      if (!dsSelection.version) {
        const dataSource = dsSelection.dataSource;
        arr.push(dataSource.datasourceVirtualUrl);
      } else {
        const versionDataSource = dsSelection.version;
        arr.push(versionDataSource.datasourceVirtualUrl);
      }
    }
    return arr;
  }

  private _areClipListsInCommonObject(): boolean {
    const mests: Array<ValidSelectedMest> = this.mestsStep.mestForm.controls.mest.value || [];
    if (!mests?.length) {
      return true;
    }
    const clipList = mests[0].clipList;
    if (!clipList) {
      return true;
    }
    //are all clip list the same
    return !_some(mests, (mest: ValidSelectedMest) => mest.clipList !== clipList);
  }

  private _setStepsLabels(runType: EtlJobRunType): void {
    const selectedStep = this.currentStep;
    if (selectedStep.ariaLabel === 'mest-step') {
      this.setMestStepLabel(runType, null);
    } else if (selectedStep.ariaLabel === 'clip-list-step') {
      this.setClipListStepLabel(runType, null);
    }
  }

  private _initStepsLabelsValues(): void {
    this._setStepsLabels(this.runType());
  }

  private _addJobsToRequests(
    request: Partial<SubmitJobCompareVersionsWithMultiClipListsRequest>,
  ): SubmitJobCompareVersionsWithMultiClipListsRequest {
    const mests: Array<ValidSelectedMest> = this.mestsStep.mestForm.controls.mest.value || [];
    request.dependantJobs = [];
    mests.forEach((mest) => {
      const {
        args,
        isMainMEST,
        tags,
        mergeParsedData,
        createDatasourceFromParsedData,
        skipMestRetry,
        dataRetention,
        forceParsing,
      } = this.getControlsValues(mest);
      const jobObj: SubmitJobCompareVersionJobWithDataset = {
        tags,
        mergeParsedData,
        createDatasourceFromParsedData,
        dataRetention,
        forceParsing,
        dataset: {
          s3Path: mest.clipList.s3Path,
          clipListId: mest.clipList.id,
          clipsToParamsHashPath: mest.clipList.clipsToParamsHashPath,
        },
        mest: {
          id: mest.id,
          rootPath: mest.rootPath,
          isOverride: mest.isOverride,
          brainLib: mest.brainLib,
          params: mest.params,
          ...(mest.mestOutputsNickname && {mestOutputsNickname: mest.mestOutputsNickname}),
          ...(mest.mestSyncLocalDirectory && {mestSyncLocalDirectory: mest.mestSyncLocalDirectory}),
          nickname: mest.nickname,
          executable: mest.executable,
          lib: mest.lib,
          skipMestRetry,
          args,
        },
      };
      if (isMainMEST) {
        request.mainJob = jobObj;
      } else {
        request.dependantJobs.push(jobObj);
      }
    });
    return request as SubmitJobCompareVersionsWithMultiClipListsRequest;
  }

  private _addJobsToRequestsRegularFlow(
    request: Partial<SubmitJobCompareVersionsRequest>,
  ): SubmitJobCompareVersionsRequest {
    const mests: Array<ValidSelectedMest> = this.mestsStep.mestForm.controls.mest.value || [];
    request.dependantJobs = [];
    mests.forEach((mest) => {
      const {
        args,
        isMainMEST,
        tags,
        mergeParsedData,
        createDatasourceFromParsedData,
        skipMestRetry,
        dataRetention,
        forceParsing,
      } = this.getControlsValues(mest);
      const jobObj: SubmitJobCompareVersionJob = {
        tags,
        mergeParsedData,
        createDatasourceFromParsedData,
        dataRetention,
        forceParsing,
        mest: {
          id: mest.id,
          rootPath: mest.rootPath,
          isOverride: mest.isOverride,
          brainLib: mest.brainLib,
          params: mest.params,
          nickname: mest.nickname,
          ...(mest.mestOutputsNickname && {mestOutputsNickname: mest.mestOutputsNickname}),
          ...(mest.mestSyncLocalDirectory && {mestSyncLocalDirectory: mest.mestSyncLocalDirectory}),
          executable: mest.executable,
          lib: mest.lib,
          skipMestRetry,
          args,
        },
      };
      if (isMainMEST) {
        request.mainJob = jobObj;
      } else {
        request.dependantJobs.push(jobObj);
      }
    });
    return request as SubmitJobCompareVersionsRequest;
  }

  private _generateRequestCompareVersionsWithMultiClipLists(
    flowType: string,
    runType: EtlJobRunType,
  ): SubmitJobCompareVersionsWithMultiClipListsRequest {
    let request = this._generateRequestCommonFields(flowType, runType);
    request = this._addJobsToRequests(request);
    return request as SubmitJobCompareVersionsWithMultiClipListsRequest;
  }

  private _generateRequestCompareVersionsRegularFlow(
    flowType: string,
    runType: EtlJobRunType,
  ): SubmitJobCompareVersionsRequest {
    const {clipLists} = this.getControlsValues(null);
    const clipList = clipLists?.length ? clipLists[0] : null;
    let request;
    if (clipList) {
      const datasetObj: Partial<SubmitJobCompareVersionsRequestCommon> = {
        dataset: {
          s3Path: clipList.s3Path,
          clipListId: clipList.id,
          clipsToParamsHashPath: clipList.clipsToParamsHashPath,
        },
      };
      request = this._generateRequestCommonFields(flowType, runType, {common: datasetObj});
    } else {
      request = this._generateRequestCommonFields(flowType, runType);
    }
    request = this._addJobsToRequestsRegularFlow(request);
    return request as SubmitJobCompareVersionsRequest;
  }

  private _generateRequestCommonFields(
    flowType: string,
    runType: EtlJobRunType,
    overrides: any = {},
  ): any {
    const {probe, team, fpaPerfects, dataSourceUrls, outputPath, budgetGroup} =
      this.getControlsValues(null);
    const request: Partial<SubmitJobCompareVersionsWithMultiClipListsRequest> = {
      flowType,
      runType,
      budgetGroup,
      team,
      perfects: {
        fpaPerfects,
        dataSourceUrls,
      },
      common: {
        probe,
        outputPath,
      },
    };
    if (!request.perfects?.fpaPerfects && !request.perfects?.dataSourceUrls?.length) {
      delete request.perfects;
    } else if (!request.perfects?.fpaPerfects) {
      delete request.perfects.fpaPerfects;
    } else if (!request.perfects?.dataSourceUrls?.length) {
      delete request.perfects.dataSourceUrls;
    }
    return _merge(request, overrides);
  }

  private _filterDataRetentionKeysByFlow(
    dataRetentionInfoObj: DataRetentionConfig,
    flowType: EtlJobFlowsEnum,
  ): DataRetentionConfig {
    const copyInfo = {
      ...dataRetentionInfoObj,
    };
    if (!copyInfo) {
      return copyInfo;
    }
    if (this.refJobId) {
      delete copyInfo[DataRetentionKnownKeysEnum.PARSED_DATA];
    }
    switch (flowType) {
      case EtlJobFlowsEnum.CLIP_2_LOG:
      case EtlJobFlowsEnum.VERSION_PERFECT:
      case EtlJobFlowsEnum.SINGLE_VERSION:
      case EtlJobFlowsEnum.CLOUD_MCO:
      case EtlJobFlowsEnum.PC_RUN: {
        break;
      }
      case EtlJobFlowsEnum.AV_PIPELINE:
      case EtlJobFlowsEnum.METRO: {
        delete copyInfo[DataRetentionKnownKeysEnum.MEST_OUTPUTS];
        delete copyInfo[DataRetentionKnownKeysEnum.PARSED_DATA];
        break;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck: never = flowType;
        throw new Error(`Unhandled filterDataRetentionKeysByFlow case: ${exhaustiveCheck}`);
      }
    }
    this.dataRetentionInfoObj = copyInfo;
    return null;
  }
}
