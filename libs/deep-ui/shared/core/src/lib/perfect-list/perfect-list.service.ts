import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {PerfectList} from 'deep-ui/shared/models';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

import {serializeFormDataRequest} from '../common/common';
import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class PerfectListService {
  private http = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private httpClient = inject(HttpClient);
  private snackbar = inject(MeSnackbarService);
  private downloaderService = inject(MeDownloaderService);

  private readonly baseUrl = this.urlBuilder.assetsManagerServiceApiBuilder('perfect-lists/');
  private readonly agGridBaseUrl =
    this.urlBuilder.assetsManagerServiceApiBuilder('perfect-lists/ag-grid/');

  getSingle(id: number, params: any = {}): Observable<PerfectList> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.get<PerfectList>(url);
  }

  getMulti(params: any = {}): Observable<Array<PerfectList>> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.get<Array<PerfectList>>(url);
  }

  create(
    perfectList: Partial<PerfectList>,
    name: string,
    params: any = {},
  ): Observable<PerfectList> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    const body = serializeFormDataRequest(perfectList);
    return this.httpClient.post<PerfectList>(url, body).pipe(
      tap(() => {
        this.snackbar.onCreate(name);
      }),
    );
  }

  update(
    id: number,
    name: string,
    perfectList: Partial<PerfectList>,
    params: any = {},
  ): Observable<PerfectList> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    const body = serializeFormDataRequest(perfectList);
    return this.httpClient.patch<PerfectList>(url, body).pipe(
      tap(() => {
        this.snackbar.onUpdate(name);
      }),
    );
  }

  delete(id: number, name: string): Observable<PerfectList> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    return this.httpClient.delete<PerfectList>(url).pipe(
      tap(() => {
        this.snackbar.onDelete(name);
      }),
    );
  }

  checkDuplicateName(
    name: string,
    technology: string,
    rawDataOwner: string,
    id: number,
  ): Observable<DuplicateResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}is-duplicate/`, {
      name,
      technology,
      rawDataOwner,
      id,
    });

    return this.http.get<DuplicateResponse>(endPoint);
  }

  syncPerfectList(id: number): Observable<unknown> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}${id}/sync/`);
    return this.http
      .post<unknown>(endPoint, {id})
      .pipe(tap(() => this.snackbar.open('Sync started')));
  }

  downloadPerfectList(perfectList: Partial<PerfectList>): void {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}${perfectList.id}/download/`);
    this.http
      .get<any>(endPoint)
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.snackbar.onDownloadStarted();
        }),
      )
      .subscribe((response) => {
        if (response?.url) {
          this.downloaderService.downloadFile(response.url);
        }
      });
  }

  getAgGridMulti(request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    return this.httpClient.post<LoadSuccessParams>(
      this.agGridBaseUrl,
      getMeServerSideGetRowsRequest(request),
    );
  }
}
