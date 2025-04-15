import {AsyncPipe} from '@angular/common';
import {Component, forwardRef, inject, input, OnInit, signal} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatSelectChange} from '@angular/material/select';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {UntilDestroy} from '@ngneat/until-destroy';
import _find from 'lodash-es/find';
import _some from 'lodash-es/some';
import {BehaviorSubject, finalize} from 'rxjs';

import {BudgetGroupService} from './budget-group.service';

@UntilDestroy()
@Component({
  selector: 'de-budget-group-control',
  templateUrl: './budget-group-control.component.html',
  styleUrls: ['./budget-group-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BudgetGroupControl),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BudgetGroupControl),
      multi: true,
    },
  ],
  imports: [ReactiveFormsModule, MeSelectComponent, MatIcon, AsyncPipe, MatProgressSpinner],
})
export class BudgetGroupControl implements ControlValueAccessor, Validator, OnInit {
  title = input<string>();

  infoTooltip = input<string>();

  placeholder = input<string>();

  controller = new FormControl<string>('');

  control: AbstractControl;

  budgetGroupOptions = signal<Array<MeSelectOption>>([]);
  errorMsg = signal<string>('');
  passValidation = signal<boolean>(false);
  canStillTriggerJob = signal<boolean>(false);

  isAllOptionsDisabled = false;

  private isLoading = new BehaviorSubject<boolean>(false);

  isLoading$ = this.isLoading.asObservable();

  private _value: any;

  private _disabled: boolean;

  private _touched: boolean;

  private initValue: string;

  private initOptions = false;

  budgetGroupService = inject(BudgetGroupService);
  ngOnInit(): void {
    this._setBudgetGroupOptions();
    this.markAsTouched();
  }

  private _setBudgetGroupOptions(): void {
    this.isLoading.next(true);
    this.budgetGroupService
      .getBudgetGroups()
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe(({groups, error, isValid}) => {
        this.initOptions = true;
        this.budgetGroupOptions.set(groups);
        this.errorMsg.set(error);
        this.passValidation.set(isValid && !groups.length);
        this.markAsTouched();
        this._setDefaultValue();
        this._setIsAllOptionsDisabled();
        this.canStillTriggerJob.set(isValid && !!error);
        this.control?.updateValueAndValidity();
      });
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

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  writeValue(value: string): void {
    this.initValue = value;
  }

  markAsTouched(): void {
    if (!this._touched) {
      this._onTouched();
      this._touched = true;
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.control = control;
    if (!this.initOptions) {
      return {
        required: true,
      };
    } else if (this.passValidation()) {
      return null;
    } else if (!this.controller.value) {
      return {
        required: true,
      };
    }
    return null;
  }

  onSelectionChange(event: MatSelectChange): void {
    this._value = event.value;
    this._onChange(this._value);
  }

  private _setIsAllOptionsDisabled(): void {
    const isEnabled = _some(
      this.budgetGroupOptions(),
      (option: MeSelectOption) => !option.isDisabled,
    );
    this.isAllOptionsDisabled = !isEnabled;
  }

  private _setDefaultValue(): void {
    const defaultValue = this._getDefaultValue();
    if (defaultValue) {
      this._value = defaultValue;
      this.controller.setValue(defaultValue);
      setTimeout(() => {
        this._onChange(defaultValue);
      });
    }
  }

  private _getDefaultValue(): string {
    const found = this._findValidValueInOptions(this.initValue);
    if (found) {
      return this.initValue;
    } else if (
      this.budgetGroupOptions()?.length === 1 &&
      !this.controller.value &&
      !this.budgetGroupOptions()[0].isDisabled
    ) {
      return this.budgetGroupOptions()[0].id;
    }
    return '';
  }

  private _findValidValueInOptions(value: string): MeSelectOption {
    const found = _find(this.budgetGroupOptions(), (option: MeSelectOption) => option.id === value);
    if (!found?.isDisabled) {
      return found;
    }
    return null;
  }
}
