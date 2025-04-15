import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {Observable} from 'rxjs';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class AgDatasourceService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private readonly baseUrl = this.urlBuilder.datasetBuilderV2ApiBuilder('datasources/');

  getMulti(dataType: string, request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    const url = this.urlBuilder.join(this.baseUrl, {dataType});
    return this.httpClient.post<LoadSuccessParams>(url, getMeServerSideGetRowsRequest(request));
  }
}
