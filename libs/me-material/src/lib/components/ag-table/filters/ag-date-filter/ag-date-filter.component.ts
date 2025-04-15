import {IFilterAngularComp} from '@ag-grid-community/angular';
import {IDoesFilterPassParams, IFilterParams} from '@ag-grid-community/core';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {FormArray, FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MeFieldValidator} from '@mobileye/material/src/lib/common';
import {MeDateComponent} from '@mobileye/material/src/lib/components/form/date';
import {
  dateDiff,
  isEmptyObject,
  startOfDayFns,
  toDateFns,
  toShortDate,
} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import _find from 'lodash-es/find';
import {filter} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

export interface MeDateFilterTypeOptions {
  minDate: Date;
  maxDate: Date;
  startAt: Date;
  title: string;
  parameterName: string;
}

@UntilDestroy()
@Component({
  selector: 'me-ag-date-filter',
  templateUrl: './ag-date-filter.component.html',
  styleUrls: ['./ag-date-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MeDateComponent,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatCheckboxModule,
  ],
})
export class MeAgDateFilterComponent implements IFilterAngularComp {
  form: FormArray;
  params: IFilterParams;
  dateOptions: Array<MeDateFilterTypeOptions>;
  validations: Array<MeFieldValidator>;
  clearable: boolean;
  forceErrorMsg: string;
  permanentValue: string;
  permanentControl: FormControl<boolean>;

  private inactiveFilterValues = [null, undefined, ''];

  private inSetModel = false;

  constructor() {}

  agInit(params: IFilterParams): void {
    this.permanentControl = new FormControl<boolean>(false);
    this.params = params;
    this.permanentValue = params.colDef.filterParams.permanent;
    this.dateOptions = params.colDef.filterParams.dateOptions;
    this.validations = params.colDef.filterParams.validations;
    const validators = this.validations.map((validation: MeFieldValidator) => validation.validator);
    this.form = new FormArray([new FormControl(), new FormControl()], validators);
    this.clearable =
      (params.colDef.filterParams.buttons as Array<string>)?.includes('clear') ?? false;
    this.form.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .pipe(filter((_) => !this.inSetModel))
      .subscribe((_) => {
        if (this.form.status === 'VALID') {
          this.forceErrorMsg = '';
          this.params.filterChangedCallback();
        } else if (this.form.status === 'INVALID') {
          const errorValidationName = Object.keys(this.form.errors)[0];
          const obj = _find(
            this.validations,
            (item: MeFieldValidator) => item.name === errorValidationName,
          );
          this.forceErrorMsg = obj.message;
        }
      });

    this.permanentControl.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((isPermanent: boolean) => {
        if (isPermanent) {
          this.form.disable();
        } else {
          this.form.enable();
        }
        if (isPermanent) {
          this.params.filterChangedCallback();
        }
      });
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const columnStr: string = params.data[this.params.colDef.field];

    if (this.permanentControl.value) {
      if (columnStr && dateDiff(this.permanentValue, columnStr) !== 0) {
        return false;
      }
      return true;
    }

    const columnValue: Date = startOfDayFns(columnStr);
    if (!this.form.at(0).value) {
      return dateDiff(this.form.at(1).value, columnValue) >= 0;
    }

    if (!this.form.at(1).value) {
      return dateDiff(this.form.at(0).value, columnValue) <= 0;
    }

    return (
      dateDiff(this.form.at(0).value, columnValue) <= 0 &&
      dateDiff(this.form.at(1).value, columnValue) >= 0
    );
  }

  getModel(): any {
    if (!this.isFilterActive()) {
      return null;
    }
    const model = {
      filterType: 'date',
      type: 'inRange',
      dateFrom: toShortDate(this.form.at(0).value),
      dateTo: toShortDate(this.form.at(1).value),
      dateFromParameterName: this.dateOptions[0].parameterName,
      dateToParameterName: this.dateOptions[1].parameterName,
    };

    if (this.permanentControl.value) {
      delete model.dateTo;
      delete model.dateToParameterName;
      model.dateFrom = this.permanentValue;
    } else {
      if (!model.dateFrom || model.dateFrom === 'Invalid date') {
        delete model.dateFrom;
        delete model.dateFromParameterName;
      }
      if (!model.dateTo || model.dateTo === 'Invalid date') {
        delete model.dateTo;
        delete model.dateToParameterName;
      }
    }

    return model;
  }

  isFilterActive(): boolean {
    return (
      this.permanentControl.value ||
      this.form.controls.some(
        (valueControl: FormControl) => !this.inactiveFilterValues.includes(valueControl.value),
      )
    );
  }

  setModel(model: any): void {
    this.inSetModel = true;
    if (this.permanentValue && this.permanentValue === model?.dateFrom) {
      this.permanentControl.setValue(true);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      model?.dateFrom && this.form.at(0).setValue(toDateFns(model?.dateFrom, 'yyyy-MM-dd'));
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      model?.dateTo && this.form.at(1).setValue(toDateFns(model?.dateTo, 'yyyy-MM-dd'));

      if (!model || isEmptyObject(model)) {
        this.permanentControl.setValue(false);
        this.form.at(0).setValue(null);
        this.form.at(1).setValue(null);
      }
    }
    this.inSetModel = false;
  }

  onClear(): void {
    this.permanentControl.setValue(false);
    this.form.controls.forEach((control: FormControl) => control.setValue(null));
  }
}
