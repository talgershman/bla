import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {ValidationResponse} from 'deep-ui/shared/common';
import {
  convertEtlJobStepStringToTitle,
  DataRetentionConfig,
  DataRetentionObj,
  EtlJob,
  ETLJobSnakeCase,
  EtlJobStepEnum,
  ETLJobUnSupportedTypes,
  getEtlJobFlowSteps,
  JobEntity,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

import {BaseJobService} from '../base-job.service';

export interface ProbeLogsResponse extends ValidationResponse {
  urls: Array<string>;
}

export interface DataPrepOutputResponse extends ValidationResponse {
  url: string;
}

export interface LogicOutputResponse extends Record<string, string> {
  error?: string;
}

export enum StateReflectorMestClipListStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  FAILED = 'FAILED',
  MEST_TRIGGER_FAILED = 'MEST_TRIGGER_FAILED',
}

@Injectable({
  providedIn: 'root',
})
export class EtlJobService extends BaseJobService {
  protected agGridBaseUrl = this.urlBuilder.validationJobsBuilder('job/ag-grid/');

  getSingle(jobUuid: string): Observable<ETLJobSnakeCase> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder(`job/${jobUuid}/`)}`;
    return this.http.get<ETLJobSnakeCase>(endPoint);
  }

  updateJob(id: string, fromValue: any): Observable<EtlJob> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder('job/', id)}/`;

    return this.http.patch<EtlJob>(endPoint, fromValue);
  }

  getAgGridMulti(request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    return this.http.post<LoadSuccessParams>(
      this.agGridBaseUrl,
      getMeServerSideGetRowsRequest(request),
    );
  }

  updateDataRetention(
    jobIds: Array<string>,
    dataRetention: DataRetentionObj,
  ): Observable<{jobs_updated: Array<string>; errors?: Array<any>}> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder('update-data-retention/batch')}/`;

    return this.http.patch<{jobs_updated: Array<string>; errors?: Array<any>}>(endPoint, {
      job_uuids: jobIds,
      data_retention: dataRetention,
    });
  }

  // eslint-disable-next-line
  @memoize()
  getModelNamePlural(): string {
    return 'validationJobs';
  }

  getFlowSteps(job: JobEntity = null): string[] {
    return getEtlJobFlowSteps(job);
  }

  convertStepToTitle(flowStep: string): string {
    return convertEtlJobStepStringToTitle(flowStep);
  }

  downloadDataPrepOutput(jobUuid: string, clipName: string): Observable<DataPrepOutputResponse> {
    const endPoint = this.urlBuilder.validationJobsBuilder('data-prep-output/');

    return this.http
      .post<DataPrepOutputResponse>(endPoint, {
        jobUuid,
        inputName: clipName,
      })
      .pipe(
        tap((response: DataPrepOutputResponse) => {
          if (response?.url) {
            this.snackbar.onDownloadStarted();
          }
        }),
      );
  }

  downloadLogicOutput(jobUuid: string, clipName: string): Observable<LogicOutputResponse> {
    const endPoint = this.urlBuilder.validationJobsBuilder('logic-output/');

    return this.http
      .post<LogicOutputResponse>(endPoint, {
        jobUuid,
        inputName: clipName,
      })
      .pipe(
        tap((response: LogicOutputResponse) => {
          if (Object.keys(response || {}).length) {
            this.snackbar.onDownloadStarted();
          }
        }),
      );
  }

  downloadClipLogs(
    jobUuid: string,
    clipName: string,
    hideSnackbar?: boolean,
  ): Observable<ProbeLogsResponse> {
    const endPoint = this.urlBuilder.validationJobsBuilder('probe-logs/');

    return this.http
      .post<ProbeLogsResponse>(endPoint, {
        jobUuid,
        clipName,
      })
      .pipe(
        tap((response: ProbeLogsResponse) => {
          if (response?.urls?.length && !hideSnackbar) {
            this.snackbar.onDownloadStarted();
          }
        }),
      );
  }

  downloadClipList(jobUuid: string): void {
    const endPoint = this.urlBuilder.validationJobsBuilder('clip-list/', {
      jobUuid,
      classifier: ETLJobUnSupportedTypes.MAP_TO_DF,
    });

    this.http
      .get<any>(endPoint)
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.snackbar.onDownloadStarted();
        }),
      )
      .subscribe((response) => {
        if (response.url) {
          this.downloader.downloadFile(response.url);
        }
      });
  }

  downloadMestClipList(
    jobUuid: string,
    status: StateReflectorMestClipListStatus,
    toastMsg?: string,
  ): Observable<{url: string}> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder(`base-job/${jobUuid}/mest-clip-list-by-status/`, {status})}`;
    return this.http.get<any>(endPoint).pipe(
      catchError(() => of(null)),
      tap(() => {
        if (toastMsg) {
          this.snackbar.open(toastMsg);
        } else {
          this.snackbar.onDownloadStarted();
        }
      }),
    );
  }

  downloadRuntimeStats(jobUuid: string, step: 'data-prep' | 'etl-logic'): void {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder('runtime-stats/')}`;

    this.http
      .post<{url: string}>(endPoint, {
        jobUuid,
        step,
      })
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.snackbar.onDownloadStarted();
        }),
      )
      .subscribe((response: {url: string}) => {
        if (response?.url) {
          this.downloader.downloadFile(response.url);
        }
      });
  }

  getDataRetentionConfig(): Observable<DataRetentionConfig> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder('fixed-response/', {
      name: 'dataRetentionConfig',
    })}`;

    return this.http.get<DataRetentionConfig>(endPoint);
  }

  getLastOutputPath(etlName: string, team: string): Observable<{path: string}> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder('job/last-output-path/')}`;
    const body = {
      etlName,
      team,
    };
    return this.http.post<{path: string}>(endPoint, body);
  }

  getEtlParsingStep(): string {
    return EtlJobStepEnum.PARSING;
  }

  getEtlMestStep(): string {
    return EtlJobStepEnum.MEST;
  }

  getEtlReportStep(): string {
    return EtlJobStepEnum.REPORT;
  }
}
