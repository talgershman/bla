import {
  AfterViewInit,
  computed,
  Directive,
  ElementRef,
  inject,
  Input,
  input,
  InputSignal,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {
  MeStepperMenuItem,
  MeStepperMenuStatusEnum,
} from '@mobileye/material/src/lib/components/stepper-menu';
import {secondsToTimeFormatter} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BaseJobService} from 'deep-ui/shared/core';
import {
  ETLJobSnakeCase,
  EtlJobStepEnum,
  JobEntity,
  JobStatusMetadata,
  PerfectTransformJobSnakeCase,
  StepSummary,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators';
import {Observable} from 'rxjs';

import {DownloadClipLogsComponent} from '../../dialogs/download-clip-logs/download-clip-logs.component';
import {DownloadErrorLogsComponent} from '../../dialogs/download-error-logs/download-error-logs.component';

@UntilDestroy()
@Directive()
export abstract class BaseExpandContainerDirective<
    T extends JobEntity,
    U extends BaseJobService & {
      getSingle: (jobUuid: string) => Observable<ETLJobSnakeCase | PerfectTransformJobSnakeCase>;
    },
  >
  implements AfterViewInit, OnDestroy
{
  job = input<T>();
  @Input()
  updateJobAfterRefresh: Observable<[job: T, stepId: string]>;

  protected dialog = inject(MatDialog);

  expandContainer = viewChild('expandContainer', {read: ElementRef<any>});
  menuStepSummaryTmpl = viewChild('menuStepSummaryTmpl', {read: TemplateRef<any>});

  jsonStepDetailsControl = new FormControl<any>(null);
  jsonStepDetailsControlValue: WritableSignal<any> = signal(null);
  jsonStickyMsgControl = new FormControl<any>(null);
  jsonStickyMsgControlValue: WritableSignal<any> = signal(null);

  showMestClipListButton: boolean;
  showMestCloudCmdButton: boolean;
  showProbeErrorLogsButton: boolean;
  showDataPrepButton: boolean;
  showLogicOutputsButton: boolean;
  showClipLogsButton: boolean;
  showParsingErrorButton: boolean;
  showReportClipListButton: boolean;
  showMessagesAnimation: boolean;

  currentJobStepsMenuItems: MeStepperMenuItem[] = [];
  currentStepId: WritableSignal<string> = signal(undefined);
  stepDetailsInfoInnerHtml: WritableSignal<string> = signal('');
  expanded = signal<boolean>(false);
  jobUuid = computed(() => this.job().jobUuid);

  protected abstract getService(): U;
  protected abstract handleMestStep(service: U, metadata: JobStatusMetadata): void;
  protected abstract isUserCodeStep(metadata: JobStatusMetadata): boolean;
  protected abstract handleParsingStep(service: U, metadata: JobStatusMetadata): void;
  protected abstract handleReportStep(job: T, service: U, metadata: JobStatusMetadata): void;

  ngAfterViewInit(): void {
    this._registerEvents();
    this._init();
  }

  ngOnDestroy(): void {
    this.stepDetailsInfoInnerHtml.set('');
    this.expanded.set(false);
    this.setStepDetailsControl(null);
    this.setStickyMsgControl(null);
    this._resetStepButtons();
    this.currentStepId.set(undefined);
  }

  onMenuItemClick(menuItem: MeStepperMenuItem, job: T): void {
    this.setStepDetailsControl(null);
    this.setStickyMsgControl(null);
    setTimeout(() => {
      const stepId = menuItem.id;
      this.currentStepId.set(stepId);
      this.updateStep(job, stepId);
      this.showMessagesAnimation = true;
    });
  }

  @memoize()
  generateJobStepsMenuItems(job: T, menuStepSummaryTmpl: TemplateRef<any>): MeStepperMenuItem[] {
    const results = [];
    const service = this.getService();
    const flowSteps = (service.getFlowSteps as any)(job);
    for (const flowStep of flowSteps) {
      const foundJob = service.findStepInJobStatusMetadata(flowStep, job.jobStatusMetadata);
      const step: MeStepperMenuItem = {
        title: service.convertStepToTitle(flowStep),
        id: flowStep,
        tmpl: menuStepSummaryTmpl,
        tmplContext: this._getStepSummaryContext(flowStep as EtlJobStepEnum, job),
        status: foundJob
          ? (foundJob.state.toString() as MeStepperMenuStatusEnum)
          : MeStepperMenuStatusEnum.NOT_STARTED,
      };
      results.push(step);
    }
    this.currentJobStepsMenuItems = results;
    return results;
  }

  secondsToTimeFormatter(value: any): string {
    return secondsToTimeFormatter(Math.round(value / 1000));
  }

  downloadEtlErrorLogs(): void {
    const dialogRef = this.dialog.open(DownloadErrorLogsComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.jobUuid = this.jobUuid as InputSignal<string>;
    dialogRef.componentInstance.closeDialog.subscribe(() => {
      dialogRef.close();
    });
  }

  openDownloadClipLogsDialog(item: T): void {
    const dialogRef = this.dialog.open(DownloadClipLogsComponent, {
      autoFocus: false,
      restoreFocus: false,
      data: item,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.etlJob = item;
    dialogRef.componentInstance.closeDialog.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  downloadParsingErrorLogs(job: T): void {
    const service = this.getService();
    service.downloadParsingErrorLogs(job.jobUuid);
  }

  protected setStepDetailsControl(obj: any): void {
    this.jsonStepDetailsControl.setValue(obj);
    this.jsonStepDetailsControlValue.set(obj);
  }

  protected setStickyMsgControl(obj: any): void {
    this.jsonStickyMsgControl.setValue(obj);
    this.jsonStickyMsgControlValue.set(obj);
  }

  protected updateStep(job: T, stepId: string): void {
    const service = this.getService();
    const stepMetadata = service.findStepInJobStatusMetadata(stepId, job.jobStatusMetadata);
    this.handleStep(service, stepMetadata, job);
  }

  protected handleStep(service: U, metadata: JobStatusMetadata, job: T): void {
    this.handleStepButtons(job, service, metadata);
    this.handleStepDetails(job, metadata);
  }

  protected handleStepButtons(job: T, service: U, metadata: JobStatusMetadata): void {
    this.handleMestStep(service, metadata);
    this._handleEtlStep(metadata);
    this.handleParsingStep(service, metadata);
    this.handleReportStep(job, service, metadata);
  }

  protected handleStepDetails(job: T, metadata: JobStatusMetadata): void {
    const stepDetailsObj = this._getStepMsgObj(metadata);
    this.stepDetailsInfoInnerHtml.set(this._getStepInfoText(metadata.step));
    this.setStepDetailsControl(stepDetailsObj);
    const stickyMsg = this._getStickyMessage(job, metadata.step);
    this.setStickyMsgControl(stickyMsg);
  }

  private _resetStepButtons(): void {
    this.showProbeErrorLogsButton = false;
    this.showDataPrepButton = false;
    this.showLogicOutputsButton = false;
    this.showClipLogsButton = false;
    this.showParsingErrorButton = false;
  }

  private _getStepSummaryContext(flowStep: EtlJobStepEnum, job: T): StepSummary {
    const metadataStepsSummary = job.metadataStepsSummary;
    return metadataStepsSummary && metadataStepsSummary[flowStep]
      ? metadataStepsSummary[flowStep]
      : undefined;
  }

  private _handleEtlStep(metadata: JobStatusMetadata): void {
    const isEtlStep = this.isUserCodeStep(metadata);
    this.showProbeErrorLogsButton = isEtlStep;
    this.showDataPrepButton = metadata.step === EtlJobStepEnum.PROBE;
    this.showLogicOutputsButton = metadata.step === EtlJobStepEnum.PROBE;
    this.showClipLogsButton = isEtlStep;
  }

  private _getStepMsgObj(stepMetadata: JobStatusMetadata): any {
    let msgObj;
    try {
      msgObj = JSON.parse(stepMetadata?.details);
      //eslint-disable-next-line
    } catch (_) {
      msgObj = null;
    }
    const result = msgObj || {};
    if (Object.keys(result).length) {
      return result;
    }
    return null;
  }

  private _getStepInfoText(stepId: string): string {
    if (stepId === 'REPORT') {
      return `<b>Note</b>\n:
        <ol class='px-6 my-1'>
          <li>ETL-Logic step will not run on a clip which failed in Data-Prep step.</li>
          <li>If a classifier depends on the output of another classifier that does not produce results for a specific clip, then the classifier will not operate on that clip.</li>
        </ol>`;
    }
    return '';
  }

  private _getStickyMessage(job: T, stepId: string): string {
    return job?.metadataStepsSummary?.[stepId]?.stickyInfo;
  }

  private _registerEvents(): void {
    this.updateJobAfterRefresh
      .pipe(untilDestroyed(this))
      .subscribe(([job, stepId]: [job: T, stepId: string]) => {
        this.currentStepId.set(stepId);
        this.updateStep(job, stepId);
      });
  }

  private _init(): void {
    const service = this.getService();
    if (this.job().jobStatusMetadata[0]) {
      let currentStepIndex = this.currentJobStepsMenuItems.findIndex(
        (item: MeStepperMenuItem) => item.id === this.job().jobStatusMetadata[0].step,
      );
      if (currentStepIndex === -1) {
        this.currentJobStepsMenuItems = this.generateJobStepsMenuItems(
          this.job(),
          this.menuStepSummaryTmpl(),
        );
        currentStepIndex = this.currentJobStepsMenuItems.findIndex(
          (item: MeStepperMenuItem) => item.id === this.job().jobStatusMetadata[0].step,
        );
      }
      if (
        currentStepIndex > -1 &&
        this.job().jobStatusMetadata &&
        this.job().jobStatusMetadata.length
      ) {
        const currentStep = this.currentJobStepsMenuItems[currentStepIndex];
        this.currentStepId.set(currentStep.id);
        this.handleStep(service, this.job().jobStatusMetadata[0], this.job());
      }
    }
    const expandedContainer = this.expandContainer();
    setTimeout(() => {
      expandedContainer?.nativeElement?.classList?.add('expanded');
      this.expanded.set(true);
    });
  }
}
