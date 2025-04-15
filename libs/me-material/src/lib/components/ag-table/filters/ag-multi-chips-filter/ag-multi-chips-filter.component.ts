import {IFilterAngularComp} from '@ag-grid-community/angular';
import {IDoesFilterPassParams, IFilterParams} from '@ag-grid-community/core';
import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'me-ag-multi-chips-filter',
  templateUrl: './ag-multi-chips-filter.component.html',
  styleUrls: ['./ag-multi-chips-filter.component.scss'],
  imports: [ReactiveFormsModule, MatButtonModule, MeFormControlChipsFieldComponent],
})
export class MeAgMultiChipsFilterComponent implements IFilterAngularComp, OnInit {
  formGroup: FormGroup;
  chipControl: FormControl;
  params: IFilterParams;
  placeholder: string;
  clearable: boolean;
  filterOption: string;

  private inSetModel = false;

  constructor() {}

  ngOnInit(): void {
    this.chipControl = new FormControl([]);
    this.formGroup = new FormGroup({chipControl: this.chipControl});

    this.chipControl.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .pipe(filter((_) => !this.inSetModel))
      .subscribe((_) => {
        this.params.filterChangedCallback();
      });
  }

  agInit(params: IFilterParams): void {
    this.params = params;
    this.filterOption =
      (params.colDef.filterParams?.filterOptions && params.colDef.filterParams?.filterOptions[0]) ||
      'multiContains';
    this.placeholder = params.colDef.filterParams?.filterPlaceholder;
    this.clearable =
      (params.colDef.filterParams?.buttons as Array<string>)?.includes('clear') ?? false;
  }

  isFilterActive(): boolean {
    return this.chipControl.value?.length;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    for (const chipValue of this.chipControl.value) {
      const fieldVal = params.data[this.params.colDef.field];
      const fieldArr = Array.isArray(fieldVal) ? fieldVal : fieldVal?.split(',');
      if (!fieldArr?.length) {
        continue;
      }
      if (params.data[this.params.colDef.field].includes(chipValue)) {
        return true;
      }
      for (const str of fieldArr) {
        if (str.includes(chipValue)) {
          return true;
        }
      }
    }
    return false;
  }

  getModel(): any {
    if (!this.isFilterActive()) {
      return null;
    }
    return {filterType: 'text', type: this.filterOption, filter: this.chipControl.value};
  }

  setModel(model: any): void {
    this.inSetModel = true;
    const modelFilter = Array.isArray(model?.filter) ? model.filter : model?.filter?.split(',');
    if (!modelFilter?.length) {
      this.chipControl.setValue([]);
      this.inSetModel = false;
      return;
    }
    this.chipControl.setValue(Array.from(new Set(modelFilter)));
    this.inSetModel = false;
  }

  onClear(): void {
    this.chipControl.setValue([]);
    this.params.filterChangedCallback();
  }
}
