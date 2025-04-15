import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {getErrorHtmlMsgFromResponse} from '@mobileye/material/src/lib/utils';
import {ValidSelectedMest} from 'deep-ui/shared/components/src/lib/common';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {EtlJobWizardBaseDirective} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/common';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {DatasourcesStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/datasources-step';
import {MestsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/mests-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobFeedbackItem} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import {SubmitJobResponse, SubmitJobVersionPerfect} from 'deep-ui/shared/core';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, finalize, first, map} from 'rxjs/operators';

@Component({
  selector: 'de-version-perfect',
  templateUrl: './version-perfect.component.html',
  styleUrls: ['./version-perfect.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    ClipListStepComponent,
    ParsingStepComponent,
    EtlStepComponent,
    DatasourcesStepComponent,
    RunConfigStepComponent,
    MestsStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class VersionPerfectComponent extends EtlJobWizardBaseDirective {
  override flowType = input<EtlJobFlowsEnum.VERSION_PERFECT>(EtlJobFlowsEnum.VERSION_PERFECT);

  runDatasourcesStepNextDisabled: boolean;

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

  onSubmitJobStepPrevClicked(): void {
    // skip loading step
    this.onPrevClicked();
    // go to mest step
    this.onPrevClicked();
  }

  protected override onConfigurationStepLastRequiredTabNextClick(): void {
    this.onLastStepClicked();
  }

  private _generateSubmitJobRequests(): Array<Observable<SubmitJobResponse>> {
    const requests: Array<Observable<SubmitJobResponse>> = [];
    const {jobIdParsedData} = this.getControlsValues(null);
    if (jobIdParsedData) {
      return this.generateSubmitJobForRefJobId();
    }
    const mests: Array<ValidSelectedMest> = this.mestsStep?.mestForm.controls.mest?.value || [];
    mests.forEach((mest) => {
      const {
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
        team,
        outputPath,
        dataRetention,
        budgetGroup,
      } = this.getControlsValues(mest);
      const clipList = clipLists[0];
      const request: SubmitJobVersionPerfect = {
        flowType: this.flowType(),
        runType: this.runType(),
        dataRetention,
        tags,
        team,
        dataset: {
          // s3Path:   's3://deep.launch-service.temp-clip-list.dev/temp.txt', // for testing
          s3Path: clipList.s3Path,
          clipListId: clipList.id,
          clipsToParamsHashPath: clipList.clipsToParamsHashPath,
        },
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
        parsingOnly: this.isRunTypeDataCreation(),
        perfects: {
          fpaPerfects,
          dataSourceUrls,
        },
        mergeParsedData,
        createDatasourceFromParsedData,
        forceParsing,
        ...(!!outputPath && {outputPath}),
        ...(!!budgetGroup && {budgetGroup}),
        ...(probe && {probe}),
        ...(parsingConfiguration && {parsingConfiguration}),
      };

      if (!request.perfects?.fpaPerfects && !request.perfects?.dataSourceUrls?.length) {
        delete request.perfects;
      } else if (!request.perfects.fpaPerfects) {
        delete request.perfects.fpaPerfects;
      } else if (!request.perfects.dataSourceUrls?.length) {
        delete request.perfects.dataSourceUrls;
      }

      const request$ = this.launchService.submitJob(request).pipe(
        catchError((response: HttpErrorResponse) => {
          return of({
            error: getErrorHtmlMsgFromResponse(response, false),
          });
        }),
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
      requests.push(request$);
    });
    return requests;
  }

  private _sendSubmitJob(): void {
    if (this.isRunTypeCompareVersions()) {
      this._sendCompareVersionsRequest();
    } else {
      this.sendSubmitJobRequests();
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

  private sendSubmitJobRequests(): void {
    const requests = this._generateSubmitJobRequests();
    this.loadingSubscription.next(true);
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
}
