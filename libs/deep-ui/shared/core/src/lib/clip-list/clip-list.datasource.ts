import {
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  LoadSuccessParams,
  SortModelItem,
} from '@ag-grid-community/core';
import {MeServerSideDataSourceDirective} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {ClipList} from 'deep-ui/shared/models';
import {of, takeUntil} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {ClipListService} from './clip-list.service';

export class ClipListDatasource extends MeServerSideDataSourceDirective {
  private readonly secondSortCol: string = 'createdAt';

  constructor(
    private clipListService: ClipListService,
    secondSortCol?: string,
  ) {
    super();
    if (secondSortCol) {
      this.secondSortCol = secondSortCol;
    }
  }

  getRows(params: IServerSideGetRowsParams): void {
    this._fetchRows(params);
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _fetchRows(params: IServerSideGetRowsParams<ClipList>): void {
    const req: IServerSideGetRowsRequest = {...params.request};
    if (
      req.sortModel.length < 2 &&
      req.sortModel.findIndex((m: SortModelItem) => m.colId === this.secondSortCol) === -1
    ) {
      req.sortModel.push({
        sort: 'desc',
        colId: this.secondSortCol,
      });
    }

    const request = this.serializeRequest(params, req);
    this.clipListService
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
        this.dataLoadedLevel.next(0);
      });
  }
}
