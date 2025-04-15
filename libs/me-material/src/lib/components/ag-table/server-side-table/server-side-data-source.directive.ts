import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
} from '@ag-grid-community/core';
import {Directive} from '@angular/core';
import {
  MeColDef,
  MULTI_FILTER_TYPES,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import _cloneDeep from 'lodash-es/cloneDeep';
import _find from 'lodash-es/find';
import {Subject} from 'rxjs';

@Directive()
export abstract class MeServerSideDataSourceDirective implements IServerSideDatasource {
  abstract getRows(params: IServerSideGetRowsParams): void;

  protected destroy$ = new Subject<void>();

  protected dataLoadedLevel: Subject<number> = new Subject<number>();

  dataLoadedLevel$ = this.dataLoadedLevel.asObservable();

  protected dataLoaded: Subject<any> = new Subject<any>();

  dataLoaded$ = this.dataLoaded.asObservable();

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  serializeRequest(
    params: IServerSideGetRowsParams<any>,
    req: IServerSideGetRowsRequest,
  ): IServerSideGetRowsRequest {
    const copyReq = _cloneDeep(req);
    this._handleFilters(copyReq, params);
    this._handleSort(copyReq, params);
    return copyReq;
  }

  private _handleFilters(
    copyReq: IServerSideGetRowsRequest,
    params: IServerSideGetRowsParams<any>,
  ): void {
    this._handleAliasFilters(copyReq, params);
    this._handleReplaceToFilterKey(copyReq, params);
    this._handleTwinFilters(params, copyReq);
  }

  private _handleSort(
    copyReq: IServerSideGetRowsRequest,
    params: IServerSideGetRowsParams<any>,
  ): void {
    this._handleReplaceToSortKey(copyReq, params);
  }

  private _handleAliasFilters(
    copyReq: IServerSideGetRowsRequest,
    params: IServerSideGetRowsParams<any>,
  ): void {
    for (const [key, value] of Object.entries(copyReq.filterModel || {})) {
      const filterModel = value as any;
      if (MULTI_FILTER_TYPES.includes(filterModel.type) && typeof filterModel.filter === 'string') {
        filterModel.filter = filterModel.filter.split(';');
      }
      const colDefs = params.api.getColumnDefs();
      const filterColDef: MeColDef<any> = this._getColDef(colDefs, key);
      if (filterColDef?.cellRendererParams?.aliasFor) {
        copyReq.filterModel[filterColDef?.cellRendererParams?.aliasFor] = filterModel;
        delete copyReq.filterModel[key];
      } else {
        copyReq.filterModel[key] = filterModel;
      }
    }
  }

  private _handleTwinFilters(
    params: IServerSideGetRowsParams<any>,
    copyReq: IServerSideGetRowsRequest,
  ): void {
    const colDef: Array<MeColDef<any>> = params.api.getColumnDefs() as Array<MeColDef<any>>;
    for (const col of colDef) {
      if (
        col?.cellRendererParams?.twin &&
        copyReq.filterModel[col.field] &&
        !copyReq.filterModel[col?.cellRendererParams?.twin]
      ) {
        const twinCofDef: MeColDef<any> = this._getColDef(colDef, col?.cellRendererParams?.twin);
        copyReq.filterModel[col?.cellRendererParams?.twin] = {
          type: twinCofDef.filterParams.filterOptions[0],
          filterType: copyReq.filterModel[col.field].filterType, // should be the same type as the twin
          filter: copyReq.filterModel[col.field].filter,
        };
      } else {
        delete copyReq.filterModel[col?.cellRendererParams?.twin];
      }
    }
  }

  private _handleReplaceToFilterKey(
    copyReq: IServerSideGetRowsRequest,
    params: IServerSideGetRowsParams<any>,
  ): void {
    for (const [key, value] of Object.entries(copyReq.filterModel || {})) {
      const filterModel = value as any;
      const colDefs = params.api.getColumnDefs();
      const filterColDef: MeColDef<any> = this._getColDef(colDefs, key, true);
      const cellRendererParams = filterColDef?.cellRendererParams;
      if (cellRendererParams?.replaceToFilterKey) {
        copyReq.filterModel[cellRendererParams?.replaceToFilterKey] = filterModel;
        delete copyReq.filterModel[key];
        delete copyReq.filterModel?.[cellRendererParams?.removeFilterKey];
      }
    }
  }

  private _handleReplaceToSortKey(
    copyReq: IServerSideGetRowsRequest,
    params: IServerSideGetRowsParams<any>,
  ) {
    for (const sortObject of copyReq.sortModel) {
      const key = sortObject.colId;
      const colDefs = params.api.getColumnDefs();
      const filterColDef: MeColDef<any> = this._getColDef(colDefs, key, true);
      const cellRendererParams = filterColDef?.cellRendererParams;
      if (cellRendererParams?.replaceToFilterKey) {
        sortObject.colId = cellRendererParams?.replaceToFilterKey;
      }
    }
  }

  private _getColDef(
    colDefs: Array<MeColDef<any>>,
    searchField: string,
    searchByColId?: boolean,
  ): MeColDef<any> {
    const fieldKey = searchByColId ? 'colId' : 'field';
    return _find(
      colDefs,
      (column: MeColDef<any>) => column[fieldKey] === searchField,
    ) as MeColDef<any>;
  }
}
