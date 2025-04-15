import {
  ApplyColumnStateParams,
  ClientSideRowModelStep,
  Column,
  ColumnState,
  GridApi,
  GridReadyEvent,
  IColumnLimit,
  IRowNode,
  IServerSideDatasource,
  RefreshServerSideParams,
} from '@ag-grid-community/core';
import {ChangeDetectorRef, inject, Injectable} from '@angular/core';
import {
  MeAgContextService,
  MeGroupByItemDerived,
  MeModifiedColsChanges,
  MeModifiedColumnState,
  MeModifiedEventType,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import _isNil from 'lodash-es/isNil';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class MeAgTableApiService<T> implements MeAgContextService {
  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();
  readonly widthRange = 150;
  private minWidth = 0;
  private options: GridReadyEvent<T>;
  private gridApi: GridApi<T>;
  private openedRowGroupsRoutes: Array<string[]> = [];
  private readonly REFRESH_ROOT = 500;
  private cd = inject(ChangeDetectorRef);

  getOptions(): GridReadyEvent<T> {
    return this.options;
  }

  setOptions(options: GridReadyEvent<T>): void {
    this.options = options;
  }

  getGridApi(): GridApi<T> {
    return this.gridApi;
  }

  setGridApi(gridApi: GridApi<T>): void {
    this.gridApi = gridApi;
  }

  setMinWidth(minWidth: number): void {
    this.minWidth = minWidth;
  }

  initializeOpenedRowGroupsRoutes(): void {
    this.openedRowGroupsRoutes = [];
  }

  addRoute(rowNode: IRowNode): void {
    this.openedRowGroupsRoutes.push(rowNode.getRoute());
  }

  removeRoute(rowNode: IRowNode): void {
    const route = rowNode.getRoute().join(',');
    const foundRouteIndex = this.openedRowGroupsRoutes.findIndex(
      (r: string[]) => route === r.join(','),
    );
    if (foundRouteIndex === -1) {
      return;
    }
    this.openedRowGroupsRoutes.splice(foundRouteIndex, 1);
  }

  refreshServerSideData(params?: RefreshServerSideParams, showLoading?: boolean): void {
    const routes = this.openedRowGroupsRoutes;
    if (routes.length) {
      routes.forEach((route: Array<string>) => {
        this.gridApi.refreshServerSide({
          purge: params?.purge,
          route,
        });
      });
    }
    this.gridApi.refreshServerSide(params);
    if (showLoading) {
      this.isLoading.next(true);
    }
  }

  refreshClientSideData(step?: ClientSideRowModelStep): void {
    this.gridApi.refreshClientSideRowModel(step);
  }

  setFilterModel(externalFilterModel: Record<string, any>, filterToRemove?: string[]): void {
    const updatedModel = {...this.gridApi.getFilterModel(), ...externalFilterModel};
    if (filterToRemove?.length) {
      for (const key of filterToRemove) {
        delete updatedModel[key];
      }
    }
    this.gridApi.setFilterModel(updatedModel);
  }

  setServerSideDatasource(datasource: IServerSideDatasource): void {
    this.gridApi.updateGridOptions({serverSideDatasource: datasource});
    this.isLoading.next(true);
  }

  compareModifiedDisplayedColumns(
    tableId: string,
    newState: Record<string, MeModifiedColumnState>,
    oldState: Record<string, MeModifiedColumnState>,
  ): MeModifiedColsChanges {
    const added: Array<string> = [];
    const removed: Array<string> = [];
    for (const key in newState) {
      if (!oldState[key]) {
        added.push(key);
      }
    }
    for (const key in oldState) {
      if (!newState[key]) {
        removed.push(key);
      }
    }
    return {
      tableId,
      added,
      removed,
    };
  }

  areColumnStatesSimilar(stateA: ColumnState, stateB: ColumnState): boolean {
    return !!stateA.hide === !!stateB.hide && stateA.pinned === stateB.pinned;
  }

  clearUnavailableColIdsFromModifiedDisplayedColumns(
    current: Array<ColumnState>,
    modifiedDisplayedColumns: Record<string, MeModifiedColumnState>,
  ): Record<string, MeModifiedColumnState> {
    const updatedModifiedDisplayedColumns = {...modifiedDisplayedColumns};
    const currentColIds = new Set(current.map((c: ColumnState) => c.colId));
    for (const key in modifiedDisplayedColumns) {
      if (!currentColIds.has(key)) {
        delete updatedModifiedDisplayedColumns[key];
      } else if (!updatedModifiedDisplayedColumns[key].visible) {
        updatedModifiedDisplayedColumns[key].pinned = null;
        updatedModifiedDisplayedColumns[key].index = null;
      }
    }
    return updatedModifiedDisplayedColumns;
  }

  clearUnavailableColIdsFromResolutions(
    current: Array<ColumnState>,
    resolutions: Record<string, Record<string, number>>,
  ): Record<string, Record<string, number>> {
    const updatedResolutions = {...resolutions};
    const currentColIds = new Set(current.map((c: ColumnState) => c.colId));
    for (const key in updatedResolutions) {
      for (const colId in updatedResolutions[key]) {
        if (!currentColIds.has(colId)) {
          delete updatedResolutions[key][colId];
        }
      }
      if (!Object.keys(updatedResolutions[key]).length) {
        delete updatedResolutions[key];
      }
    }
    return updatedResolutions;
  }

  getUpdatedModifiedDisplayedColumns(
    current: Array<ColumnState>,
    defaultColumnState: Array<ColumnState>,
    oldModifiedDisplayedColumns: Record<string, MeModifiedColumnState>,
    columns: Array<Column>,
    eventType: MeModifiedEventType,
  ): Record<string, MeModifiedColumnState> {
    const modifiedDisplayedColumns = {...oldModifiedDisplayedColumns};
    for (const key in modifiedDisplayedColumns) {
      const index = current.findIndex((c: ColumnState) => c.colId === key);
      if (index === -1) {
        delete modifiedDisplayedColumns[key];
      } else if (!_isNil(modifiedDisplayedColumns[key].index)) {
        modifiedDisplayedColumns[key].index = index;
      }
    }
    for (const column of columns) {
      const colId = column.getColId();
      if (modifiedDisplayedColumns[colId]) {
        if (eventType === MeModifiedEventType.Column_VISIBLE) {
          const isVisible = column.isVisible();
          if (isVisible) {
            modifiedDisplayedColumns[colId] = {
              pinned: column.getPinned() as Pick<ColumnState, 'pinned'>,
              visible: true,
              index: current.findIndex((c) => c.colId === colId),
            };
          } else {
            modifiedDisplayedColumns[colId] = {
              pinned: null,
              visible: false,
              index: null,
            };
          }
        } else if (eventType === MeModifiedEventType.Column_PINNED) {
          modifiedDisplayedColumns[colId].pinned = column.getPinned() as Pick<
            ColumnState,
            'pinned'
          >;
        } else if (eventType === MeModifiedEventType.Column_MOVED) {
          modifiedDisplayedColumns[colId].index = current.findIndex((c) => c.colId === colId);
        }
      } else {
        modifiedDisplayedColumns[colId] = {
          pinned: column.getPinned() as Pick<ColumnState, 'pinned'>,
          visible: column.isVisible(),
          index: current.findIndex((c) => c.colId === colId),
        };
      }
    }
    for (const key in modifiedDisplayedColumns) {
      const currentStateIndex = current.findIndex((c) => c.colId === key);
      const defaultStateIndex = defaultColumnState.findIndex((c: ColumnState) => c.colId === key);
      if (
        defaultStateIndex === currentStateIndex &&
        this.areColumnStatesSimilar(
          current[currentStateIndex],
          defaultColumnState[defaultStateIndex],
        )
      ) {
        delete modifiedDisplayedColumns[key];
      }
    }
    return modifiedDisplayedColumns;
  }

  getActiveModifiedDisplayedColumns(
    current: Array<ColumnState>,
    defaultState: Array<ColumnState>,
  ): Record<string, MeModifiedColumnState> {
    const modifiedDisplayedColumns = {};
    current.forEach((s: ColumnState, i: number) => {
      const foundIndex = defaultState.findIndex((c: ColumnState) => c.colId === s.colId);
      if (foundIndex > -1) {
        if (foundIndex !== i || !this.areColumnStatesSimilar(s, defaultState[foundIndex])) {
          modifiedDisplayedColumns[s.colId] = {
            pinned: s.pinned,
            visible: !s.hide,
            index: i,
          };
        }
      }
    });
    return modifiedDisplayedColumns;
  }

  getTableResolutionData(
    columnState: Array<ColumnState>,
    oldResolutions: Record<string, Record<string, number>>,
    gridWidth: number,
    preserveOldResolution?: boolean,
  ): [Record<string, Record<string, number>>, boolean] {
    const resolutions = {...(oldResolutions || {})};
    const resolutionKey = this.getResolutionKey(gridWidth, resolutions) || gridWidth.toString();
    const oldResolution = oldResolutions[resolutionKey];
    resolutions[resolutionKey] = preserveOldResolution ? {...(oldResolution || {})} : {};
    columnState.forEach((s: ColumnState) => {
      resolutions[resolutionKey][s.colId] = s.width; // update the width of the column in the correct resolution record
    });
    const isResolutionValuesChanged = this.getIsResolutionValuesChanged(
      resolutions,
      oldResolution,
      resolutionKey,
    );
    return [resolutions, isResolutionValuesChanged];
  }

  getIsResolutionValuesChanged(
    resolutions: Record<string, Record<string, number>>,
    oldResolution: Record<string, number>,
    resolutionKey: string,
  ): boolean {
    if (!oldResolution) {
      return true;
    } else {
      for (const key in resolutions[resolutionKey]) {
        if (resolutions[resolutionKey][key] !== oldResolution[key]) {
          return true;
        }
      }
      return false;
    }
  }

  updateColumnStateGroupByColumns(
    columnState: Array<ColumnState>,
    groupByItem: MeGroupByItemDerived,
    allGroupByColIdsAndFields: Array<string>,
  ): void {
    if (!groupByItem || !allGroupByColIdsAndFields?.length) {
      return;
    }
    for (const id of allGroupByColIdsAndFields) {
      const colState = columnState.find((c: ColumnState) => c.colId === id);
      if (!colState) {
        continue;
      }
      colState.rowGroup = false;
      colState.rowGroupIndex = undefined;
    }
    for (const [index, group] of groupByItem.groups.entries()) {
      const groupColState = columnState.find((c: ColumnState) => c.colId === group.colId);
      if (!groupColState) {
        return;
      }
      groupColState.rowGroup = true;
      groupColState.rowGroupIndex = index;
    }
  }

  getColumnStateByModifiedDisplayedColumns(
    current: Array<ColumnState>,
    modifiedDisplayedColumns: Record<string, MeModifiedColumnState>,
    ignoredModifiedColIds: Set<string>,
  ): Array<ColumnState> {
    const modifiedColumnStates = new Array(current.length).fill(null);
    const modifiedIds = new Set();
    const hiddenColIds = new Set();
    for (const [modifiedKey, modified] of Object.entries(modifiedDisplayedColumns)) {
      const selectedCurrentState = current.find((c: ColumnState) => c.colId === modifiedKey);
      if (
        selectedCurrentState &&
        !ignoredModifiedColIds.has(modifiedKey) &&
        !_isNil(modified.index) &&
        modified.index < current.length
      ) {
        modifiedColumnStates[modified.index] = {
          ...selectedCurrentState,
          pinned: modified.pinned,
          hide: !modified.visible,
        };
        modifiedIds.add(modifiedKey);
      } else if (
        selectedCurrentState &&
        !ignoredModifiedColIds.has(modifiedKey) &&
        _isNil(modified.index)
      ) {
        hiddenColIds.add(modifiedKey);
      }
    }
    const unmodifiedCurrent = current.filter((c: ColumnState) => !modifiedIds.has(c.colId));
    for (let i = 0; i < current.length; i++) {
      if (modifiedColumnStates[i]) {
        continue;
      }
      modifiedColumnStates[i] = unmodifiedCurrent.shift();
      if (hiddenColIds.has(modifiedColumnStates[i].colId)) {
        modifiedColumnStates[i].hide = true;
      }
    }
    return modifiedColumnStates;
  }

  getChangedColumnStatesByWidth(
    prev: Array<ColumnState>,
    current: Array<ColumnState>,
  ): Array<ColumnState> {
    return current.filter((s: ColumnState, i: number) => {
      return prev[i]?.colId === s.colId && !prev[i].hide && !s.hide && prev[i].width !== s.width;
    });
  }

  getResolutionKeysAsIntegers(resolutions: Record<string, Record<string, number>>): Array<number> {
    return Object.keys(resolutions).map((key: string) => parseInt(key, 10));
  }

  getResolution(
    gridWidth: number,
    resolutions: Record<string, Record<string, number>>,
  ): Record<string, number> {
    const keys: Array<number> = this.getResolutionKeysAsIntegers(resolutions);
    if (!keys.length) {
      return null;
    }
    const foundKeyIndex: number = keys.findIndex(
      (key: number) => Math.abs(key - gridWidth) < this.widthRange,
    );
    if (foundKeyIndex === -1) {
      return null;
    }
    return resolutions[keys[foundKeyIndex]];
  }

  getResolutionKey(gridWidth: number, resolutions: Record<string, Record<string, number>>): string {
    const keys: Array<number> = this.getResolutionKeysAsIntegers(resolutions);
    if (!keys.length) {
      return null;
    }
    const foundKeyIndex: number = keys.findIndex(
      (key: number) => Math.abs(key - gridWidth) < this.widthRange,
    );
    if (foundKeyIndex === -1) {
      return null;
    }
    return keys[foundKeyIndex].toString();
  }

  getsSuppressSizeToFitColLimits(displayedColumns: Array<Column>): Array<IColumnLimit> {
    return displayedColumns
      .filter((col) => {
        const colDef = col.getColDef();
        return !colDef.flex && colDef.suppressSizeToFit && colDef.width;
      })
      .map((c) => {
        const colDef = c.getColDef();
        return {
          key: c,
          minWidth: colDef.width,
          maxWidth: colDef.width,
        };
      });
  }

  getFlexWidthsData(
    gridWidth: number,
    onFit?: boolean,
  ): {
    flexColumns: Array<Column>;
    originalWidths: Array<number>;
  } {
    const displayedColumns = this.gridApi?.getAllDisplayedColumns();
    if (!displayedColumns || !displayedColumns.length) {
      return null;
    }
    const totalNonFlexWidth = displayedColumns.reduce((acc, column) => {
      return acc + (column.getColDef().flex ? column.getActualWidth() : 0);
    }, 0);
    const flexColumns = displayedColumns.filter((col) => col.isVisible() && col.getColDef().flex);
    const totalFlexValues = flexColumns.reduce((acc, column) => {
      return acc + (column.getFlex() || column.getColDef().flex || 1);
    }, 0);
    const originalWidths = flexColumns.map((col) => {
      if (col.getColDef().width) {
        return col.getColDef().width;
      }
      return col.getMaxWidth() < gridWidth / 2
        ? col.getMaxWidth()
        : Math.min(
            Math.max(
              150,
              Math.abs(
                Math.floor((col.getFlex() * gridWidth) / totalFlexValues - totalNonFlexWidth),
              ),
            ),
            gridWidth / 2,
          );
    });
    return {
      flexColumns: onFit ? [] : flexColumns,
      originalWidths: onFit ? [] : originalWidths,
    };
  }

  sizeColumnsToFitSafe(
    gridWidth: number,
    resolution?: Record<string, number>,
    onFit?: boolean,
  ): void {
    if (!globalThis?.jasmine) {
      const displayedColumns = this.gridApi?.getAllDisplayedColumns();
      if (displayedColumns.some((col) => col.isVisible())) {
        // Store original widths of flex columns
        const {flexColumns, originalWidths} = this.getFlexWidthsData(gridWidth, onFit);
        const flexColumnLimits: Array<IColumnLimit> = flexColumns.map(
          (col: Column, index: number) => ({
            key: col,
            minWidth: originalWidths[index],
            maxWidth: originalWidths[index],
          }),
        );
        const suppressSizeToFitColumnLimits: Array<IColumnLimit> =
          this.getsSuppressSizeToFitColLimits(displayedColumns);
        const autoGroup: Column = displayedColumns.find(
          (col) => col.getColId() === 'ag-Grid-AutoColumn',
        );
        const autoGroupWidth = autoGroup?.getColDef()?.width;
        const autoGroupColumnLimit: Array<IColumnLimit> =
          !autoGroupWidth || resolution?.['ag-Grid-AutoColumn'] || onFit
            ? []
            : [
                {
                  key: autoGroup,
                  minWidth: autoGroupWidth,
                  maxWidth: autoGroupWidth,
                },
              ];
        const columnLimits = [
          ...flexColumnLimits,
          ...suppressSizeToFitColumnLimits,
          ...autoGroupColumnLimit,
        ];
        const ignored = {};
        for (const limit of columnLimits) {
          ignored[(limit.key as Column).getColId()] = limit.maxWidth;
        }
        this.evenlyResizeColumns(displayedColumns, gridWidth, resolution || {}, ignored);
        this.cd.detectChanges();
      }
    }
  }

  evenlyResizeColumns(
    displayedColumns: Array<Column>,
    gridWidth: number,
    resolutionObj: Record<string, number>,
    ignored: Record<string, number>,
  ): void {
    const ignoredColIds = new Set(Object.keys(ignored));
    const current = this.gridApi.getColumnState();
    const ignoredCols = current.filter(
      (col: ColumnState) => ignoredColIds.has(col.colId) && !col.hide,
    );
    const ignoredWidths: Array<number> = ignoredCols.map((c) => ignored[c.colId]);
    const ignoredTotalWidth: number = ignoredWidths.reduce(
      (acc: number, width: number) => acc + width,
      0,
    );
    const resolution = {...resolutionObj};
    const displayedColIds = new Set(displayedColumns.map((col) => col.getColId()));
    for (const key in resolution) {
      if (!displayedColIds.has(key)) {
        delete resolution[key];
      }
    }
    const totalModifiedWidth = Object.values(resolution).reduce(
      (acc: number, width: number) => acc + width,
      ignoredTotalWidth,
    );
    let totalRestOfTableWidth = gridWidth - totalModifiedWidth;
    let numOfDynamicColumns =
      displayedColumns.length - ignoredWidths.length - Object.keys(resolution).length;
    let dynamicColumnWidth = Math.floor(totalRestOfTableWidth / numOfDynamicColumns);
    const displayedDynamicColumns = displayedColumns.filter(
      (col) => col.isVisible() && !ignoredColIds.has(col.getColId()) && !resolution[col.getColId()],
    );
    const minWidthsColumns = displayedDynamicColumns.filter(
      (col) => col.getMinWidth() > dynamicColumnWidth,
    );
    const maxWidthsColumns = displayedDynamicColumns.filter(
      (col) => col.getMaxWidth() < dynamicColumnWidth,
    );
    totalRestOfTableWidth =
      totalRestOfTableWidth -
      minWidthsColumns.reduce((acc, col) => acc + col.getMinWidth(), 0) -
      maxWidthsColumns.reduce((acc, col) => acc + col.getMaxWidth(), 0);
    numOfDynamicColumns = numOfDynamicColumns - minWidthsColumns.length - maxWidthsColumns.length;
    dynamicColumnWidth = Math.max(
      Math.floor(totalRestOfTableWidth / numOfDynamicColumns),
      this.minWidth,
    );
    const minWidthsIds = new Set(minWidthsColumns.map((col) => col.getColId()));
    const maxWidthsIds = new Set(maxWidthsColumns.map((col) => col.getColId()));
    const result: ApplyColumnStateParams = {state: [], applyOrder: true};
    current.forEach((col) => {
      if (col.hide) {
        result.state.push({...col});
      } else if (ignoredColIds.has(col.colId)) {
        result.state.push({...col, width: ignored[col.colId]});
      } else if (minWidthsIds.has(col.colId)) {
        result.state.push({
          ...col,
          width: minWidthsColumns.find((c) => c.getColId() === col.colId).getMinWidth(),
        });
      } else if (maxWidthsIds.has(col.colId)) {
        result.state.push({
          ...col,
          width: maxWidthsColumns.find((c) => c.getColId() === col.colId).getMaxWidth(),
        });
      } else if (!resolution[col.colId]) {
        result.state.push({...col, width: dynamicColumnWidth});
      } else {
        result.state.push({...col, width: resolution[col.colId]});
      }
    });
    this.gridApi.applyColumnState(result);
  }

  hideOverlay(): void {
    try {
      this.gridApi?.setGridOption('loading', false);
      // eslint-disable-next-line
    } catch (e) {
      console.warn(e);
    }
  }
}
