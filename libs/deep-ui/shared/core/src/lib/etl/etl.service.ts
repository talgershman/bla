import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {ignoreHttpErrorResponse} from '@mobileye/material/src/lib/http/http-error';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {
  ETL,
  EtlDagService,
  EtlName,
  EtlServiceName,
  EtlServiceTypes,
  EtlTypeEnum,
} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import {Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class EtlService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private snackbar = inject(MeSnackbarService);

  private readonly baseUrl = this.urlBuilder.probeBuilderApiBuilder('etls/');
  private readonly agGridBaseUrl = this.urlBuilder.probeBuilderApiBuilder('etls/ag-grid/');

  getSingle(id: number, params: any = {}): Observable<ETL> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.get<ETL>(url);
  }

  getMulti(type: EtlTypeEnum, params: any = {}): Observable<Array<ETL>> {
    const queryParams = {
      ...params,
    };
    if (type) {
      queryParams.type = type;
    }
    const url = this.urlBuilder.join(this.baseUrl, queryParams);
    return this.httpClient.get<Array<ETL>>(url).pipe(
      map((etls: Array<ETL>) => {
        return _filter(etls, (etl: ETL) => etl.status !== 'ARCHIVED');
      }),
    );
  }

  create(body: ETL, params: any = {}): Observable<ETL> {
    const url = this.urlBuilder.join(`${this.baseUrl}`, params);
    return this.httpClient.post<ETL>(url, body).pipe(
      tap(() => {
        this.snackbar.onCreate(body.name);
      }),
    );
  }

  update(id: number, body: any, params: any = {}): Observable<ETL> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.put<ETL>(url, body).pipe(
      tap(() => {
        this.snackbar.onUpdate(body.name);
      }),
    );
  }

  delete(id: string, name: string): Observable<ETL> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    const body = {
      status: 'ARCHIVED',
    };
    return this.httpClient.patch<ETL>(url, body).pipe(
      tap(() => {
        this.snackbar.onDelete(name);
      }),
    );
  }

  getServices(
    params: {name?: string; type?: EtlServiceTypes} = {},
  ): Observable<Array<EtlDagService>> {
    if (!params?.name) {
      return of([]);
    }
    const url = this.urlBuilder.join(`${this.baseUrl}services/`, params);
    return this.httpClient.get<Array<EtlDagService>>(url);
  }

  getService(id: number, ignoreError?: boolean): Observable<EtlDagService> {
    const options = ignoreError ? {context: ignoreHttpErrorResponse()} : undefined;
    const url = this.urlBuilder.join(`${this.baseUrl}services/${id}/`);
    return this.httpClient.get<EtlDagService>(url, options);
  }

  extractEtlParams(etl: ETL): any {
    const result = {};
    Object.keys(etl.services).forEach((key) => {
      this._addServiceParamsToExtractObject(etl, key, result);
    });
    return result;
  }

  checkDuplicateName(name: string): Observable<DuplicateResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}validate-probe-name-unique/`, {name});

    return this.httpClient.get<DuplicateResponse>(endPoint);
  }

  getEtlNames(params: {name?: string; type?: EtlTypeEnum} = {}): Observable<EtlName[]> {
    const url = this.urlBuilder.join(`${this.baseUrl}names/`, params);
    return this.httpClient.get<EtlName[]>(url).pipe(
      catchError((_) => of([])),
      map((etls: Array<EtlName>) => {
        return _filter(etls, (etl: EtlName) => etl.status !== 'ARCHIVED');
      }),
    );
  }

  getServiceNames(
    params: {name?: string; type?: EtlServiceTypes} = {},
  ): Observable<EtlServiceName[]> {
    const url = this.urlBuilder.join(`${this.baseUrl}services/names/`, params);
    return this.httpClient.get<EtlServiceName[]>(url);
  }

  getAgGridMulti(request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    return this.httpClient.post<LoadSuccessParams>(
      this.agGridBaseUrl,
      getMeServerSideGetRowsRequest(request),
    );
  }
  private _addServiceParamsToExtractObject(etl: ETL, key: string, result: any): void {
    const service = etl.services[key];
    let config;
    if (service.type === EtlTypeEnum.PERFECT_TRANSFORM) {
      config = etl.services[key].configuration?.params;
    } else {
      config = etl.services[key].configuration;
    }
    const serviceKey = etl.services[key].name;
    result[serviceKey] = {
      ...config,
    };
  }
}
