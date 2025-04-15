import {TextFieldModule} from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewChild,
} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {debounce} from 'lodash-decorators/debounce';

@Component({
  selector: 'me-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  imports: [
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    FormsModule,
    ReactiveFormsModule,
    HintIconComponent,
    MatIconModule,
  ],
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: MeTextareaComponent}],
})
export class MeTextareaComponent extends MeBaseFormFieldControlDirective<string> {
  @ViewChild('areaInput', {static: true}) areaInput: ElementRef;

  @Input()
  cdkAutosizeMinRows = 3;

  @Input()
  cdkAutosizeMaxRows = 5;

  @HostBinding('style.--width')
  @Input()
  width: string;

  controlType = 'me-textarea';
  id = `me-textarea-${MeTextareaComponent.nextId++}`;

  getFocusHTMLElement(): HTMLElement {
    return this.areaInput.nativeElement;
  }

  @debounce(100)
  handleInput(): void {
    this.onChange(this.value);
  }
}
