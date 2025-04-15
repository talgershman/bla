import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {Injectable} from '@angular/core';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {
  convertPerfectTransformJobStepStringToTitle,
  DataRetentionObj,
  getPerfectTransformJobFlowSteps,
  PerfectTransformJob,
  PerfectTransformJobSnakeCase,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import {Observable} from 'rxjs';

import {BaseJobService} from '../base-job.service';

@Injectable({
  providedIn: 'root',
})
export class PerfectTransformJobsService extends BaseJobService {
  agGridBaseUrl = this.urlBuilder.validationJobsBuilder('perfect-transform-job/ag-grid/');

  getSingle(jobUuid: string): Observable<PerfectTransformJobSnakeCase> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder(
      `perfect-transform-job/${jobUuid}/`,
    )}`;
    return this.http.get<PerfectTransformJobSnakeCase>(endPoint);
  }

  updateJob(id: string, fromValue: any): Observable<PerfectTransformJob> {
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder('perfect-transform-job/', id)}/`;

    return this.http.patch<PerfectTransformJob>(endPoint, fromValue);
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
    const endPoint = `${this.urlBuilder.stateReflectorApiBuilder(
      'update-data-retention/batch/perfects',
    )}/`;

    return this.http.patch<{jobs_updated: Array<string>; errors?: Array<any>}>(endPoint, {
      job_uuids: jobIds,
      data_retention: dataRetention,
    });
  }

  // eslint-disable-next-line
  @memoize()
  getModelNamePlural(): string {
    return 'perfectTransformJobs';
  }

  // eslint-disable-next-line
  @memoize()
  getFlowSteps(): string[] {
    return getPerfectTransformJobFlowSteps();
  }

  convertStepToTitle(flowStep: string): string {
    return convertPerfectTransformJobStepStringToTitle(flowStep);
  }
}
