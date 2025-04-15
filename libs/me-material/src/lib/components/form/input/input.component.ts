import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewChild,
} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeDisableControlDirective} from '@mobileye/material/src/lib/directives/disable-control';
import {NgxMaskDirective} from 'ngx-mask';

@Component({
  selector: 'me-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  imports: [
    HintIconComponent,
    MatFormFieldModule,
    MatInputModule,
    NgxMaskDirective,
    ReactiveFormsModule,
    MeDisableControlDirective,
    MatIconModule,
  ],
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: MeInputComponent}],
})
export class MeInputComponent extends MeBaseFormFieldControlDirective<string> {
  @ViewChild('areaInput') areaInput: ElementRef;

  @Input()
  type: string;

  @Input()
  isTouched: boolean;

  @Input()
  min: number;

  @Input()
  max: number;

  @Input()
  disableCondition: boolean;

  @Input()
  pattern: string;

  @Input()
  step: string;

  @Input()
  thousandSeparator: string;

  @Input()
  mask: string;

  @Input()
  allowNegativeNumbers = true;

  @HostBinding('style.--width')
  @Input()
  width: string;

  controlType = 'me-input';
  id = `me-input-${MeInputComponent.nextId++}`;

  getFocusHTMLElement(): HTMLElement {
    return this.areaInput.nativeElement;
  }
}
