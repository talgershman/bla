import {
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  LoadSuccessParams,
  SortModelItem,
} from '@ag-grid-community/core';
import {MeServerSideDataSourceDirective} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {ETL} from 'deep-ui/shared/models';
import {of, takeUntil} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {EtlService} from './etl.service';

export class EtlDatasource extends MeServerSideDataSourceDirective {
  constructor(private etlService: EtlService) {
    super();
  }

  getRows(params: IServerSideGetRowsParams): void {
    this._fetchRows(params);
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _fetchRows(params: IServerSideGetRowsParams<ETL>): void {
    const req: IServerSideGetRowsRequest = {...params.request};
    if (
      req.sortModel.length < 2 &&
      req.sortModel.findIndex((m: SortModelItem) => m.colId === 'modifiedAt') === -1
    ) {
      req.sortModel.push({
        sort: 'desc',
        colId: 'modifiedAt',
      });
    }

    const request = this.serializeRequest(params, req);
    const level: number = request.groupKeys?.length ?? 0;
    this.etlService
      .getAgGridMulti(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError((_) => {
          params.fail();
          return of();
        })
      )
      .subscribe((result: LoadSuccessParams) => {
        params.success(result);
        this.dataLoadedLevel.next(level);
      });
  }
}
