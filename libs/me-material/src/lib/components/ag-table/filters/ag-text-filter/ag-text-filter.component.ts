import {IFilterAngularComp} from '@ag-grid-community/angular';
import {AgPromise, IDoesFilterPassParams, IFilterParams} from '@ag-grid-community/core';
import {Component} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import _isString from 'lodash-es/isString';
import {distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-ag-text-filter',
  imports: [MeInputComponent, MeSelectComponent, MatButtonModule, ReactiveFormsModule],
  templateUrl: './ag-text-filter.component.html',
  styleUrl: './ag-text-filter.component.scss',
})
export class MeAgTextFilterComponent implements IFilterAngularComp {
  valueControl: FormControl = new FormControl();
  operatorControl: FormControl = new FormControl();
  placeholder = '';
  options: Array<MeSelectOption>;
  params: IFilterParams;
  optionsMap = new Map<string, string>([
    ['contains', 'Contains'],
    ['notContains', 'Not contains'],
    ['equals', 'Equal'],
    ['notEqual', 'Not equal'],
    ['startsWith', 'Starts with'],
    ['endsWith', 'Ends with'],
  ]);
  clearable: boolean;

  agInit(params: IFilterParams): void {
    this.params = params;
    this.options = params.colDef.filterParams.filterOptions.map((filterId: string) => {
      return {
        id: filterId,
        value: this.optionsMap.get(filterId) || filterId,
      };
    });
    if (this.options.length) {
      this.placeholder = this.options[0].value;
      this.operatorControl.setValue(this.options[0].id);
    }

    if (this.options.length < 2) {
      this.operatorControl.disable();
    }

    this.operatorControl.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((_) => this.params.filterChangedCallback());

    this.clearable =
      (params.colDef.filterParams.buttons as Array<string>)?.includes('clear') ?? false;
  }

  isFilterActive(): boolean {
    return (
      this.valueControl.value !== null &&
      this.valueControl.value !== undefined &&
      this.valueControl.value !== ''
    );
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const filterType = this.operatorControl.value || this.options[0]?.id;
    const fieldValue = `${params.data[this.params.colDef.field] ?? ''}`;
    const value = _isString(fieldValue) ? fieldValue.toLowerCase() : fieldValue;
    const filterText = _isString(this.valueControl.value)
      ? this.valueControl.value.toLowerCase()
      : this.valueControl.value.toString();
    if (filterText == null) {
      return false;
    }
    switch (filterType) {
      case 'contains':
        return value?.includes(filterText);
      case 'notContains':
        return !value?.includes(filterText);
      case 'equals':
        return value === filterText;
      case 'notEqual':
        return value !== filterText;
      case 'startsWith':
        return value?.indexOf(filterText) === 0;
      case 'endsWith': {
        const index = value?.lastIndexOf(filterText);
        return index >= 0 && index === value?.length - filterText?.length;
      }
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck = filterType;
        throw new Error(`Unhandled doesFilterPass case: ${exhaustiveCheck}`);
      }
    }
  }

  getModel(): any {
    if (!this.isFilterActive()) {
      return null;
    }
    return {
      filterType: 'text',
      type: this.operatorControl.value || this.options[0]?.id,
      filter: this.valueControl.value,
    };
  }

  setModel(model: any): void | AgPromise<void> {
    this.operatorControl.setValue(model?.type);
    this.valueControl.setValue(model?.filter);
  }

  onBlurred(): void {
    this.params.filterChangedCallback();
  }

  onClear(): void {
    this.setModel(null);
    this.params.filterChangedCallback();
  }
}
