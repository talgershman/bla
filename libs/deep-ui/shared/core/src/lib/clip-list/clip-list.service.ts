import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {ClipList} from 'deep-ui/shared/models';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {serializeFormDataRequest} from '../common/common';
import {UrlBuilderService} from '../url-builder/url-builder.service';

export interface ClipListValidationResponse {
  overrideList: string[];
  overrideDataKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClipListService {
  private http = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private httpClient = inject(HttpClient);
  private snackbar = inject(MeSnackbarService);

  private readonly baseUrl = this.urlBuilder.assetsManagerServiceApiBuilder('clip-lists/');
  private readonly agGridBaseUrl =
    this.urlBuilder.assetsManagerServiceApiBuilder('clip-lists/ag-grid/');

  getSingle(id: number, params: any = {}): Observable<ClipList> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.get<ClipList>(url);
  }

  getMulti(params: any = {}): Observable<Array<ClipList>> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.get<Array<ClipList>>(url);
  }

  create(
    clipList: Partial<ClipList>,
    params: any = {},
  ): Observable<ClipList | ClipListValidationResponse> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    const body = serializeFormDataRequest(clipList);
    return this.httpClient.post<ClipList>(url, body).pipe(
      tap((response: any) => {
        this.snackbar.onCreate(response?.name);
      }),
    );
  }

  update(
    id: number,
    clipList: Partial<ClipList>,
    params: any = {},
  ): Observable<ClipList | ClipListValidationResponse> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    const body = serializeFormDataRequest(clipList);
    return this.httpClient.patch<ClipList>(url, body).pipe(
      tap((response: any) => {
        this.snackbar.onUpdate(response?.name);
      }),
    );
  }

  delete(id: number): Observable<ClipList> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    return this.httpClient.delete<ClipList>(url);
  }

  downloadClipList(clipList: Partial<ClipList>): Observable<{url: string}> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}${clipList.id}/download/`);
    return this.http.get<any>(endPoint);
  }

  checkDuplicateName(name: string, technology: string, id: number): Observable<DuplicateResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}is-duplicate/`, {
      name,
      technology,
      id,
    });
    return this.http.get<DuplicateResponse>(endPoint);
  }

  getAgGridMulti(request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    return this.httpClient.post<LoadSuccessParams>(
      this.agGridBaseUrl,
      getMeServerSideGetRowsRequest(request),
    );
  }
}
