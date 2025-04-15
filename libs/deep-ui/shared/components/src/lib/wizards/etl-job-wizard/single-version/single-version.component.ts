import {AsyncPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {ValidSelectedMest} from 'deep-ui/shared/components/src/lib/common';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {EtlJobWizardBaseDirective} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {MestsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/mests-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {
  SubmitJobRequest,
  SubmitJobResponse,
  SubmitJobSingleVersionRequest,
} from 'deep-ui/shared/core';
import {EtlJobFlowsEnum, EtlJobRunType} from 'deep-ui/shared/models';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, finalize, first, map} from 'rxjs/operators';

@Component({
  selector: 'de-single-version',
  templateUrl: './single-version.component.html',
  styleUrls: ['./single-version.component.scss'],
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
    MestsStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class SingleVersionComponent extends EtlJobWizardBaseDirective {
  override flowType = input<EtlJobFlowsEnum.SINGLE_VERSION>(EtlJobFlowsEnum.SINGLE_VERSION);

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

  private _generateRequest(
    mest: ValidSelectedMest,
    runType: EtlJobRunType,
    overrides: Partial<SubmitJobRequest> = {},
  ): Observable<SubmitJobResponse> {
    const {
      clipLists,
      tags,
      args,
      mergeParsedData,
      createDatasourceFromParsedData,
      skipMestRetry,
      forceParsing,
      team,
      outputPath,
      dataRetention,
      budgetGroup,
    } = this.getControlsValues(mest);
    const clipList = clipLists[0];
    const finalTags = tags;
    const request: SubmitJobSingleVersionRequest = {
      flowType: this.flowType(),
      dataRetention,
      tags: finalTags,
      team,
      dataset: {
        s3Path: clipList.s3Path,
        clipListId: clipList.id,
        clipsToParamsHashPath: clipList.clipsToParamsHashPath,
      },
      runType,
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
      parsingOnly: true,
      mergeParsedData,
      createDatasourceFromParsedData,
      forceParsing,
      ...(!!budgetGroup && {budgetGroup}),
      ...(!!outputPath && {outputPath}),
      ...overrides,
    };

    return this.launchService.submitJob(request).pipe(
      map((response: SubmitJobResponse) => {
        return {
          ...response,
          mestNickName: request.mest.nickname,
        };
      }),
      catchError((response) => {
        return of({
          error: getErrorHtmlMsgFromResponse(response),
          mestNickName: request.mest.nickname,
        });
      }),
      first(),
    );
  }

  private generateSubmitJobRequests(): Array<Observable<SubmitJobResponse>> {
    const requests: Array<Observable<SubmitJobResponse>> = [];
    const {jobIdParsedData} = this.getControlsValues(null);
    if (jobIdParsedData) {
      return this.generateSubmitJobForRefJobId();
    }
    const mests: Array<ValidSelectedMest> = this.mestsStep?.mestForm.controls.mest?.value || [];
    mests.forEach((mest) => {
      const {probe, parsingConfiguration} = this.getControlsValues(mest);
      const request$ = this._generateRequest(mest, this.runType(), {
        parsingOnly: this.isRunTypeDataCreation(),
        ...(probe && {probe}),
        ...(parsingConfiguration && {parsingConfiguration}),
      });
      requests.push(request$);
    });
    return requests;
  }

  private _sendSubmitJob(): void {
    if (this.isRunTypeCompareVersions()) {
      this._sendCompareVersionsRequest();
    } else {
      this._sendSubmitJobRequests();
    }
  }

  private _sendCompareVersionsRequest(): void {
    const requestBody = this.generateSubmitJobCompareVersionsRequest(
      this.flowType(),
      this.runType(),
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

  private _sendSubmitJobRequests(): void {
    const requests = this.generateSubmitJobRequests();
    this.loadingSubscription.next(true);
    forkJoin(requests)
      .pipe(finalize(() => this.loadingSubscription.next(false)))
      .subscribe((responses: Array<SubmitJobFeedbackItem>) => {
        this.submitJobFeedbackItems = [...responses];
        // go to submit job feedback step
        this.onNextClicked();
      });
  }
}
