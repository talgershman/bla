import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, Input, TemplateRef} from '@angular/core';

@Component({
  selector: 'me-dialog-container',
  templateUrl: './dialog-container.component.html',
  styleUrls: ['./dialog-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
})
export class MeDialogContainerComponent {
  @Input()
  headerTmpl: TemplateRef<any>;

  @Input()
  contentTmpl: TemplateRef<any>;
}
