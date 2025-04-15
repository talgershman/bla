import {Module} from '@ag-grid-community/core';
import {Component, Injectable} from '@angular/core';
import {
  MeColDef,
  MeLoadingModulesOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {BaseTableService} from '@mobileye/material/src/lib/components/ag-table/services';

@Injectable()
export class MeServerSideTableService extends BaseTableService {
  private defaultModuleNames = [
    'serverSideRowModelModule',
    'sideBarModule',
    'filtersToolPanelModule',
    'columnsToolPanelModule',
  ];

  constructor() {
    super();
    this._initializeModulesMap();
    this._initializeComponentsMap();
  }

  async loadServerModules(
    options: MeLoadingModulesOptions,
    moduleNames: string[] = this.defaultModuleNames,
  ): Promise<Array<Module>> {
    return this.loadModules(options, moduleNames);
  }

  async loadServerComponents<T>(columnDefs: MeColDef<T>[]): Promise<Array<[string, Component]>> {
    const componentNames = this.getCommonComponentNames(columnDefs);
    return this.loadComponents(componentNames);
  }

  private _initializeModulesMap(): void {
    this.modulesMap = new Map<string, () => Promise<Module>>([
      ['serverSideRowModelModule', this._getServerSideRowModelModule],
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

  private async _getServerSideRowModelModule(): Promise<Module> {
    const {ServerSideRowModelModule} = await import('@ag-grid-enterprise/server-side-row-model');
    return ServerSideRowModelModule;
  }
}
