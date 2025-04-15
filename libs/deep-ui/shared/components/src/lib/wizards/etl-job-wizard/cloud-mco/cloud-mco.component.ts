import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {CloudMcoCmdStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/cloud-mco/cloud-mco-cmd-step';
import {EtlJobWizardBaseDirective} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {
  LaunchService,
  SubmitJobCloudMco,
  SubmitJobCompareVersionsCloudMcoRequest,
  SubmitJobResponse,
} from 'deep-ui/shared/core';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

@Component({
  selector: 'de-cloud-mco',
  templateUrl: './cloud-mco.component.html',
  styleUrls: ['./cloud-mco.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    CloudMcoCmdStepComponent,
    ParsingStepComponent,
    EtlStepComponent,
    RunConfigStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class CloudMcoComponent extends EtlJobWizardBaseDirective {
  cloudMcoCmdStep = viewChild(CloudMcoCmdStepComponent);
  override flowType = input<EtlJobFlowsEnum.CLOUD_MCO>(EtlJobFlowsEnum.CLOUD_MCO);

  protected launchService = inject(LaunchService);

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

  protected override onConfigurationStepLastRequiredTabNextClick(): void {
    this.onLastStepClicked();
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
      mergeParsedData,
      createDatasourceFromParsedData,
    } = this.getControlsValues(null);
    if (jobIdParsedData) {
      this.generateSubmitJobForRefJobId()[0].subscribe((response: SubmitJobResponse) =>
        this._handleSubmitJobResponse(response),
      );
      return;
    }
    const mcoCmd = this.cloudMcoCmdStep()?.form?.controls?.mainCmd?.value;
    const submitJobRequest: SubmitJobCloudMco = {
      flowType: this.flowType(),
      runType: this.runType(),
      cloudMco: {
        command: mcoCmd,
      },
      forceParsing,
      mergeParsedData,
      createDatasourceFromParsedData,
      dataRetention,
      tags,
      team,
      ...(!!budgetGroup && {budgetGroup}),
      ...(!!outputPath && {outputPath}),
      ...(probe && {probe}),
      ...(parsingConfiguration && {parsingConfiguration}),
      parsingOnly: this.isRunTypeDataCreation(),
    };

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

  private _sendCompareVersionsRequest(): void {
    const {mainCmd, dependentCmd} = this.cloudMcoCmdStep()?.form?.value as any;
    const {
      tags,
      probe,
      team,
      outputPath,
      dataRetention,
      forceParsing,
      budgetGroup,
      mergeParsedData,
      createDatasourceFromParsedData,
    } = this.getControlsValues(null);
    const submitJobRequest: SubmitJobCompareVersionsCloudMcoRequest = {
      ...(budgetGroup?.length && {budgetGroup: budgetGroup}),
      flowType: this.flowType(),
      runType: this.runType(),
      common: {
        outputPath,
        probe,
      },
      mainJob: {
        dataRetention,
        cloudMco: {
          command: mainCmd,
        },
        mergeParsedData,
        createDatasourceFromParsedData,
        forceParsing,
      },
      dependantJobs: [
        {
          dataRetention,
          cloudMco: {
            command: dependentCmd,
          },
          mergeParsedData,
          createDatasourceFromParsedData,
          forceParsing,
        },
      ],
      tags,
      team,
    };

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
}
