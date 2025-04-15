import {IFilterAngularComp} from '@ag-grid-community/angular';
import {AgPromise, IDoesFilterPassParams, IFilterParams} from '@ag-grid-community/core';
import {Component} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-ag-number-filter',
  imports: [MeInputComponent, MeSelectComponent, MatButtonModule, ReactiveFormsModule],
  templateUrl: './ag-number-filter.component.html',
  styleUrl: './ag-number-filter.component.scss',
})
export class MeAgNumberFilterComponent implements IFilterAngularComp {
  valueControl: FormControl = new FormControl();
  operatorControl: FormControl = new FormControl();
  placeholder = '';
  options: Array<MeSelectOption>;
  filterOptions: Array<{displayKey: string; displayName: string}>;
  params: IFilterParams;
  optionsMap = new Map<string, string>([
    ['equals', 'Equal'],
    ['notEqual', 'Not equal'],
    ['greaterThan', 'Greater than'],
    ['greaterThanOrEqual', 'Greater than or equal'],
    ['lessThan', 'Less than'],
    ['lessThanOrEqual', 'Less than or equal'],
  ]);
  clearable: boolean;

  agInit(params: IFilterParams): void {
    this.params = params;
    this.filterOptions = params.colDef.filterParams.filterOptions;
    this.options = this.filterOptions.map((optObj: {displayKey: string; displayName: string}) => {
      return {
        id: optObj.displayKey,
        value: optObj.displayName || this.optionsMap.get(optObj.displayKey) || optObj.displayKey,
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
      this.valueControl.value !== '' &&
      !isNaN(this.valueControl.value)
    );
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const filterType = this.operatorControl.value || this.options[0]?.id;
    const value = params.data[this.params.colDef.field] ?? '';
    const filterNum = Number(this.valueControl.value?.toString()?.replace(/,/g, ''));
    if (filterNum == null || isNaN(filterNum)) {
      return false;
    }
    switch (filterType) {
      case 'equals':
        return value === filterNum;
      case 'notEqual':
        return value !== filterNum;
      case 'greaterThan':
        return value > filterNum;
      case 'greaterThanOrEqual':
        return value >= filterNum;
      case 'lessThan':
        return value < filterNum;
      case 'lessThanOrEqual': {
        return value <= filterNum;
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
    if (Number(this.valueControl.value) < 0) {
      this.valueControl.setValue(Math.abs(Number(this.valueControl.value)));
    }
    return {
      filterType: 'number',
      type: this.operatorControl.value || this.options[0]?.id,
      filter: Math.abs(Number(this.valueControl.value)),
    };
  }

  setModel(model: any): void | AgPromise<void> {
    this.operatorControl.setValue(model?.type);
    if (
      !model?.filter ||
      isNaN(model?.filter?.toString()?.replace(/,/g, '')) ||
      Number(model?.filter?.toString()?.replace(/,/g, '')) > 0
    ) {
      this.valueControl.setValue(model?.filter);
    } else {
      this.valueControl.setValue(Math.abs(model?.filter));
    }
  }

  onBlurred(): void {
    this.params.filterChangedCallback();
  }

  onClear(): void {
    this.setModel(null);
    this.params.filterChangedCallback();
  }
}
