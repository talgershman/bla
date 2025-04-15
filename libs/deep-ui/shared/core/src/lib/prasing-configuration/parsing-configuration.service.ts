import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {DuplicateResponse, ValidationResponse} from 'deep-ui/shared/common';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import _sortedUniq from 'lodash-es/sortedUniq';
import _uniq from 'lodash-es/uniq';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class ParsingConfigurationService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private snackbar = inject(MeSnackbarService);

  private readonly baseUrl = this.urlBuilder.probeBuilderApiBuilder('etls/parsing-configurations/');
  private readonly agGridBaseUrl = this.urlBuilder.probeBuilderApiBuilder(
    'etls/parsing-configurations/ag-grid/',
  );

  getSingle(id: number, params: any = {}): Observable<ParsingConfiguration> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.get<ParsingConfiguration>(url);
  }

  getLeanMulti(params: any = {}): Observable<Array<ParsingConfiguration>> {
    const nextParmas = {
      ...(params || {}),
      lean: true,
    };
    const url = this.urlBuilder.join(this.baseUrl, nextParmas);
    return this.httpClient.get<Array<ParsingConfiguration>>(url);
  }

  create(body: any, params: any = {}): Observable<ParsingConfiguration> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.post<ParsingConfiguration>(url, body).pipe(
      tap(() => {
        this.snackbar.onCreate(body.name);
      }),
    );
  }

  delete(id: string, name: string): Observable<ParsingConfiguration> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    return this.httpClient.delete<ParsingConfiguration>(url).pipe(
      tap(() => {
        this.snackbar.onDelete(name);
      }),
    );
  }

  getAgGridMulti(request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    return this.httpClient.post<LoadSuccessParams>(
      this.agGridBaseUrl,
      getMeServerSideGetRowsRequest(request),
    );
  }

  getFolders(configs: ParsingConfiguration[]): string[] {
    const folders = (configs || []).map((config: ParsingConfiguration) => config.folder);
    return _uniq(_sortedUniq(folders));
  }

  checkDuplicateName(name: string, folder: string, id: string): Observable<DuplicateResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}validate-name/`, {
      name,
      folder,
      id,
    });

    return this.httpClient.get<DuplicateResponse>(endPoint);
  }

  checkConfig(configJson: any): Observable<ValidationResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}validate/`);
    const config = {
      ...configJson,
    };
    return this.httpClient.post<ValidationResponse>(endPoint, {
      config,
    });
  }
}
