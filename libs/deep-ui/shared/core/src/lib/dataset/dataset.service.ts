import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {ignoreHttpErrorNoResponse} from '@mobileye/material/src/lib/http/http-error';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {Dataset} from 'deep-ui/shared/models';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class DatasetService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private downloaderService = inject(MeDownloaderService);
  private snackbar = inject(MeSnackbarService);

  private readonly baseUrl = this.urlBuilder.datasetBuilderApiBuilder('datasets/');
  private readonly agGridBaseUrl = this.urlBuilder.datasetBuilderApiBuilder('datasets/ag-grid/');

  getSingle(id: string, params: any = {}): Observable<Dataset> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.get<Dataset>(url);
  }

  getMulti(params: any = {}): Observable<Dataset[]> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.get<Dataset[]>(url, {
      context: ignoreHttpErrorNoResponse(),
    });
  }

  create(body: Dataset, params: any = {}): Observable<Dataset> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.post<Dataset>(url, body).pipe(
      tap(() => {
        this.snackbar.onCreate(body.name);
      }),
    );
  }

  update(id: number, body: Dataset, params: any = {}): Observable<Dataset> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.patch<Dataset>(url, body).pipe(
      tap(() => {
        this.snackbar.onUpdate(body.name);
      }),
    );
  }

  delete(id: number, name: string): Observable<Dataset> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    return this.httpClient.delete<Dataset>(url).pipe(
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

  checkDuplicateName(name: string, team: string, id: number): Observable<DuplicateResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}validate-name/`, {
      name,
      team,
      id,
    });

    return this.httpClient.get<DuplicateResponse>(endPoint);
  }

  async downloadJumpFile(dataset: Dataset, gap: number): Promise<void> {
    this.snackbar.onDownloadStarted();
    const url = this.urlBuilder.datasetBuilderApiBuilder('download-jump-file/', {
      id: dataset.id,
      gap,
    });
    await this.downloaderService.downloadFileWithAuth(url, false);
  }

  async downloadClipList(dataset: Dataset): Promise<void> {
    this.snackbar.onDownloadStarted();
    const url = this.urlBuilder.datasetBuilderApiBuilder('download-clip-list/', {id: dataset.id});
    await this.downloaderService.downloadFileWithAuth(url, true);
  }
}
