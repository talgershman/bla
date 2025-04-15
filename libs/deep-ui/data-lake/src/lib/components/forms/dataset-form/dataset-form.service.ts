import {inject, Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {getDiffKeys} from '@mobileye/material/src/lib/utils';
import {Dataset, SubQuery} from 'deep-ui/shared/models';

import {QueryUtilService} from '../../../query-utils/query-util.service';

@Injectable()
export class DatasetFormService {
  private queryUtilService = inject(QueryUtilService);

  getDirtyControls(datasetFrom: FormGroup, initialDataset: Partial<Dataset>): Dataset {
    let dataSet = {...datasetFrom.value};
    dataSet.queryDashboard.queryJson = this.queryUtilService.getSerializeQueries(
      dataSet.queryDashboard.queryJson,
    );
    if (initialDataset) {
      const diffKeys = getDiffKeys(initialDataset, datasetFrom.value);
      dataSet = this._getDirtyControls(datasetFrom, diffKeys);
    }
    return dataSet;
  }

  serializeQueryDashboardValue(value: any): Partial<Dataset> {
    if (!value) {
      return null;
    }
    return {
      queryJson: this.queryUtilService.getSerializeQueries(value.queryJson),
      queryString: value.queryString,
      pathOnS3: value.pathOnS3,
      numberOfClips: value.numberOfClips,
    } as Partial<Dataset>;
  }

  private _atLeastOneSubQueryFieldSelected(subQueries: Array<SubQuery>): boolean {
    if (!subQueries?.length) {
      return false;
    }
    for (const query of subQueries) {
      if (query?.query?.columns?.length) {
        return true;
      }
    }
    return false;
  }

  private _getDirtyControls(datasetForm: FormGroup, dirtyKeys: string[]): Partial<any> {
    const dirtyValues = {};
    for (const key of dirtyKeys) {
      dirtyValues[key] = datasetForm.get(key).value;
    }
    return Object.keys(dirtyValues).length ? dirtyValues : null;
  }
}
