import {ClipList, MEST} from 'deep-ui/shared/models';

export interface SelectMestItem extends MEST {
  requestId?: string; // not DB attr
  rootPath?: string; // not DB attr
  isOverride?: boolean; // not DB attr
  isMain?: boolean;
  clipList?: ClipList;
  isValid?: boolean;
  customNicknameInvalid?: boolean;
  localOutputInvalid?: boolean;
  localOutputLoading?: boolean;
  error?: boolean;
  validationTooltip?: string;
  isLoading?: boolean;
  mestOutputsNickname?: string;
  mestSyncLocalDirectory?: string;
}

export interface ValidSelectedMest {
  id: number;
  rootPath: string;
  isOverride: boolean;
  nickname: string;
  executable: string;
  params: string[];
  args: string;
  lib?: string;
  brainLib?: string;
  clipList: ClipList;
  mestOutputsNickname: string;
  mestSyncLocalDirectory: string;
}

export interface InitialMestSettings {
  id: number;
  root_path: string;
  mest_sync_local_directory: string;
  mest_outputs_nickname: string;
  is_override: boolean;
}
