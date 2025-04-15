import {Module} from '@ag-grid-community/core';
import {Component} from '@angular/core';
import {
  meAgCellComponents,
  meAgFilterComponents,
  MeColDef,
  MeLoadingModulesOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';

export class BaseTableService {
  protected modulesMap: Map<string, () => Promise<Module>>;
  protected componentsMap: Map<string, () => Promise<[string, Component]>>;

  protected async loadModules(
    options: MeLoadingModulesOptions,
    moduleNames: string[],
  ): Promise<Array<Module>> {
    const {masterDetail, rowGrouping} = options;
    const modulePromises: Array<Promise<Module>> = [];

    if (masterDetail) {
      moduleNames.push('masterDetailModule');
    }

    if (rowGrouping) {
      moduleNames.push('rowGroupingModule');
    }

    for (const name of moduleNames) {
      const moduleFunction = this.modulesMap.get(name);
      if (moduleFunction) {
        modulePromises.push(moduleFunction());
      }
    }

    return Promise.all(modulePromises);
  }

  protected async loadComponents(componentNames: string[]): Promise<Array<[string, Component]>> {
    const componentPromises: Array<Promise<[string, Component]>> = [];

    for (const name of componentNames) {
      const componentFunction = this.componentsMap.get(name);
      if (componentFunction) {
        componentPromises.push(componentFunction());
      }
    }

    return Promise.all(componentPromises);
  }

  protected getCommonComponentNames<T>(columnDefs: MeColDef<T>[]): Array<string> {
    const componentNames = ['meAgCustomHeaderComponent'];

    componentNames.push(
      ...this.getFilterComponents(columnDefs),
      ...this.getCellComponents(columnDefs),
    );

    return componentNames;
  }

  protected async getMasterDetailModule(): Promise<Module> {
    const {MasterDetailModule} = await import('@ag-grid-enterprise/master-detail');
    return MasterDetailModule;
  }

  protected async getRowGroupingModule(): Promise<Module> {
    const {RowGroupingModule} = await import('@ag-grid-enterprise/row-grouping');
    return RowGroupingModule;
  }

  protected async getSideBarModule(): Promise<Module> {
    const {SideBarModule} = await import('@ag-grid-enterprise/side-bar');
    return SideBarModule;
  }

  protected async getFiltersToolPanelModule(): Promise<Module> {
    const {FiltersToolPanelModule} = await import('@ag-grid-enterprise/filter-tool-panel');
    return FiltersToolPanelModule;
  }

  protected async getColumnsToolPanelModule(): Promise<Module> {
    const {ColumnsToolPanelModule} = await import('@ag-grid-enterprise/column-tool-panel');
    return ColumnsToolPanelModule;
  }

  protected async getMeAgTextFilterComponentEntry(): Promise<[string, Component]> {
    const {MeAgTextFilterComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/filters/ag-text-filter'
    );
    return ['meAgTextFilterComponent', MeAgTextFilterComponent as Component];
  }

  protected async getMeAgNumberFilterComponentEntry(): Promise<[string, Component]> {
    const {MeAgNumberFilterComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/filters/ag-number-filter'
    );
    return ['meAgNumberFilterComponent', MeAgNumberFilterComponent as Component];
  }

  protected async getMeAgCustomHeaderComponentEntry(): Promise<[string, Component]> {
    const {MeAgCustomHeaderComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/ag-custom-header'
    );
    return ['meAgCustomHeaderComponent', MeAgCustomHeaderComponent as Component];
  }

  protected async getMeAgSelectFilterComponentEntry(): Promise<[string, Component]> {
    const {MeAgSelectFilterComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/filters/ag-select-filter'
    );
    return ['meAgSelectFilterComponent', MeAgSelectFilterComponent as Component];
  }

  protected async getMeAgDateFilterComponentEntry(): Promise<[string, Component]> {
    const {MeAgDateFilterComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/filters/ag-date-filter'
    );
    return ['meAgDateFilterComponent', MeAgDateFilterComponent as Component];
  }

  protected async getMeAgUserAutocompleteFilterComponentEntry(): Promise<[string, Component]> {
    const {MeAgUserAutocompleteFilterComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/filters/ag-user-autocomplete-filter'
    );
    return [
      'meAgUserAutocompleteFilterComponent',
      MeAgUserAutocompleteFilterComponent as Component,
    ];
  }

  protected async getMeAgMultiChipsFilterComponentEntry(): Promise<[string, Component]> {
    const {MeAgMultiChipsFilterComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter'
    );
    return ['meAgMultiChipsFilterComponent', MeAgMultiChipsFilterComponent as Component];
  }

  protected async getMeAgActionsCellComponentEntry(): Promise<[string, Component]> {
    const {MeAgActionsCellComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/ag-actions-cell'
    );
    return ['meAgActionsCellComponent', MeAgActionsCellComponent as Component];
  }

  protected async getMeAgTemplateRendererComponentEntry(): Promise<[string, Component]> {
    const {MeAgTemplateRendererComponent} = await import(
      '@mobileye/material/src/lib/components/ag-table/ag-template-renderer'
    );
    return ['meAgTemplateRendererComponent', MeAgTemplateRendererComponent as Component];
  }

  protected getFilterComponents<T>(columnDefs: MeColDef<T>[]): Array<string> {
    const filterComponentNames = [];

    for (const filterComponent of meAgFilterComponents) {
      if (columnDefs.some((col: MeColDef<T>) => col.filter === filterComponent)) {
        filterComponentNames.push(filterComponent);
      }
    }

    return filterComponentNames;
  }

  protected getCellComponents<T>(columnDefs: MeColDef<T>[]): Array<string> {
    const cellComponentNames = [];

    for (const cellComponent of meAgCellComponents) {
      if (columnDefs.some((col: MeColDef<T>) => col.cellRenderer === cellComponent)) {
        cellComponentNames.push(cellComponent);
      }
    }

    return cellComponentNames;
  }
}
