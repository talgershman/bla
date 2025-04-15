import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Output,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {
  SubmitJobFeedbackComponent,
  SubmitJobFeedbackItem,
} from 'deep-ui/shared/components/src/lib/wizards/submit-job-feedback';
import _some from 'lodash-es/some';

@Component({
  selector: 'de-submit-job-step',
  templateUrl: './submit-job-step.component.html',
  styleUrls: ['./submit-job-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SubmitJobFeedbackComponent, MatButtonModule],
})
export class SubmitJobStepComponent extends BaseStepDirective {
  items = input<Array<SubmitJobFeedbackItem>>();

  @Output()
  stepLabelChange = new EventEmitter<string>();

  @Output()
  disablePrevButton = new EventEmitter<boolean>();

  @Output()
  triggerNewJob = new EventEmitter<void>();

  public dialog = inject(MatDialog);

  isPrevButtonEnabled = false;

  shouldShowStep = false;

  viewState = computed(() => {
    return {
      items: this.items(),
      derivedLogic: computed(() => {
        if (this.items()) {
          this._onItemsChanged(this.items());
        }
        return null;
      }),
    };
  });

  private _onItemsChanged(items: Array<SubmitJobFeedbackItem>): void {
    if (!items.length) {
      return;
    }
    this.isPrevButtonEnabled = _some(items, (item: SubmitJobFeedbackItem) => {
      return item.error;
    });
    this.disablePrevButton.emit(!this.isPrevButtonEnabled);
    this.shouldShowStep = _some(items, (item: SubmitJobFeedbackItem) => {
      return !item.isCreated || item.error;
    });
    if (!this.shouldShowStep) {
      this.triggerNewJob.emit();
      this.stepLabelChange.emit('');
      setTimeout(() => {
        this.dialog.closeAll();
      });
    } else {
      this.stepLabelChange.emit('Submit Job Feedback');
    }
  }
}
