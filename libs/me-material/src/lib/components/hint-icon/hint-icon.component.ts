import {ChangeDetectionStrategy, Component, Input, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {Placement} from 'tippy.js';

@Component({
  selector: 'me-hint-icon',
  templateUrl: './hint-icon.component.html',
  styleUrls: ['./hint-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MeTooltipDirective],
  host: {
    '[class.large-icon]': 'size() === "large"',
    '[class.small-icon]': 'size() === "small"',
  },
})
export class HintIconComponent {
  @Input()
  tooltip: string;

  @Input()
  tooltipPosition: Placement = 'right';

  @Input()
  meTooltipClass = 'no-truncate-tooltip';

  size = input<string>('small');
}
