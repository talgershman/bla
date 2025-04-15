import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {isArray} from 'lodash-es';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';
import {
  LogsDirFilterType,
  UploadClip2logFilterListResponse,
  ValidateDatasetResponse,
} from './launch-entites';
import {
  SubmitJobAVPipeline,
  SubmitJobCloudMco,
  SubmitJobCompareVersionsRequestTypes,
  SubmitJobMetro,
  SubmitJobPerfectTransform,
  SubmitJobRefJobId,
  SubmitJobRequest,
  SubmitJobResponse,
} from './submit-job-entities';

@Injectable({
  providedIn: 'root',
})
export class LaunchService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private snackbar = inject(MeSnackbarService);

  validateClipToLogOutputs(
    logDirs: string[],
    filterType: LogsDirFilterType,
    filterByClipListId: number,
    filterListS3Path: string = null,
  ): Observable<ValidateDatasetResponse> {
    const url = this.urlBuilder.launchServiceApiBuilder('validate-clip2log-outputs/');
    const reqBody = {
      logDirs,
      filterListS3Path,
      filterType,
      filterByClipListId,
    };

    if (!filterListS3Path) {
      delete reqBody.filterListS3Path;
    }
    if (!filterByClipListId) {
      delete reqBody.filterByClipListId;
    }

    return this.httpClient.post<ValidateDatasetResponse>(url, reqBody);
  }

  validateEgoMotion(s3Path: string): Observable<any> {
    const url = this.urlBuilder.launchServiceApiBuilder('validate-av-egomotion-data/');
    return this.httpClient.post<any>(url, {
      s3Path,
    });
  }

  validateUserParams(etlId: number, params: Record<string, any>): Observable<any> {
    const url = this.urlBuilder.launchServiceApiBuilder('launch/validate-user-params/');
    return this.httpClient.post<any>(url, {
      etl: etlId,
      'user_params': params,
    });
  }

  submitJob(
    requestBody:
      | SubmitJobRequest
      | SubmitJobPerfectTransform
      | SubmitJobMetro
      | SubmitJobCloudMco
      | SubmitJobAVPipeline
      | SubmitJobRefJobId
      | SubmitJobCompareVersionsRequestTypes,
  ): Observable<SubmitJobResponse | Array<SubmitJobResponse>> {
    const url = this.urlBuilder.launchServiceApiBuilder('launch/submit-job/');
    return this.httpClient
      .post<SubmitJobResponse | Array<SubmitJobResponse>>(url, requestBody)
      .pipe(
        tap((response: SubmitJobResponse | Array<SubmitJobResponse>) => {
          let showSnackBarMsg = false;
          if (isArray(response)) {
            for (const item of response) {
              if (this._isNewJobCreated(item)) {
                showSnackBarMsg = true;
                break;
              }
            }
          } else if (this._isNewJobCreated(response)) {
            showSnackBarMsg = true;
          }
          if (showSnackBarMsg) {
            this.snackbar.open(`The ETL Job was not submitted successfully`);
          }
        }),
      );
  }

  uploadPCRunLogFile(file: File, relativePath: string): Observable<ValidateDatasetResponse> {
    const formData = new FormData();
    formData.append('file', file, relativePath);
    const url = this.urlBuilder.launchServiceApiBuilder('upload-pc-run-logs-list/');
    return this.httpClient.post<ValidateDatasetResponse>(url, formData).pipe();
  }

  uploadClipToLogFile(
    file: File,
    relativePath: string,
  ): Observable<UploadClip2logFilterListResponse> {
    const formData = new FormData();
    formData.append('file', file, relativePath);
    const url = this.urlBuilder.launchServiceApiBuilder('upload-clip2log-filter-list/');
    return this.httpClient.post<UploadClip2logFilterListResponse>(url, formData).pipe();
  }

  private _isNewJobCreated(response: SubmitJobResponse): boolean {
    return 'isCreated' in response && response.isCreated;
  }
}
