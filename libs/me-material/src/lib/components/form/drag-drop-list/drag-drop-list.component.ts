import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {CdkScrollable} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {memoize} from 'lodash-decorators/memoize';
import _values from 'lodash-es/values';

/* eslint-disable */
@Component({
  selector: 'me-drag-drop-list',
  templateUrl: './drag-drop-list.component.html',
  styleUrls: ['./drag-drop-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: MeDragDropListComponent,
      multi: true,
    },
  ],
  imports: [CdkScrollable, CdkDropList, CdkDrag, CdkDragPreview, MatIconModule, CdkDragHandle],
})
/* eslint-enable */
export class MeDragDropListComponent implements ControlValueAccessor {
  @Input()
  listTitle: string;

  @Input()
  selected: string;

  @Input()
  isInvalid: boolean;

  @Input()
  isTouched: boolean;

  @Input()
  errors: ValidationErrors;

  @Input()
  placeholders: string[];

  private hostElement = inject(ElementRef);
  private cd = inject(ChangeDetectorRef);

  items: string[] = [];

  // eslint-disable-next-line
  onChange = (value: any) => {};

  // eslint-disable-next-line
  onTouched = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: any): void {
    this.items = obj;
    this.cd.detectChanges();
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.items = [...this.items];
    this.onChange(this.items);
  }

  onDeleteItem(itemIndex: number): void {
    this.items.splice(itemIndex, 1);
    this.onChange(this.items);
    this.onTouched();
  }

  onClickedAdd(): void {
    this.items = [...this.items, ''];
    this.onChange(this.items);
    this.onTouched();

    setTimeout(() => {
      const elem = this.hostElement.nativeElement.querySelector(
        '.drag-drop-list-item:last-child input',
      );
      if (elem && elem.focus) {
        elem.focus();
      }
    }, 50);
  }

  updateListItem(event: Event, index: number): void {
    const key = 'value';
    this.items[index] = event.target[key];
    this.onChange(this.items);
    this.onTouched();
  }

  // eslint-disable-next-line
  @memoize((...args) => _values(args).join('_'))
  checkSelectedItem(selected: string, listItem: string, isInvalid: boolean): boolean {
    if (isInvalid || !selected || !listItem) {
      return false;
    }
    return selected.trim() === listItem.trim();
  }
}
