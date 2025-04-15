import {IFilterAngularComp} from '@ag-grid-community/angular';
import {IDoesFilterPassParams, IFilterParams} from '@ag-grid-community/core';
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';

@Component({
  selector: 'me-ag-select-filter',
  templateUrl: './ag-select-filter.component.html',
  styleUrls: ['./ag-select-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeSelectComponent, MatButtonModule, ReactiveFormsModule],
})
export class MeAgSelectFilterComponent implements IFilterAngularComp, OnInit {
  valueControl: FormControl;
  options: Array<MeSelectOption>;
  params: IFilterParams;
  placeholder: string;
  clearable: boolean;

  ngOnInit(): void {
    this.valueControl = new FormControl();
  }

  agInit(params: IFilterParams): void {
    this.params = params;
    this.placeholder = params.colDef.filterParams.filterPlaceholder;
    this.options = params.colDef.filterParams.values;
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
    return this.valueControl.value === params.data[this.params.colDef.field];
  }

  // Returns a model representing the current state of the filter, or null if the filter is not active. The grid calls getModel() on all active filters when gridApi.getFilterModel() is called.
  getModel(): any {
    if (!this.isFilterActive()) {
      return null;
    }
    return {filterType: 'text', type: 'equals', filter: this.valueControl.value};
  }

  // Sets the state of the filter using the supplied model. Providing null as the model will de-activate the filter.
  setModel(model: any): void {
    this.valueControl.setValue(model?.filter);
  }

  onSelectionChange(): void {
    this.params.filterChangedCallback();
  }

  onClear(): void {
    this.setModel(null);
    this.params.filterChangedCallback();
  }
}
