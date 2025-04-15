import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';

@Component({
  selector: 'de-loading-step',
  templateUrl: './loading-step.component.html',
  styleUrls: ['./loading-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
})
export class LoadingStepComponent extends BaseStepDirective {
  @Input()
  isLoading: boolean;

  @Input()
  LoadingMessage: string;

  @Input()
  diameter = 40;
}
