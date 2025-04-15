import {
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  LoadSuccessParams,
  SortModelItem,
} from '@ag-grid-community/core';
import {MeServerSideDataSourceDirective} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {AgDatasourceService} from 'deep-ui/shared/core';
import {of} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';

export class AgDataSourceDatasource<T> extends MeServerSideDataSourceDirective {
  constructor(
    private agDatasourceService: AgDatasourceService,
    private dataType: string,
  ) {
    super();
  }

  getRows(params: IServerSideGetRowsParams): void {
    this._fetchRows(params);
  }

  private _fetchRows(params: IServerSideGetRowsParams<T>): void {
    const req: IServerSideGetRowsRequest = {...params.request};
    const level: number = req.groupKeys?.length ?? 0;
    if (
      req.sortModel.length < 2 &&
      req.sortModel.findIndex((m: SortModelItem) => m.colId === 'createdAt') === -1
    ) {
      req.sortModel.push({
        sort: 'desc',
        colId: 'createdAt',
      });
    }
    const request = this.serializeRequest(params, req);
    this.agDatasourceService
      .getMulti(this.dataType, request)
      .pipe(
        takeUntil(this.destroy$),
        catchError((_) => {
          params.fail();
          return of();
        }),
      )
      .subscribe((result: LoadSuccessParams) => {
        params.success(result);
        this.dataLoadedLevel.next(level);
      });
  }
}
