import {NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {RouterLink} from '@angular/router';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';

export interface SubmitJobFeedbackItem {
  mestNickName?: string;
  isCreated?: boolean;
  jobUuid?: string;
  error?: string;
  version?: string;
}

@Component({
  selector: 'de-submit-job-feedback',
  templateUrl: './submit-job-feedback.component.html',
  styleUrls: ['./submit-job-feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, NgTemplateOutlet, RouterLink, MeErrorFeedbackComponent],
})
export class SubmitJobFeedbackComponent {
  jobExistsTmpl = viewChild('jobExistsTmpl', {read: TemplateRef<any>});

  successTmpl = viewChild('successTmpl', {read: TemplateRef<any>});

  errorTmpl = viewChild('errorTmpl', {read: TemplateRef<any>});

  items = input<Array<SubmitJobFeedbackItem>>([]);

  @Output()
  triggerNewJob = new EventEmitter<void>();

  private dialog = inject(MatDialog);

  DataSourceDynamicViewEnum = DataSourceDynamicViewEnum;

  private _oneJobTriggered = false;

  viewItems = computed(() => {
    const items = this.items();
    return items.map((item: SubmitJobFeedbackItem) => {
      let template = this.successTmpl();
      if (item.error) {
        template = this.errorTmpl();
        return {
          ...item,
          template,
        };
      }
      if (!item.isCreated) {
        template = this.jobExistsTmpl();
        return {
          ...item,
          template,
        };
      }
      if (!this._oneJobTriggered) {
        this._oneJobTriggered = true;
        // at least one job was created
        this.triggerNewJob.emit();
      }
      return {
        ...item,
        template,
      };
    });
  });

  closeDialog(): void {
    this.dialog.closeAll();
  }

  castToSubmitJobFeedbackItem(value: any): SubmitJobFeedbackItem {
    return value as SubmitJobFeedbackItem;
  }
}
