import {inject, Injectable} from '@angular/core';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {SelectMestItem, ValidSelectedMest} from 'deep-ui/shared/components/src/lib/common';
import {MestFoundPathsResponse, MestService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';
import _find from 'lodash-es/find';
import _isEqual from 'lodash-es/isEqual';
import _isString from 'lodash-es/isString';

@Injectable()
export class SelectMestService {
  private mestService = inject(MestService);

  shouldIncludeClipListColumn(
    overrideDisplayColumns: Array<string>,
    clipListOptions: Array<MeSelectOption>,
  ): boolean {
    if (!overrideDisplayColumns?.includes('clipList')) {
      return false;
    }
    return clipListOptions.length > 1;
  }

  generateDynamicPathsError(
    executableError: string,
    libError: string,
    brainLibError: string,
  ): string {
    const errArr = [];
    if (executableError) {
      errArr.push('executable');
    }
    if (libError) {
      errArr.push('lib');
    }
    if (brainLibError) {
      errArr.push('brain lib');
    }
    return errArr.join(', ');
  }

  convertToValidMest(
    mest: SelectMestItem,
    response: MestFoundPathsResponse,
    clipListsControlValue: any,
    clipLists: Array<ClipList>,
  ): ValidSelectedMest {
    const executable = response.executable.foundPath || '';
    const lib = response.lib.foundPath || '';
    const brainLib = response?.brainLib?.foundPath || '';
    return this._generateValidMest(
      mest,
      executable,
      lib,
      brainLib,
      clipListsControlValue,
      clipLists,
    );
  }

  private _generateValidMest(
    selectedMest: SelectMestItem,
    executable: string,
    lib: string,
    brainLib: string,
    clipListsControlValue: any,
    clipLists: Array<ClipList>,
  ): ValidSelectedMest {
    if (!selectedMest) {
      return null;
    }
    const params = this.mestService.generateMestParamString(selectedMest.params);
    const clipList = this.getClipListFromControl(selectedMest.id, clipLists, clipListsControlValue);

    return {
      id: selectedMest.id,
      rootPath: selectedMest.rootPath,
      isOverride: selectedMest.isOverride || false,
      nickname: selectedMest.nickname,
      ...(selectedMest.mestOutputsNickname && {
        mestOutputsNickname: selectedMest.mestOutputsNickname,
      }),
      ...(selectedMest.mestSyncLocalDirectory && {
        mestSyncLocalDirectory: selectedMest.mestSyncLocalDirectory,
      }),
      args: selectedMest.args,
      clipList,
      params,
      executable,
      lib,
      brainLib,
    };
  }

  isOnlyMestRootPathChanged(newMest: SelectMestItem, originalMest: SelectMestItem): boolean {
    const compareOne = {
      ...originalMest,
      ...newMest,
    };
    const compareTwo = {
      ...originalMest,
    };
    const key = 'rootPath';

    delete compareOne[key];
    delete compareTwo[key];

    return _isEqual(compareOne, compareTwo);
  }

  getClipListFromControl(
    mestId: number,
    clipLists: Array<ClipList>,
    clipListsControlValue: any,
  ): ClipList {
    if (!clipLists.length) {
      return null;
    }
    const clipListControlValue = clipListsControlValue[mestId.toString()];
    if (!clipListControlValue) {
      return null;
    }
    const clipListId: number = _isString(clipListControlValue)
      ? parseInt(clipListControlValue)
      : clipListControlValue?.id;
    return _find(clipLists, (list: ClipList) => list.id === clipListId);
  }
}
