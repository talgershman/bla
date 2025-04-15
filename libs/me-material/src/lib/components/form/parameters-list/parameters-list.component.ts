import {CdkScrollable} from '@angular/cdk/scrolling';
import {TextFieldModule} from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';

import {MeParametersListItem, MeParametersListItemType} from './parameters-list-entities';

/* eslint-disable */
@Component({
  selector: 'me-parameters-list',
  templateUrl: './parameters-list.component.html',
  styleUrls: ['./parameters-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: MeParametersListComponent,
      multi: true,
    },
  ],
  animations: [MeFadeInOutAnimation],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    TextFieldModule,
    ReactiveFormsModule,
    FormsModule,
    CdkScrollable,
    MatIconModule,
    MeTextareaComponent,
  ],
})
/* eslint-enable */
export class MeParametersListComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('textAreaElem', {static: true}) textAreaElem;

  @Input()
  listTitle: string;

  @Input()
  textAreaPlaceholder: string;

  @Input()
  isInvalid: boolean;

  @Input()
  isTouched: boolean;

  @Input()
  errors: ValidationErrors;

  private hostElement = inject(ElementRef);
  private cd = inject(ChangeDetectorRef);

  items: MeParametersListItem[] = [];

  textAreaStr: string;

  MeParametersListItemType = MeParametersListItemType;

  isTextAreaOnBlurred = false;

  private timeoutId: number;

  // eslint-disable-next-line
  onChange = (value: any) => {};

  // eslint-disable-next-line
  onTouched = () => {};

  ngOnInit(): void {
    this._updateTextArea();
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: any): void {
    this.items = obj;
    this._updateTextArea();
    this.cd.detectChanges();
  }

  onSingleParamClickedAdd(): void {
    const newItem: MeParametersListItem = {
      type: MeParametersListItemType.SINGLE,
      key: '',
    };
    this._handleNewItemInner(newItem);
  }

  onKeyValueParamClickedAdd(): void {
    const newItem: MeParametersListItem = {
      type: MeParametersListItemType.KEY_VALUE,
      key: '',
      value: '',
    };
    this._handleNewItemInner(newItem);
  }

  onDeleteItem(itemIndex: number): void {
    this.items.splice(itemIndex, 1);
    this.items = [...this.items];
    this.onChange(this.items);
    this.onTouched();
    this._updateTextArea();
  }

  onTextAreaFocused(): void {
    this.isTextAreaOnBlurred = false;
  }

  onTextAreaBlurred(): void {
    const value = this.textAreaElem.getFocusHTMLElement().value.trim();
    if (value) {
      this.isTextAreaOnBlurred = true;
    }
    this._updateListItems(value);
  }

  updateListItem(itemIndex: number, inputElem: HTMLInputElement, propertyToUpdate: string): void {
    this.items[itemIndex][propertyToUpdate] = inputElem.value.trim();
    this.onChange(this.items);
    this.onTouched();
    this._updateTextArea();
  }

  private _updateListItems(textAreaValue: string): void {
    this._formatTextAreaValue(textAreaValue);
    this._updateItems();
  }

  private _updateTextArea(): void {
    if (!this.items.length) {
      this.textAreaStr = '';
      return;
    }
    this.textAreaStr = '';
    this.items.forEach((item, index) => {
      if (item.type === MeParametersListItemType.SINGLE && item.key) {
        if (index > 0) {
          this.textAreaStr += ' ';
        }
        this.textAreaStr += `${item.key}`;
      } else if (item.type === MeParametersListItemType.KEY_VALUE && item.key && item.value) {
        if (index > 0) {
          this.textAreaStr += ' ';
        }
        this.textAreaStr += `${item.key}=${item.value}`;
      }
    });
  }
  private _updateItems(): void {
    if (!this.textAreaStr) {
      this.items = [];
      this.onChange(this.items);
      return;
    }
    const textAreaSplittedBySpace = this.textAreaStr.split(/(?<!:|=)\s+(?!:|=|\.)/); // split by any space character unless it preceded by : or =
    // or it followed by : or = or .
    const newItems: MeParametersListItem[] = [];
    textAreaSplittedBySpace.forEach((textAreaPartStr) => {
      if (textAreaPartStr.includes('=') && !textAreaPartStr.includes(':')) {
        const [key, value] = textAreaPartStr.split('=');
        newItems.push({
          key,
          type: MeParametersListItemType.KEY_VALUE,
          value,
        });
      } else {
        newItems.push({
          key: textAreaPartStr,
          type: MeParametersListItemType.SINGLE,
        });
      }
    });
    this.items = newItems;
    this.onChange(this.items);
    this.onTouched();
  }
  private _handleNewItemInner(newItem: MeParametersListItem): void {
    this.items = [...this.items, newItem];
    this.onChange(this.items);
    this.onTouched();
    this.timeoutId = window.setTimeout(() => {
      this.hostElement.nativeElement
        .querySelector('.param-item-container:last-child input')
        .focus();
    }, 200);
  }
  private _formatTextAreaValue(textAreaVal: string): void {
    this.textAreaStr = textAreaVal.replace(/\s+/g, ' ').trim(); // replace sequence of spaces to be 1 space char only
  }
}
