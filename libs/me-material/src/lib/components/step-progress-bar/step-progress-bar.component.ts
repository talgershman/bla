import {NgClass} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {MeStepDef, MeStepProgressEnum} from './step-progerss-bar-entities';

@Component({
  selector: 'me-step-progress-bar',
  templateUrl: './step-progress-bar.component.html',
  styleUrls: ['./step-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class MeStepProgressBarComponent {
  steps = input<MeStepDef[]>([]);

  MeStepProgressEnum = MeStepProgressEnum;
}
