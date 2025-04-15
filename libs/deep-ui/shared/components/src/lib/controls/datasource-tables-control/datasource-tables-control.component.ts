import {ChangeDetectionStrategy, Component, inject, input, OnInit} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {MeChipsGroupButton} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {SelectDatasourceComponent} from 'deep-ui/shared/components/src/lib/selection/select-datasource';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceDeselectData, DataSourceSelection} from 'deep-ui/shared/models';

import {DatasourceTablesControlService} from './datasource-tables-control.service';

@Component({
  selector: 'de-datasource-tables-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './datasource-tables-control.component.html',
  styleUrl: './datasource-tables-control.component.scss',
  imports: [SelectDatasourceComponent],
  providers: [DatasourceTablesControlService],
})
export class DatasourceTablesControlComponent implements ControlValueAccessor, Validator, OnInit {
  datasourcesOptions = input<Array<MeChipsGroupButton>>([]);
  control: AbstractControl;

  // eslint-disable-next-line
  _onTouched = () => {};

  // eslint-disable-next-line
  _onChange = (value: any) => {};

  private _value: any;

  private _disabled: boolean;

  public ngControl = inject(NgControl, {optional: true, self: true})!;
  private datasourceTablesControlService = inject(DatasourceTablesControlService);

  get value(): any {
    if (this.ngControl?.valid || this.ngControl?.pending) {
      return this._value;
    }
    return null;
  }

  get disabled(): boolean {
    return this.control?.disabled;
  }

  constructor() {
    // Replace the provider from above with this.
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    if (this.ngControl?.control) {
      this.control = this.ngControl.control;
      this._value = this.control.value;
    }
  }

  writeValue(obj: any): void {
    this._value = obj;
  }
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  validate(control: AbstractControl<any, any>): ValidationErrors {
    if (!control.value?.length) {
      return {
        required: true,
      };
    }
    return null;
  }

  onDataSourceSelectionsChanged(dsSelectionData: {
    selections: Array<DataSourceSelection>;
    type: DataSourceDynamicViewEnum;
  }): void {
    const selections = this.datasourceTablesControlService.getSelectionsAfterChange(
      dsSelectionData.selections,
      dsSelectionData.type,
      this._value,
    );
    this._onChange(selections);
    this._value = this.control.value;
  }

  onSelectionRemoved(selection: DatasourceDeselectData): void {
    const currentSelectedDataSources =
      this.datasourceTablesControlService.getCurrentSelectedDataSources(selection, this._value);
    this._onChange(currentSelectedDataSources);
    this._value = this.control.value;
  }
}
