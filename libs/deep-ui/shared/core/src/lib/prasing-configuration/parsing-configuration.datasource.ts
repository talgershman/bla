import {
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  LoadSuccessParams,
} from '@ag-grid-community/core';
import {MeServerSideDataSourceDirective} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {ETL} from 'deep-ui/shared/models';
import {of, takeUntil} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {ParsingConfigurationService} from './parsing-configuration.service';

export class ParsingConfigurationDatasource extends MeServerSideDataSourceDirective {
  constructor(private parsingConfigurationService: ParsingConfigurationService) {
    super();
  }
  getRows(params: IServerSideGetRowsParams): void {
    this._fetchRows(params);
  }

  private _fetchRows(params: IServerSideGetRowsParams<ETL>): void {
    const req: IServerSideGetRowsRequest = {...params.request};

    const request = this.serializeRequest(params, req);
    const level: number = request.groupKeys?.length ?? 0;
    this.parsingConfigurationService
      .getAgGridMulti(request)
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
