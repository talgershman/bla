import {TextFieldModule} from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatChipsModule} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {MatFormFieldControl, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelect, MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBaseFormFieldControlDirective} from '@mobileye/material/src/lib/components/form';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {OnChange} from 'property-watch-decorator';

import {MeSelectOption} from './select-entites';

@Component({
  selector: 'me-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatOptionModule,
    MeTooltipDirective,
    MatInputModule,
    TextFieldModule,
    MatChipsModule,
    HintIconComponent,
    MatIconModule,
  ],
  host: {
    '[id]': 'id',
    '[title]': 'title',
  },
  animations: [MeFadeInOutAnimation],
  providers: [{provide: MatFormFieldControl, useExisting: MeSelectComponent}],
})
export class MeSelectComponent extends MeBaseFormFieldControlDirective<string> {
  @ViewChild('selectElem', {static: false, read: HTMLElement}) selectElemHtml: HTMLElement;

  @ViewChild('selectElem', {
    static: false,
    read: MatSelect,
  })
  selectElem: MatSelect;

  @Input()
  multiple: boolean;

  @Input()
  @OnChange<MeSelectOption[] | string[]>('_onOptionsChanged')
  options: MeSelectOption[] | string[];

  @HostBinding('style.--width')
  @Input()
  width: string;

  @Output()
  selectionChanged = new EventEmitter<MatSelectChange>();

  _options: MeSelectOption[];

  controlType = 'me-select';
  id = `me-select-${MeSelectComponent.nextId++}`;

  getFocusHTMLElement(): HTMLElement {
    return this.selectElemHtml;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.selectElem?.close();
  }

  open(): void {
    setTimeout(() => {
      this.selectElem.open();
    }, 500);
  }

  onSelectionChanged(event: MatSelectChange): void {
    this.onChange(this.value);
    setTimeout(() => {
      this.selectionChanged.emit(event);
    });
  }

  private _onOptionsChanged(options: MeSelectOption[] | string[]): void {
    if (options?.length) {
      this._options = this._convertToMeOption(options);
    } else {
      this._options = [];
    }
  }

  private _convertToMeOption(options: MeSelectOption[] | string[]): MeSelectOption[] {
    if (typeof options[0] === 'string' || options[0] instanceof String) {
      const stringOptions = options as string[];
      const convertedOptions: MeSelectOption[] = [];
      for (const option of stringOptions) {
        convertedOptions.push({
          id: option,
          value: option,
        });
      }
      return convertedOptions;
    }
    return options as MeSelectOption[];
  }

  onOpenedChanged(opened: boolean): void {
    if (opened) {
      this.onFocusIn();
    } else {
      this.onFocusOut(undefined);
    }
  }
}
