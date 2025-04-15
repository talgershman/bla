import {inject, Injectable} from '@angular/core';
import {addDaysToDate, dateDiff, dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {
  DataRetentionConfig,
  DataRetentionKnownKeysEnum,
  DataRetentionObj,
  Datasource,
  EtlJobFlowsEnum,
  JobTypesEnum,
  PerfectJobFlowsEnum,
} from 'deep-ui/shared/models';
import {BehaviorSubject, Observable, of, switchMap} from 'rxjs';

import {EtlJobService} from '../jobs/etl-job/etl-job.service';

@Injectable({
  providedIn: 'root',
})
export class DataRetentionService {
  private readonly currentDataRetentionConfig = new BehaviorSubject<DataRetentionConfig>(null);
  private etlJobService = inject(EtlJobService);

  getDataRetentionConfig(): Observable<DataRetentionConfig> {
    const currentConfig = this.currentDataRetentionConfig.value;
    if (currentConfig) {
      return of(currentConfig);
    }

    return this.etlJobService.getDataRetentionConfig().pipe(
      switchMap((config: DataRetentionConfig) => {
        this.currentDataRetentionConfig.next(config);
        return of(config);
      }),
    );
  }

  getPerfectDataRetentionObj(dataSource?: Datasource): DataRetentionObj {
    const config: DataRetentionConfig = this._getFilteredDataRetentionByJobType(
      this.currentDataRetentionConfig.value,
      PerfectJobFlowsEnum.PERFECT_TRANSFORM,
    );
    const dataRetentionObj = {};
    const keys = Object.keys(config);
    keys.forEach((key: string) => {
      const expirationDate = dataSource?.expirationDate
        ? new Date(dataSource.expirationDate)
        : null;
      const now = dateNow();
      const defaultDate = addDaysToDate(now, config[key].default);
      const retentionDate =
        expirationDate && dateDiff(expirationDate, defaultDate) > 0 ? expirationDate : defaultDate;
      dataRetentionObj[key] = toShortDate(retentionDate);
    });
    return dataRetentionObj;
  }

  getVersionPerfectDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.VERSION_PERFECT);
  }

  getClip2LogDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.CLIP_2_LOG);
  }

  getSingleVersionDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.SINGLE_VERSION);
  }

  getPCRunDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.PC_RUN);
  }

  getMetroDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.METRO);
  }

  getAVPipelineDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.AV_PIPELINE);
  }

  getCloudMcoDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(currentConfig, EtlJobFlowsEnum.CLOUD_MCO);
  }

  getPerfectTransformDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByJobType(
      currentConfig,
      PerfectJobFlowsEnum.PERFECT_TRANSFORM,
    );
  }

  getMestDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByKey(
      currentConfig,
      DataRetentionKnownKeysEnum.MERGED_PARSED_DATA,
    );
  }

  getEtlResultsDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByKey(
      currentConfig,
      DataRetentionKnownKeysEnum.ETL_RESULTS,
    );
  }

  getDatasetDataRetentionConfig(): DataRetentionConfig {
    const currentConfig = this.currentDataRetentionConfig.value;
    return this._getFilteredDataRetentionByKey(currentConfig, DataRetentionKnownKeysEnum.DATASETS);
  }

  private _getFilteredDataRetentionByJobType(
    config: DataRetentionConfig,
    jobType: JobTypesEnum,
  ): DataRetentionConfig {
    if (!config) {
      return null;
    }

    const filteredDataRetention = {};

    for (const k of Object.keys(config)) {
      if (config[k].job_types.includes(jobType)) {
        filteredDataRetention[k] = config[k];
      }
    }

    return filteredDataRetention;
  }

  private _getFilteredDataRetentionByKey(
    config: DataRetentionConfig,
    key: DataRetentionKnownKeysEnum,
  ): DataRetentionConfig {
    const filteredDataRetention = {};

    for (const k of Object.keys(config)) {
      if (k === key) {
        filteredDataRetention[k] = config[k];
        return filteredDataRetention;
      }
    }

    return filteredDataRetention;
  }
}
