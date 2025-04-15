import {Component, inject, input, OnInit, output, signal, TemplateRef} from '@angular/core';
import {AbstractControl, ControlValueAccessor, NgControl, ValidationErrors} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {Params} from '@angular/router';
import {MeControlErrorMsgComponent} from '@mobileye/material/src/lib/components/form/control-error-msg';
import {MePickerComponent, PickerHostService} from '@mobileye/material/src/lib/components/picker';
import {PickerDialogComponent} from '@mobileye/material/src/lib/components/picker/picker-dialog';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ReplaySubject, Subject} from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'de-picker-control',
  templateUrl: './picker-control.component.html',
  styleUrl: './picker-control.component.scss',
  imports: [MePickerComponent, MeControlErrorMsgComponent],
  providers: [PickerHostService],
})
export class PickerControlComponent<T> implements ControlValueAccessor, OnInit {
  pickerTitle = input<string>();
  pickerDialogTitle = input<string>();
  dialogTemplate = input.required<TemplateRef<any>>();
  hideDialogCloseButton = input<boolean>(false);
  hideDialogFooter = input<boolean>(true);
  isSelectDialogDisabled = input<boolean>(false);

  openDialog = output<MatDialogRef<PickerDialogComponent>>();
  closeDialog = output<boolean>();

  idKey = input<string>();
  nameKey = input<string>();
  groupKey = input<string>();
  initialTableFilters = output<Params>();
  deserialized = input<ReplaySubject<T>>(new ReplaySubject<T>(1));
  valueSelected = input<Subject<T>>(new Subject<T>());

  ngControl = inject(NgControl, {optional: true, self: true})!;

  control: AbstractControl;

  private _value: any;
  private _disabled = signal<boolean>(false);

  pickerHostService: PickerHostService<T> = inject(PickerHostService);

  get value(): any {
    if (this.ngControl?.valid || this.ngControl?.pending) {
      return this._value;
    }
    return null;
  }

  get disabled(): boolean {
    return this._disabled();
  }

  constructor() {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    if (this.ngControl) {
      this.ngControl.control.setValidators([this.validate.bind(this)]);
      this.validate(this.ngControl.control);
      this._initializePickerHostService();
      this._registerEvents();
    }
  }

  writeValue(obj: any): void {
    this._value = obj;
  }

  // eslint-disable-next-line
  _onTouched = () => {};

  // eslint-disable-next-line
  _onChange = (value: any) => {};

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.control) {
      this.control = control;
    }
    if (this.control.invalid || this.control.value === null) {
      return this.control.errors;
    }
    return null;
  }

  onOpenDialog(dialog: MatDialogRef<PickerDialogComponent>): void {
    this.pickerHostService.onOpenDialog(dialog);
    this.openDialog.emit(dialog);
  }

  private _initializePickerHostService(): void {
    this.pickerHostService.init(
      this.value?.entity?.[this.nameKey()] || this.pickerTitle(),
      this.pickerDialogTitle(),
      this.groupKey(),
      this.dialogTemplate,
    );
  }

  private _registerEvents(): void {
    this.pickerHostService.initialTableFilters$
      .pipe(untilDestroyed(this))
      .subscribe((params: Params) => this.initialTableFilters.emit(params));
    this.deserialized()
      .pipe(untilDestroyed(this))
      .subscribe((entity: T) => {
        this.pickerHostService.initialSelectionId = entity[this.idKey()];
        this.pickerHostService.selectedFilter.set(entity[this.groupKey()]);
        this.pickerHostService.pickerTitle.set(entity[this.nameKey()]);
        this.pickerHostService.setShouldClosePickerDialog(false);
      });
    this.valueSelected()
      .pipe(untilDestroyed(this))
      .subscribe((selection: T) =>
        this.pickerHostService.onSelectionChanged(selection, this.idKey(), this.nameKey()),
      );
    this.pickerHostService.selectValueChange
      .pipe(untilDestroyed(this))
      .subscribe((selection: T) => {
        this._onChange({
          [this.idKey()]: selection[this.idKey()],
          entity: selection,
        });
      });
  }
}
