import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {EtlJobWizardBaseDirective} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobAVPipeline, SubmitJobRefJobId, SubmitJobResponse} from 'deep-ui/shared/core';
import {ClipListTypeEnum, EtlJobFlowsEnum, EtlTypeEnum} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

@Component({
  selector: 'de-av-pipeline',
  templateUrl: './av-pipeline.component.html',
  styleUrls: ['./av-pipeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    ClipListStepComponent,
    ParsingStepComponent,
    EtlStepComponent,
    RunConfigStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class AvPipelineComponent extends EtlJobWizardBaseDirective {
  override flowType = input<EtlJobFlowsEnum.AV_PIPELINE>(EtlJobFlowsEnum.AV_PIPELINE);

  override initialFiltersValue = {
    type: ClipListTypeEnum.GENERIC,
  };

  EtlTypeEnum = EtlTypeEnum;

  onLastStepClicked(): void {
    //go to loading step
    this.onNextClicked();

    // not all control were update yet... need to send request after last step control were set
    if (!globalThis.jasmine) {
      setTimeout(() => {
        this._sendSubmitJobRequest();
      }, 300);
    } else {
      this._sendSubmitJobRequest();
    }
  }

  private _sendSubmitJobRequest(): void {
    this.loadingSubscription.next(true);
    let submitJobRequest: any;
    const {jobIdParsedData} = this.getControlsValues(null);
    if (jobIdParsedData) {
      submitJobRequest = this._generateSubmitJobForRefJobId();
    } else {
      submitJobRequest = this._generateSubmitJobRequest();
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
        this.loadingSubscription.next(false);

        this.submitJobFeedbackItems = [
          {
            ...response,
          },
        ];
        // go to submit job feedback
        this.onNextClicked();
      });
  }

  private _generateSubmitJobForRefJobId(): SubmitJobRefJobId {
    const {tags, probe, team, outputPath, jobIdParsedData, dataRetention, budgetGroup} =
      this.getControlsValues(null);

    const request: SubmitJobRefJobId = {
      flowType: this.flowType(),
      runType: this.runType(),
      dataRetention,
      outputPath,
      tags,
      team,
      probe,
      jobIdParsedData,
      ...(!!budgetGroup && {budgetGroup}),
    };
    return request;
  }

  private _generateSubmitJobRequest(): SubmitJobAVPipeline {
    const outputPath = this.runConfigStep.runConfigForm.controls.outputPath.value;
    const {
      tags,
      probe,
      team,
      clipLists,
      dataRetention,
      mergeParsedData,
      createDatasourceFromParsedData,
      forceParsing,
      parsingConfiguration,
      budgetGroup,
    } = this.getControlsValues(null);
    const clipList = clipLists[0];

    const request: SubmitJobAVPipeline = {
      flowType: EtlJobFlowsEnum.AV_PIPELINE,
      runType: this.runType(),
      dataRetention,
      tags,
      team,
      mergeParsedData,
      createDatasourceFromParsedData,
      forceParsing,
      parsingOnly: this.isRunTypeDataCreation(),
      dataset: {
        s3Path: clipList.s3Path,
        clipListId: clipList.id,
        clipsToParamsHashPath: clipList.clipsToParamsHashPath,
      },
      ...(!!outputPath && {outputPath}),
      ...(!!budgetGroup && {budgetGroup}),
      ...(probe && {probe}),
      ...(parsingConfiguration && {parsingConfiguration}),
    };
    return request;
  }

  protected override onConfigurationStepLastRequiredTabNextClick(): void {
    this.onLastStepClicked();
  }
}
