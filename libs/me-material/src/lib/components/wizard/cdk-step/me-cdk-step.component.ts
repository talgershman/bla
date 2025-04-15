import {CdkStep} from '@angular/cdk/stepper';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'me-cdk-step',
  template: '<ng-template><ng-content></ng-content></ng-template>',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeCdkStepComponent extends CdkStep {
  @Input()
  hideWizardButtons: boolean;

  @Input()
  hideCloseButton: boolean;

  @Input()
  hint: boolean;

  @Input()
  hideNext: boolean;

  @Input()
  hidePrev: boolean;

  @Input()
  isNextDisabled: boolean;

  @Input()
  isPrevDisabled: boolean;

  @Input()
  nextLabel = 'Next';

  @Input()
  prevLabel = 'Back';

  @Output()
  prevClicked = new EventEmitter();

  @Output()
  nextClicked = new EventEmitter();

  isPassed: boolean;
}
