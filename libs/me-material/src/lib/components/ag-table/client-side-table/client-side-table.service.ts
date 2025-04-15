import {ColDef, Module} from '@ag-grid-community/core';
import {Component, Injectable} from '@angular/core';
import {
  MeColDef,
  MeLoadingModulesOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {BaseTableService} from '@mobileye/material/src/lib/components/ag-table/services';

@Injectable()
export class MeClientSideTableService extends BaseTableService {
  private defaultModuleNames = [
    'clientSideRowModelModule',
    'sideBarModule',
    'filtersToolPanelModule',
    'columnsToolPanelModule',
  ];

  constructor() {
    super();
    this._initializeModulesMap();
    this._initializeComponentsMap();
  }

  async loadClientModules(
    options: MeLoadingModulesOptions,
    moduleNames: string[] = this.defaultModuleNames,
  ): Promise<Array<Module>> {
    return this.loadModules(options, moduleNames);
  }

  async loadClientComponents<T>(columnDefs: MeColDef<T>[]): Promise<Array<[string, Component]>> {
    const componentNames = this.getCommonComponentNames(columnDefs);
    return this.loadComponents(componentNames);
  }

  getFirstRowData(rowData: any): any {
    if (!rowData?.length) {
      return [];
    }

    const entity = rowData.find((row: any) => !!row);
    return entity;
  }

  getKeysOfRowData(entity: any): Array<string> {
    if (!entity) {
      return [];
    }
    return Object.keys(entity);
  }

  filterColDefKeys(allKeys: Array<string>, currentColDefs: Array<ColDef>): Array<string> {
    const existingFields = currentColDefs.map((colDef: ColDef) => colDef.field);
    const existingColIds = currentColDefs.map((colDef: ColDef) => colDef.colId);
    const existingKeysSet = new Set<string>([...existingFields, ...existingColIds]);
    const filteredNewKeys = allKeys.filter((k: string) => !existingKeysSet.has(k));
    return filteredNewKeys;
  }

  private _initializeModulesMap(): void {
    this.modulesMap = new Map<string, () => Promise<Module>>([
      ['clientSideRowModelModule', this._getClientSideRowModelModule],
      ['rowGroupingModule', this.getRowGroupingModule],
      ['sideBarModule', this.getSideBarModule],
      ['filtersToolPanelModule', this.getFiltersToolPanelModule],
      ['columnsToolPanelModule', this.getColumnsToolPanelModule],
      ['masterDetailModule', this.getMasterDetailModule],
    ]);
  }

  private _initializeComponentsMap(): void {
    this.componentsMap = new Map<string, () => Promise<[string, Component]>>([
      ['meAgCustomHeaderComponent', this.getMeAgCustomHeaderComponentEntry],
      ['meAgTextFilterComponent', this.getMeAgTextFilterComponentEntry],
      ['meAgNumberFilterComponent', this.getMeAgNumberFilterComponentEntry],
      ['meAgUserAutocompleteFilterComponent', this.getMeAgUserAutocompleteFilterComponentEntry],
      ['meAgDateFilterComponent', this.getMeAgDateFilterComponentEntry],
      ['meAgSelectFilterComponent', this.getMeAgSelectFilterComponentEntry],
      ['meAgTemplateRendererComponent', this.getMeAgTemplateRendererComponentEntry],
      ['meAgActionsCellComponent', this.getMeAgActionsCellComponentEntry],
      ['meAgMultiChipsFilterComponent', this.getMeAgMultiChipsFilterComponentEntry],
    ]);
  }

  private async _getClientSideRowModelModule(): Promise<Module> {
    const {ClientSideRowModelModule} = await import('@ag-grid-community/client-side-row-model');
    return ClientSideRowModelModule;
  }
}
