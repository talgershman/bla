import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {ApiErrorResponse} from 'deep-ui/shared/common';
import {Observable} from 'rxjs';

import {UrlBuilderService} from '../url-builder/url-builder.service';

export enum DataLoaderClipListStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  FAILED = 'FAILED',
}

export interface MestCloudCmdResponse extends ApiErrorResponse {
  cmd: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataLoaderService {
  private urlBuilder = inject(UrlBuilderService);
  private downloaderService = inject(MeDownloaderService);
  private httpClient = inject(HttpClient);
  private snackbar = inject(MeSnackbarService);

  downloadClipList(
    mestHash: string,
    clipListS3Key: string,
    status: DataLoaderClipListStatus,
    clipsToParamsHashPath: string,
    toastMsg?: string,
    noObjectUrl?: boolean,
  ): Observable<void | File> {
    if (toastMsg) {
      this.snackbar.open(toastMsg);
    } else {
      this.snackbar.onDownloadStarted();
    }
    const url = this.urlBuilder.dataLoaderApiBuilder('download/filtered-clip-list/');
    const requestBody = {
      mest_hash: mestHash,
      clip_list_s3_path: clipListS3Key,
      clips_to_params_hash_path: clipsToParamsHashPath,
      status,
    };

    if (!clipsToParamsHashPath) {
      delete requestBody.clips_to_params_hash_path;
    }

    return this.downloaderService.postDownloadFileWithAuth(
      url,
      requestBody,
      false,
      '',
      null,
      noObjectUrl,
    );
  }

  getMestCloudCmd(jobUuid: string): Observable<MestCloudCmdResponse> {
    const url = this.urlBuilder.dataLoaderApiBuilder(`cloud-mest-cmd-for-local-run/${jobUuid}/`);
    return this.httpClient.get<MestCloudCmdResponse>(url);
  }
}
