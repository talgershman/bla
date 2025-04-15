import {Component, inject, Input, OnInit} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NgControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import {MeDateComponent} from '@mobileye/material/src/lib/components/form/date';
import {
  addDaysToDate,
  dateDiff,
  endOfToday,
  isDate,
  PERMANENT_DATE,
  startOfDayFns,
  startOfToday,
  toDateFns,
  toShortDate,
} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  DataRetentionConfig,
  DataRetentionKnownKeysEnum,
  DataRetentionObj,
} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';
import {OnChange} from 'property-watch-decorator';

const DATE_INFINITY = -1;

export const sortDataRetentionKeys = (keys: Array<DataRetentionKnownKeysEnum>) => {
  // Define the desired order
  const order = [
    DataRetentionKnownKeysEnum.MEST_OUTPUTS,
    DataRetentionKnownKeysEnum.PARSED_DATA,
    DataRetentionKnownKeysEnum.MERGED_PARSED_DATA,
    DataRetentionKnownKeysEnum.ETL_RESULTS,
  ];

  // Sort the array based on the order
  keys.sort((a: DataRetentionKnownKeysEnum, b: DataRetentionKnownKeysEnum) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);

    // If both elements are in the order array, compare their indices
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If one element is in the order array and the other is not, prioritize the one in the order array
    if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    }

    // If neither element is in the order array, maintain their original order
    return 0;
  });

  return keys;
};

@UntilDestroy()
@Component({
  selector: 'de-data-retention-control',
  templateUrl: './data-retention-control.component.html',
  styleUrls: ['./data-retention-control.component.scss'],
  imports: [MeDateComponent, ReactiveFormsModule, MatCheckboxModule],
})
export class DataRetentionControlComponent implements ControlValueAccessor, Validator, OnInit {
  @Input()
  dataRetention: DataRetentionObj;

  @Input()
  config: DataRetentionConfig;

  @Input()
  showEtlResults: boolean;

  @OnChange<void>('_onShowMergedParsedDataChanged')
  @Input()
  showMergedParsedData: boolean;

  @Input()
  forceShowAllKeys: boolean;

  form = new FormGroup<any>({});

  dateMin: Date;

  showPermanentMessage = false;

  formKeys = [];

  control: AbstractControl;

  private parsedDataChanged = false;

  private lastMergedParsedData: string;

  private _value: any;

  private _disabled: boolean;

  private _touched: boolean;

  public ngControl = inject(NgControl, {optional: true, self: true})!;

  constructor() {
    // Replace the provider from above with this.
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
  }

  // eslint-disable-next-line
  _onTouched = () => {};

  // eslint-disable-next-line
  _onChange = (value: any) => {};

  ngOnInit(): void {
    this.dateMin = addDaysToDate(startOfToday(), 1);
    this.ngControl.control.setValidators([this.validate.bind(this)]);
    this.ngControl.control.updateValueAndValidity();
    this._addAllDataControls();
    this._value = this._serializeData();
    this._onChange(this._value);
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this._value = this._serializeData();
      this._onChange(this._value);
    });
    this.formKeys = this._getFormKeys();
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  writeValue(obj: DataRetentionObj): void {
    this._value = obj;
  }

  markAsTouched(): void {
    if (!this._touched) {
      this._onTouched();
      this._touched = true;
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.control = control;
    if (!this._touched) {
      return null;
    }

    const parsedDataAndEtlResultsError = this._validateParsedDataAndEtlResults(control);
    if (parsedDataAndEtlResultsError) {
      return parsedDataAndEtlResultsError;
    }

    if (this.form.invalid) {
      return {
        isRequired: true,
      };
    }
    return null;
  }

  onDateChanged(value: Date, key: string): void {
    this._checkParsedDataChanged(key);
    this.markAsTouched();
    const warnMsg = this._getWarnMsg(startOfDayFns(value));
    this.form.get(key).get('warnMsg').setValue(warnMsg);
    this._handleParsedDataDateChanged(value, key);
  }

  onPermanentChanged(event: MatCheckboxChange, key: string): void {
    this._checkParsedDataChanged(key);
    const dateControl = this.form.get(key).get('date');
    if (event.checked) {
      dateControl.disable();
      this.form.get(key).get('warnMsg').setValue('');
      if (!this._value?.[key]) {
        this._value = {
          ...(this._value || {}),
          [key]: PERMANENT_DATE,
        };
        this._onChange(this._value);
      }
      this._handleParsedDataPermanentChanged(key);
      this.showPermanentMessage = true;
    } else {
      dateControl.enable();
      this.onDateChanged(
        isDate(dateControl.value) ? dateControl.value : toDateFns(dateControl.value, 'yyyy-MM-dd'),
        key,
      );
      this._hidePermanentMessage();
    }
  }

  private _handleParsedDataDateChanged(value: Date, key: string): void {
    const valueKeys = new Set(Object.keys(this._value || {}));
    if (
      valueKeys.has(DataRetentionKnownKeysEnum.PARSED_DATA) &&
      valueKeys.has(DataRetentionKnownKeysEnum.ETL_RESULTS) &&
      key === DataRetentionKnownKeysEnum.ETL_RESULTS &&
      !this.parsedDataChanged &&
      this._value?.[DataRetentionKnownKeysEnum.ETL_RESULTS] !== PERMANENT_DATE &&
      this._value?.[DataRetentionKnownKeysEnum.PARSED_DATA] !== PERMANENT_DATE
    ) {
      const diffDays = dateDiff(
        this._value?.[DataRetentionKnownKeysEnum.PARSED_DATA],
        this._value?.[DataRetentionKnownKeysEnum.ETL_RESULTS],
      );
      if (diffDays < 0) {
        const parsedDataControl = this.form.get(DataRetentionKnownKeysEnum.PARSED_DATA);
        const warnMsg = this._getWarnMsg(startOfDayFns(value));
        parsedDataControl.get('warnMsg').setValue(warnMsg);
        parsedDataControl
          .get('date')
          .setValue(this._value?.[DataRetentionKnownKeysEnum.ETL_RESULTS]);
      }
    }
  }

  private _handleParsedDataPermanentChanged(key: string): void {
    const valueKeys = new Set(Object.keys(this._value || {}));
    if (
      valueKeys.has(DataRetentionKnownKeysEnum.PARSED_DATA) &&
      valueKeys.has(DataRetentionKnownKeysEnum.ETL_RESULTS) &&
      key === DataRetentionKnownKeysEnum.ETL_RESULTS &&
      !this.parsedDataChanged &&
      this._value?.[DataRetentionKnownKeysEnum.PARSED_DATA] !== PERMANENT_DATE
    ) {
      const parsedDataControl = this.form.get(DataRetentionKnownKeysEnum.PARSED_DATA);
      parsedDataControl.get('date').disable();
      parsedDataControl.get('warnMsg').setValue('');
      parsedDataControl.get('permanentControl').setValue(true);
    }
  }

  private _checkParsedDataChanged(key: string): void {
    if (key === DataRetentionKnownKeysEnum.PARSED_DATA) {
      this.parsedDataChanged = true;
    }
  }

  private _hidePermanentMessage(): void {
    for (const formKey of this.formKeys) {
      if (this.form.get(formKey)?.get('permanentControl')?.value) {
        return;
      }
    }
    this.showPermanentMessage = false;
  }

  private _getWarnMsg(value: Date | string): string {
    const currentDate = startOfToday();
    const diffDays = dateDiff(value, currentDate);
    let warnMsg = isNaN(diffDays) ? '' : `${diffDays} days remaining`;
    if (diffDays === 1) {
      warnMsg = '1 day remaining';
    }
    if (diffDays <= 0) {
      warnMsg = '';
    }
    return warnMsg;
  }

  private _serializeData(): any {
    const result = {};
    const formValue = this.form.getRawValue();
    for (const key in formValue) {
      if (this.dataRetention.hasOwnProperty(key)) {
        if (!formValue[key].date) {
          result[key] = null;
        } else if (formValue[key].permanentControl) {
          result[key] = PERMANENT_DATE;
        } else if (this.form.get(key).get('date').enabled) {
          result[key] = toShortDate(formValue[key].date);
        } else {
          result[key] = '-'; // date filter disabled
        }
      }
    }
    return result;
  }

  private _addDataControl(key: string, currentValue: string): void {
    const objInfo = this.config[key];
    if (!objInfo) {
      return;
    }
    if (
      !this.forceShowAllKeys &&
      !this.showEtlResults &&
      key === DataRetentionKnownKeysEnum.ETL_RESULTS
    ) {
      return;
    }
    if (
      !this.forceShowAllKeys &&
      !this.showMergedParsedData &&
      key === DataRetentionKnownKeysEnum.MERGED_PARSED_DATA
    ) {
      return;
    }
    const maxIntValue = objInfo.max || 0;
    const label = objInfo.label || _startCase(key);
    const tooltip = objInfo.tooltip;
    const currentDate = endOfToday();
    const maxDate = maxIntValue === DATE_INFINITY ? null : addDaysToDate(currentDate, maxIntValue);
    const warnMsg = this._getWarnMsg(currentValue);
    const hasPermanentControl = !!objInfo.allowPermanent;
    const isPermanent = currentValue === PERMANENT_DATE;

    this.form.addControl(
      key,
      new FormGroup({
        date: new FormControl<string>(
          {
            value: isPermanent ? toShortDate(addDaysToDate(startOfToday(), 1)) : currentValue,
            disabled: warnMsg === '' || isPermanent,
          },
          Validators.required,
        ),
        max: new FormControl<Date>({value: maxDate, disabled: true}),
        label: new FormControl<string>({value: label, disabled: true}),
        tooltip: new FormControl<string>({value: tooltip, disabled: true}),
        warnMsg: new FormControl<string>({value: isPermanent ? '' : warnMsg, disabled: true}),
        allowPermanent: new FormControl<boolean>({value: hasPermanentControl, disabled: true}),
        permanentControl: new FormControl<boolean>({value: isPermanent, disabled: warnMsg === ''}),
      }),
    );

    if (isPermanent) {
      this.showPermanentMessage = true;
    }
  }

  private _getFormKeys(): Array<string> {
    return this._sortFormKeys(
      (Object.keys(this.form.controls) || []) as Array<DataRetentionKnownKeysEnum>,
    );
  }

  private _onShowMergedParsedDataChanged(showMergedParsedDataChanged: boolean): void {
    const control = this.form.get(DataRetentionKnownKeysEnum.MERGED_PARSED_DATA)?.get('date');
    const permanentControl = this.form
      .get(DataRetentionKnownKeysEnum.MERGED_PARSED_DATA)
      ?.get('permanentControl');
    const currentFormKeys = Object.keys(this.form.value);

    if (!currentFormKeys.length) {
      return;
    }

    if (!showMergedParsedDataChanged) {
      this.lastMergedParsedData = permanentControl?.value ? PERMANENT_DATE : control?.value;
      if (control) {
        this.form.removeControl(DataRetentionKnownKeysEnum.MERGED_PARSED_DATA);
      }
    } else {
      this._addDataControl(
        DataRetentionKnownKeysEnum.MERGED_PARSED_DATA,
        this.lastMergedParsedData ||
          this.dataRetention[DataRetentionKnownKeysEnum.MERGED_PARSED_DATA],
      );
    }

    this.formKeys = this._getFormKeys();

    if (!showMergedParsedDataChanged) {
      this._hidePermanentMessage();
    }
  }

  private _addAllDataControls(): void {
    for (const key in this.dataRetention) {
      if (this.dataRetention.hasOwnProperty(key)) {
        this._addDataControl(key, this._value?.[key] || this.dataRetention[key]);
      }
    }
  }

  private _sortFormKeys(arr: Array<DataRetentionKnownKeysEnum>) {
    return sortDataRetentionKeys(arr);
  }

  private _validateParsedDataAndEtlResults(control: AbstractControl): ValidationErrors | null {
    const valueKeys = new Set(Object.keys(control.value || {}));
    if (
      valueKeys.has(DataRetentionKnownKeysEnum.PARSED_DATA) &&
      valueKeys.has(DataRetentionKnownKeysEnum.ETL_RESULTS) &&
      this.parsedDataChanged
    ) {
      const diffDays = dateDiff(
        control.value?.[DataRetentionKnownKeysEnum.PARSED_DATA],
        control.value?.[DataRetentionKnownKeysEnum.ETL_RESULTS],
      );
      const parseDataForm = this.form.get(DataRetentionKnownKeysEnum.PARSED_DATA);
      const isETLResultsPermanent: boolean = this.form
        .get(DataRetentionKnownKeysEnum.ETL_RESULTS)
        .get('permanentControl')?.value;
      const isParsedDataPermanent: boolean = this.form
        .get(DataRetentionKnownKeysEnum.PARSED_DATA)
        .get('permanentControl')?.value;
      if (
        (isETLResultsPermanent && !isParsedDataPermanent) ||
        (diffDays < 0 && !isETLResultsPermanent)
      ) {
        parseDataForm.setErrors({
          parsingDataInvalid: 'Date must no be earlier than ETL Results',
        });
        return {
          parsingDataInvalid: true,
        };
      } else {
        parseDataForm.setErrors(null);
        const prevErr = {...control.errors};
        delete prevErr.parsingDataInvalid;
        control.setErrors(Object.keys(prevErr).length ? prevErr : null);
      }
    }
    return null;
  }
}
