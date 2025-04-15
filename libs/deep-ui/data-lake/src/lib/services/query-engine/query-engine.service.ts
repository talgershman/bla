import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {UrlBuilderService} from 'deep-ui/shared/core';
import {SubQuery} from 'deep-ui/shared/models';
import {Observable, of} from 'rxjs';

export type ValidateQueryJsonResponseItem = {
  index: number; //invalid index
  error: string; // the error string
};

export interface ValidateQueryJsonResponse {
  invalid: Array<ValidateQueryJsonResponseItem>;
}

@Injectable({
  providedIn: 'root',
})
export class QueryEngineService {
  private urlBuilder = inject(UrlBuilderService);
  private downloaderService = inject(MeDownloaderService);
  private httpClient = inject(HttpClient);
  private snackbar = inject(MeSnackbarService);

  async downloadClipList(noUrlObjects: boolean, tableName: string): Promise<File | null> {
    if (!noUrlObjects) {
      this.snackbar.onDownloadStarted();
    }
    const url = this.urlBuilder.queryEngineApiBuilder('download-clip-list/', {tableName});

    return await this.downloaderService.downloadFileWithAuth(url, true, '', null, noUrlObjects);
  }

  asyncValidationForQueryJson(queryJson: Array<SubQuery>): Observable<ValidateQueryJsonResponse> {
    if (!queryJson.length) {
      return of(null);
    }
    const url = this.urlBuilder.queryEngineApiBuilder('validate-query/');

    return this.httpClient.post<ValidateQueryJsonResponse>(url, {
      queryJson,
    });
  }
}
