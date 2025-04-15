import {AsyncPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input, signal, ViewChild} from '@angular/core';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {Subset, ValidSelectedMest} from 'deep-ui/shared/components/src/lib/common';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {EtlJobWizardBaseDirective} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {LogFileStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/log-file-step';
import {MestsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/mests-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {
  SubmitJobCompareVersionsRequest,
  SubmitJobPcRunRequest,
  SubmitJobResponse,
} from 'deep-ui/shared/core';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';
import {forkJoin, Observable, of, Subject} from 'rxjs';
import {catchError, finalize, first, map} from 'rxjs/operators';

@Component({
  selector: 'de-pc-run',
  templateUrl: './pc-run.component.html',
  styleUrls: ['./pc-run.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    LogFileStepComponent,
    ParsingStepComponent,
    EtlStepComponent,
    RunConfigStepComponent,
    MestsStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class PCRunComponent extends EtlJobWizardBaseDirective {
  @ViewChild(LogFileStepComponent) logFileStep: LogFileStepComponent;
  logFileFormFile = signal<{
    s3Path: string;
    clipsToParamsHashPath: string;
  }>(null);

  override flowType = input<EtlJobFlowsEnum.PC_RUN>(EtlJobFlowsEnum.PC_RUN);

  override mestStepLabel = 'Select MEST';

  logFileStepNextClicked = new Subject<void>();

  logFileStepNextClicked$ = this.logFileStepNextClicked.asObservable();

  onMestStepNextClicked(): void {
    if (this.showMestForm) {
      this.submitOverrideMestForm.next();
    } else {
      this.returnToSelectMestClicked.next();
      this.onLastStepClicked();
    }
  }

  onLastStepClicked(): void {
    // show loading step
    this.onNextClicked();

    if (!globalThis.jasmine) {
      setTimeout(() => {
        this._sendSubmitJob();
      }, 300);
    } else {
      this._sendSubmitJob();
    }
  }

  protected override onConfigurationStepLastRequiredTabNextClick(): void {
    this.onLastStepClicked();
  }

  private generateSubmitJobRequests(): Array<Observable<SubmitJobResponse>> {
    const requests: Array<Observable<SubmitJobResponse>> = [];
    const mests: Array<ValidSelectedMest> = this.mestsStep.mestForm.controls.mest.value || [];
    mests.forEach((mest) => {
      this._generateSubmitJobRequest(mest, requests);
    });
    return requests;
  }

  private _generateSubmitJobRequest(
    mest: ValidSelectedMest,
    requests: Array<Observable<SubmitJobResponse>>,
  ): void {
    let request;
    const {jobIdParsedData} = this.getControlsValues(null);
    if (jobIdParsedData) {
      request = this.generateSubmitJobForRefJobId();
    } else {
      request = this._buildSubmitJobRequestObject(mest);
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
          mestNickName: request.mest?.nickname,
        };
      }),
      first(),
    );
    requests.push(request$);
  }

  private _buildSubmitJobRequestObject(mest: ValidSelectedMest): SubmitJobPcRunRequest {
    const {
      tags,
      probe,
      parsingConfiguration,
      args,
      mergeParsedData,
      createDatasourceFromParsedData,
      forceParsing,
      team,
      outputPath,
      dataRetention,
      skipMestRetry,
      budgetGroup,
    } = this.getControlsValues(mest);
    const fileControl = this.logFileFormFile();
    const s3Path = fileControl?.s3Path;
    const clipsToParamsHashPath = fileControl?.clipsToParamsHashPath;

    const request: SubmitJobPcRunRequest = {
      flowType: this.flowType(),
      runType: this.runType(),
      dataRetention,
      team,
      tags,
      dataset: {
        s3Path,
        clipsToParamsHashPath,
      },
      parsingOnly: this.isRunTypeDataCreation(),
      mergeParsedData,
      createDatasourceFromParsedData,
      forceParsing,
      ...(!!budgetGroup && {budgetGroup}),
      ...(!!outputPath && {outputPath}),
      ...(probe && {probe}),
      ...(parsingConfiguration && {parsingConfiguration}),
    };
    if (mest) {
      request.mest = {
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
      };
    }

    if (!request.dataset?.clipListId) {
      delete request.dataset?.clipListId;
    }
    if (!request.dataset?.s3Path) {
      delete request.dataset;
    }
    return request;
  }

  private sendSubmitJobRequests(): void {
    this.loadingSubscription.next(true);
    let requests;
    const {jobIdParsedData} = this.getControlsValues(null);
    if (jobIdParsedData) {
      requests = this.generateSubmitJobForRefJobId();
    } else {
      requests = this.generateSubmitJobRequests();
    }
    forkJoin(requests)
      .pipe(finalize(() => this.loadingSubscription.next(false)))
      .subscribe((responses: Array<SubmitJobFeedbackItem>) => {
        this.submitJobFeedbackItems = [];
        responses.forEach((response: SubmitJobFeedbackItem) => {
          this.submitJobFeedbackItems.push({
            ...response,
          });
        });
        // go to submit job feedback step
        this.onNextClicked();
      });
  }

  private _sendSubmitJob(): void {
    if (this.isRunTypeCompareVersions()) {
      this._sendCompareVersionsRequest();
    } else {
      this.sendSubmitJobRequests();
    }
  }

  private _sendCompareVersionsRequest(): void {
    const fileControl = this.logFileFormFile();
    const overrides: Subset<SubmitJobCompareVersionsRequest> = {
      common: {
        dataset: {
          s3Path: fileControl?.s3Path,
          clipsToParamsHashPath: fileControl?.clipsToParamsHashPath,
        },
      },
    };
    const requestBody = this.generateSubmitJobCompareVersionsRequest(
      this.flowType(),
      this.runType(),
      overrides,
    );

    const request$ = this.sendSubmitJobCompareVersionRequest(this.launchService, requestBody);
    request$
      .pipe(
        catchError((response) => {
          return of({
            error: getErrorHtmlMsgFromResponse(response),
          });
        }),
        finalize(() => this.loadingSubscription.next(false)),
      )
      .subscribe((response: SubmitJobFeedbackItem) => {
        this.submitJobFeedbackItems = [response];
        // go to submit job feedback step
        this.onNextClicked();
      });
  }
}
