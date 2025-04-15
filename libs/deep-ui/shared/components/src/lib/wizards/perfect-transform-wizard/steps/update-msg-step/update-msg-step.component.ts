import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {BaseStepDirective} from 'deep-ui/shared/components/src/lib/wizards/common-steps';
import {Datasource} from 'deep-ui/shared/models';

@Component({
  selector: 'de-update-msg-step',
  templateUrl: './update-msg-step.component.html',
  styleUrls: ['./update-msg-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateMsgStepComponent extends BaseStepDirective {
  @Input()
  siblingDatasources: Array<Datasource>;

  @Input()
  mainDatasource: Datasource;
}
