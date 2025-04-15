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
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {SubmitJobMetro, SubmitJobResponse} from 'deep-ui/shared/core';
import {ClipListTypeEnum, EtlJobFlowsEnum, EtlTypeEnum} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

@Component({
  selector: 'de-metro',
  templateUrl: './metro.component.html',
  styleUrls: ['./metro.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'w-full h-full',
  },
  imports: [
    MeWizardComponent,
    ClipListStepComponent,
    EtlStepComponent,
    RunConfigStepComponent,
    LoadingStepComponent,
    SubmitJobStepComponent,
    AsyncPipe,
    MeCdkStepComponent,
  ],
})
export class MetroComponent extends EtlJobWizardBaseDirective {
  override flowType = input<EtlJobFlowsEnum.METRO>(EtlJobFlowsEnum.METRO);

  override initialFiltersValue = {
    type: ClipListTypeEnum.GENERIC,
  };

  EtlTypeEnum = EtlTypeEnum;

  onLastStepClicked(): void {
    //go to loading step
    this.onNextClicked();

    // not all control were update yet... need to send request after last step control were set
    setTimeout(() => {
      this.loadingSubscription.next(true);
      const outputPath = this.runConfigStep.runConfigForm.controls.outputPath.value;
      const {tags, probe, team, clipLists, dataRetention, budgetGroup} =
        this.getControlsValues(null);
      const clipList = clipLists[0];
      // go to loading step
      this.onNextClicked();
      const submitJobRequest: SubmitJobMetro = {
        flowType: EtlJobFlowsEnum.METRO,
        ...(budgetGroup?.length && {budgetGroup: budgetGroup}),
        dataRetention,
        outputPath,
        tags,
        team,
        probe,
        dataset: {
          s3Path: clipList.s3Path,
          clipListId: clipList.id,
          clipsToParamsHashPath: clipList.clipsToParamsHashPath,
        },
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
          this.loadingSubscription.next(false);

          this.submitJobFeedbackItems = [
            {
              ...response,
            },
          ];
          // go to submit job feedback
          this.onNextClicked();
        });
    }, 300);
  }

  protected override onConfigurationStepLastRequiredTabNextClick(): void {
    this.onLastStepClicked();
  }
}
