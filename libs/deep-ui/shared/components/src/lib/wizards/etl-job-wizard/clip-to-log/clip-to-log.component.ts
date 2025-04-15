import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, input, ViewChild} from '@angular/core';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {EtlJobWizardBaseDirective} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {ClipToLogLogsFilterStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-to-log-logs-filter-step';
import {ClipToLogOutputsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-to-log-outputs-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {
  LogsDirFilterType,
  SubmitJobClip2LogRequest,
  SubmitJobCompareVersionsClipToLogJob,
  SubmitJobCompareVersionsClipToLogRequest,
  SubmitJobResponse,
} from 'deep-ui/shared/core';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';
import {of, Subject} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

@Component({
  selector: 'de-clip-to-log',
  templateUrl: './clip-to-log.component.html',
  styleUrls: ['./clip-to-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    ClipToLogLogsFilterStepComponent,
    ClipToLogOutputsStepComponent,
    ParsingStepComponent,
    EtlStepComponent,
    RunConfigStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class ClipToLogComponent extends EtlJobWizardBaseDirective {
  @ViewChild(ClipToLogLogsFilterStepComponent)
  filterStep: ClipToLogLogsFilterStepComponent;

  @ViewChild(ClipToLogOutputsStepComponent)
  outputsStep: ClipToLogOutputsStepComponent;

  override flowType = input<EtlJobFlowsEnum.CLIP_2_LOG>(EtlJobFlowsEnum.CLIP_2_LOG);

  selectedFile: any;

  selectedClipListId: number;

  filterType: LogsDirFilterType = LogsDirFilterType.NO_FILTER;

  // eslint-disable-next-line
  clip2LogOutputsValidateStep = new Subject<void>();

  clip2LogOutputsValidateStep$ = this.clip2LogOutputsValidateStep.asObservable();

  onLastStepClicked(): void {
    // go to loading step
    this.onNextClicked();
    if (!globalThis.jasmine) {
      setTimeout(() => {
        if (this.isRunTypeCompareVersions()) {
          this._sendCompareVersionsRequest();
        } else {
          this._sendSubmitJobRequest();
        }
      }, 300);
    } else {
      if (this.isRunTypeCompareVersions()) {
        this._sendCompareVersionsRequest();
      } else {
        this._sendSubmitJobRequest();
      }
    }
  }

  onSelectOutputDirNextClicked(): void {
    this.clip2LogOutputsValidateStep.next();
  }

  onFileChanged(file: any): void {
    this.selectedFile = file;
  }

  onFileTypeChanged(type: LogsDirFilterType): void {
    this.filterType = type;
  }

  onClipListIdChanged(clipListId: number): void {
    this.selectedClipListId = clipListId;
  }

  protected override onConfigurationStepLastRequiredTabNextClick(): void {
    this.onLastStepClicked();
  }

  private _sendCompareVersionsRequest(): void {
    const {
      mainS3Path,
      mainItrksDir,
      mainMetadata,
      dependentS3Path,
      dependentItrksDir,
      dependentMetadata,
    } = this.outputsStep.form.controls.selectOutputDirs.value;
    const {tags, probe, team, outputPath, dataRetention, forceParsing, budgetGroup} =
      this.getControlsValues(null);
    const submitJobRequest: SubmitJobCompareVersionsClipToLogRequest = {
      ...(budgetGroup?.length && {budgetGroup: budgetGroup}),
      flowType: this.flowType(),
      runType: this.runType(),
      common: {
        outputPath,
        probe,
      },
      mainJob: {
        dataRetention,
        clip2log: {
          itrksDir: mainItrksDir,
        },
        dataset: {
          s3Path: mainS3Path,
        },
        metadata: mainMetadata,
        forceParsing,
      },
      dependantJobs: [
        {
          dataRetention,
          clip2log: {
            itrksDir: dependentItrksDir,
          },
          dataset: {
            s3Path: dependentS3Path,
          },
          metadata: dependentMetadata,
          forceParsing,
        },
      ],
      tags,
      team,
    };

    if (!submitJobRequest.mainJob.metadata) {
      delete submitJobRequest.mainJob.metadata;
    }

    submitJobRequest.dependantJobs.forEach(
      (dependantJobData: SubmitJobCompareVersionsClipToLogJob) => {
        if (!dependantJobData.metadata) {
          delete dependantJobData.metadata;
        }
      },
    );

    this.loadingSubscription.next(true);
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

      .subscribe((responses: Array<SubmitJobFeedbackItem>) => {
        this.loadingSubscription.next(false);

        this.submitJobFeedbackItems = [...responses];
        // go to submit job feedback
        this.onNextClicked();
      });
  }

  private _sendSubmitJobRequest(): void {
    this.loadingSubscription.next(true);
    const {
      tags,
      probe,
      parsingConfiguration,
      team,
      outputPath,
      jobIdParsedData,
      dataRetention,
      forceParsing,
      budgetGroup,
    } = this.getControlsValues(null);
    if (jobIdParsedData) {
      this.generateSubmitJobForRefJobId()[0].subscribe((response: SubmitJobResponse) =>
        this._handleSubmitJobResponse(response),
      );
      return;
    }
    // eslint-disable-next-line
    const {mainS3Path, mainItrksDir, mainMetadata} =
      // eslint-disable-next-line
      this.outputsStep?.form?.controls?.selectOutputDirs?.value;
    const submitJobRequest: SubmitJobClip2LogRequest = {
      flowType: this.flowType(),
      runType: this.runType(),
      forceParsing,
      dataRetention,
      tags,
      team,
      parsingOnly: this.isRunTypeDataCreation(),
      clip2log: {
        itrksDir: mainItrksDir || '',
      },
      dataset: {
        s3Path: mainS3Path || '',
      },
      ...(!!budgetGroup && {budgetGroup}),
      ...(!!outputPath && {outputPath}),
      ...(probe && {probe}),
      ...(parsingConfiguration && {parsingConfiguration}),
      ...(mainMetadata && {metadata: mainMetadata}),
    };

    if (submitJobRequest.clip2log?.itrksDir === '') {
      delete submitJobRequest.clip2log;
    }
    if (submitJobRequest.dataset?.s3Path === '') {
      delete submitJobRequest.dataset;
    }

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
        this._handleSubmitJobResponse(response);
      });
  }

  private _handleSubmitJobResponse(response: SubmitJobResponse): void {
    this.loadingSubscription.next(false);

    this.submitJobFeedbackItems = [
      {
        ...response,
      },
    ];
    // go to submit job feedback
    this.onNextClicked();
  }
}
