import {computed, Injectable, Signal, signal, TemplateRef, WritableSignal} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {MatDialogRef} from '@angular/material/dialog';
import {Params} from '@angular/router';
import {PickerDialogComponent} from '@mobileye/material/src/lib/components/picker/picker-dialog';
import _isNil from 'lodash-es/isNil';
import _omitBy from 'lodash-es/omitBy';
import {Subject} from 'rxjs';

@Injectable()
export class PickerHostService<T> {
  pickerTitle: WritableSignal<string> = signal('');
  pickerDialogTitle: string;
  dialogTemplate: Signal<TemplateRef<any>>;
  selectedFilter: WritableSignal<string> = signal(undefined);
  initialFiltersValue: WritableSignal<Params> = signal({});
  dialogRef: MatDialogRef<PickerDialogComponent>;
  initialSelectionId: number | string;
  selectValueChange: Subject<T> = new Subject<T>();

  private initialPickerTitle: string;
  private groupFilterColumn: string;
  private shouldClosePickerDialog = true;

  initialTableFilters = computed((): Params => {
    const groupFilter = _isNil(this.selectedFilter())
      ? undefined
      : {[this.groupFilterColumn]: this.selectedFilter()};
    if (!this.initialFiltersValue() && !groupFilter) {
      return null;
    }
    return {
      ..._omitBy(this.initialFiltersValue() || {}, _isNil),
      ...(groupFilter || {}),
    } as Params;
  });

  initialTableFilters$ = toObservable(this.initialTableFilters);

  init(
    pickerTitle: string,
    pickerDialogTitle: string,
    groupFilterColumn: string,
    dialogTemplate: Signal<TemplateRef<any>>,
  ): void {
    this.pickerTitle.set(pickerTitle);
    this.initialPickerTitle = pickerTitle;
    this.pickerDialogTitle = pickerDialogTitle;
    this.groupFilterColumn = groupFilterColumn;
    this.dialogTemplate = dialogTemplate;
  }

  onOpenDialog(dialog: MatDialogRef<PickerDialogComponent>): void {
    this.dialogRef = dialog;
  }

  onSelectionChanged(selection: T, idKey: string, nameKey: string): void {
    if (
      selection &&
      this.initialSelectionId !== (selection?.[idKey] ? selection[idKey] : undefined) &&
      this.shouldClosePickerDialog
    ) {
      this.dialogRef.close();
      this.shouldClosePickerDialog = false;
      this.selectValueChange.next(selection);
      this.selectedFilter.set(selection?.[this.groupFilterColumn]);
      this.initialSelectionId = selection?.[idKey] ? selection?.[idKey] : undefined;
      this.pickerTitle.set(selection?.[nameKey] ?? this.initialPickerTitle);
    } else {
      this.shouldClosePickerDialog = true;
    }
  }

  setShouldClosePickerDialog(shouldClosePickerDialog: boolean): void {
    this.shouldClosePickerDialog = shouldClosePickerDialog;
  }
}
