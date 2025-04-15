import {inject, Injectable} from '@angular/core';
import {AbstractControl, FormControlStatus, ValidationErrors} from '@angular/forms';
import {
  Dataset,
  Datasource,
  FrameIndicatorsTypesArr,
  QueryObject,
  SelectedSubQuery,
  SubQuery,
} from 'deep-ui/shared/models';
import _find from 'lodash-es/find';
import _isEqual from 'lodash-es/isEqual';

import {QueryUtilService} from '../../../query-utils/query-util.service';

export const enum JumpFileActionEnum {
  triggerRunQuery,
  triggerActionButtonMenu,
}

export const enum QuerySampleActionEnum {
  triggerRunQuery,
  triggerOpenQuerySample,
  triggerActionButtonMenu,
}

export const enum DownloadClipListActionEnum {
  triggerRunQuery,
  proceedToDownloadQueryEngine,
  proceedToDownloadDataSet,
  triggerActionButtonMenu,
}

export const ACTION_NOT_SUPPORT_TEXT = `[ACTION_NAME_PLACEHOLDER] is not supported, query must contain one the following columns : ${FrameIndicatorsTypesArr.join(
  ', ',
)}`;

export const ACTION_NO_RESULT_FOUND_TEXT = 'No results found to run [ACTION_NAME_PLACEHOLDER]';

@Injectable()
export class QueryDashboardControlService {
  private queryUtilService = inject(QueryUtilService);
  validateQueryJson(control: AbstractControl): ValidationErrors {
    const subQueries = control.value as Array<SelectedSubQuery>;
    if (!subQueries?.length) {
      return {invalid: true};
    }
    const selectedDataSources = subQueries.map((subQuery: SelectedSubQuery) => subQuery.dataSource);
    const isInvalid = _find(selectedDataSources, {
      status: 'inactive',
    });
    if (isInvalid) {
      return {
        unableToRunQuery: 'Unable to run query, one of the Data Sources is inactive',
      };
    }
    const updatedDataSource: Datasource = _find(selectedDataSources, {
      status: 'updating',
    });
    if (updatedDataSource) {
      let isUpdating = false;
      if (updatedDataSource.versioned) {
        const updatedSubQuery: SelectedSubQuery = _find(
          subQueries,
          (query: SelectedSubQuery) => query.dataSourceId === updatedDataSource.id,
        );
        if (!updatedSubQuery.version) {
          isUpdating = true;
        }
      } else {
        isUpdating = true;
      }

      if (isUpdating) {
        return {
          unableToRunQuery:
            'Unable to run query, one of the Data Sources is updating... please come back later',
        };
      }
    }
    return null;
  }

  handlePreviewDialogButtonClicked(
    jumpFileS3PathValue: string,
    materializedValue: boolean,
    tableName: string,
    numberOfClips: number,
    queryHasFrameIndicator: boolean,
  ): {
    errorMsg: string;
    action: QuerySampleActionEnum;
  } {
    let errorMsg = '';
    let action: QuerySampleActionEnum;
    if (this._isQueryWithoutResults(tableName, numberOfClips)) {
      errorMsg = ACTION_NO_RESULT_FOUND_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'preview examples',
      );
      action = QuerySampleActionEnum.triggerActionButtonMenu;
      return {errorMsg, action};
    }
    if (this._noQueryRun(tableName)) {
      action = QuerySampleActionEnum.triggerRunQuery;
      return {errorMsg, action};
    }
    if (!queryHasFrameIndicator) {
      errorMsg = ACTION_NOT_SUPPORT_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'Preview examples');
      action = QuerySampleActionEnum.triggerActionButtonMenu;
      return {errorMsg, action};
    }
    //valid
    action = QuerySampleActionEnum.triggerOpenQuerySample;
    return {errorMsg, action};
  }

  handleAfterQueryRunForPreviewDialog(
    queryHasFrameIndicator: boolean,
    tableName: string,
    numberOfClips: number,
  ): {errorMsg: string; action: QuerySampleActionEnum} {
    let errorMsg = '';
    let action: QuerySampleActionEnum;
    if (!queryHasFrameIndicator) {
      errorMsg = ACTION_NOT_SUPPORT_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'Preview examples');
      action = QuerySampleActionEnum.triggerActionButtonMenu;
      return {errorMsg, action};
    } else if (this._isQueryWithoutResults(tableName, numberOfClips)) {
      errorMsg = ACTION_NO_RESULT_FOUND_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'preview examples',
      );
      action = QuerySampleActionEnum.triggerActionButtonMenu;
      return {errorMsg, action};
    } else {
      action = QuerySampleActionEnum.triggerOpenQuerySample;
      return {errorMsg, action};
    }
  }

  handleJumpFileButtonClicked(
    jumpFileS3PathValue: string,
    materializedValue: boolean,
    tableName: string,
    numberOfClips: number,
    queryHasFrameIndicator: boolean,
    initialQueryObject: QueryObject,
    queryJsonControlValue: QueryObject,
    dataset: Pick<Dataset, 'allowJumpFile' | 'pathOnS3'>,
    subQueries: Array<SubQuery>,
  ): {
    errorMsg: string;
    action: JumpFileActionEnum;
    jumpFileS3Path: string;
  } {
    let errorMsg = '';
    let jumpFileS3Path = jumpFileS3PathValue;
    let action: JumpFileActionEnum;
    if (materializedValue) {
      errorMsg =
        'Your query includes selected all fields,which is not allowed with multiple fields jump file';
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, action, jumpFileS3Path: ''};
    }
    if (!this.atLeastOneSubQueryFieldSelected(subQueries)) {
      errorMsg = 'No selected fields found, please add fields to your query';
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, action, jumpFileS3Path: ''};
    }
    if (
      dataset?.allowJumpFile &&
      dataset?.pathOnS3 &&
      !this._isQueryChanged(initialQueryObject, queryJsonControlValue) &&
      jumpFileS3Path === dataset.pathOnS3
    ) {
      //valid s3path
      jumpFileS3Path = dataset.pathOnS3;
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, action, jumpFileS3Path};
    }
    if (this._isQueryWithoutResults(tableName, numberOfClips)) {
      errorMsg = ACTION_NO_RESULT_FOUND_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'multiple fields jump file',
      );
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, action, jumpFileS3Path: ''};
    }
    if (this._noQueryRun(tableName)) {
      action = JumpFileActionEnum.triggerRunQuery;
      return {errorMsg, action, jumpFileS3Path: ''};
    }
    if (!queryHasFrameIndicator) {
      errorMsg = ACTION_NOT_SUPPORT_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'Multiple fields jump file',
      );
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, action, jumpFileS3Path: ''};
    }
    //valid
    action = JumpFileActionEnum.triggerActionButtonMenu;
    return {errorMsg, action, jumpFileS3Path};
  }

  handleAfterQueryRunForJumpFile(
    pathOnS3ControlValue: string,
    queryHasFrameIndicator: boolean,
    tableName: string,
    numberOfClips: number,
  ): {errorMsg: string; jumpFileS3Path: string; action: JumpFileActionEnum} {
    let errorMsg = '';
    const jumpFileS3Path = pathOnS3ControlValue;
    let action: JumpFileActionEnum;
    if (!queryHasFrameIndicator) {
      errorMsg = ACTION_NOT_SUPPORT_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'Multiple fields jump file',
      );
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, jumpFileS3Path: '', action};
    } else if (this._isQueryWithoutResults(tableName, numberOfClips)) {
      errorMsg = ACTION_NO_RESULT_FOUND_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'multiple fields jump file',
      );
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, jumpFileS3Path: '', action};
    } else {
      action = JumpFileActionEnum.triggerActionButtonMenu;
      return {errorMsg, jumpFileS3Path, action};
    }
  }

  handleDownloadClipListButtonClicked(
    tableName: string,
    numberOfClips: number,
    dataset: Dataset,
    initialQueryObject: QueryObject,
    queryJsonControlValue: QueryObject,
  ): {errorMsg: string; action: DownloadClipListActionEnum} {
    if (dataset?.id && !this._isQueryChanged(initialQueryObject, queryJsonControlValue)) {
      return {action: DownloadClipListActionEnum.proceedToDownloadDataSet, errorMsg: ''};
    }

    if (this._noQueryRun(tableName)) {
      return {action: DownloadClipListActionEnum.triggerRunQuery, errorMsg: ''};
    }

    if (this._isQueryWithoutResults(tableName, numberOfClips)) {
      const errorMsg = ACTION_NO_RESULT_FOUND_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'download clip list',
      );
      return {action: DownloadClipListActionEnum.triggerActionButtonMenu, errorMsg};
    }

    return {action: DownloadClipListActionEnum.proceedToDownloadQueryEngine, errorMsg: ''};
  }

  handleAfterQueryRunForDownloadClipList(
    tableName: string,
    numberOfClips: number,
  ): {errorMsg: string; action: DownloadClipListActionEnum} {
    if (this._isQueryWithoutResults(tableName, numberOfClips)) {
      const errorMsg = ACTION_NO_RESULT_FOUND_TEXT.replace(
        '[ACTION_NAME_PLACEHOLDER]',
        'download clip list',
      );
      return {action: DownloadClipListActionEnum.triggerActionButtonMenu, errorMsg};
    }

    return {action: DownloadClipListActionEnum.proceedToDownloadQueryEngine, errorMsg: ''};
  }

  atLeastOneSubQueryFieldSelected(subQueries: Array<SubQuery>): boolean {
    if (!subQueries?.length) {
      return false;
    }
    let result = false;
    for (const query of subQueries) {
      if (query?.query?.columns?.length) {
        result = true;
        break;
      }
    }
    return result;
  }

  isActionButtonDisabled(
    isReadOnlyMode: boolean,
    initialQueryObject: QueryObject,
    currentQueryObject: QueryObject,
    queryJsonControlStatus: FormControlStatus,
  ) {
    if (queryJsonControlStatus === 'INVALID') {
      return true;
    }
    return isReadOnlyMode && this._isQueryChanged(initialQueryObject, currentQueryObject);
  }

  getQueryObject(queryJsonValue: Array<SelectedSubQuery>): QueryObject {
    const serializeQueries = this.queryUtilService.getSerializeQueries(queryJsonValue);
    return {
      queries: serializeQueries,
    };
  }

  private _isQueryWithoutResults(tableName: string, numberOfClips: number): boolean {
    return tableName && !numberOfClips;
  }

  private _isQueryChanged(
    initialQueryObject: QueryObject,
    queryJsonControlValue: QueryObject,
  ): boolean {
    return !_isEqual(initialQueryObject, queryJsonControlValue);
  }

  private _noQueryRun(tableName: string): boolean {
    return !tableName;
  }
}
