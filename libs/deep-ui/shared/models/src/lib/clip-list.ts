import {BaseModel} from 'deep-ui/shared/common';

export enum ClipListTypeEnum {
  CLIP = 'clip',
  PLS_MDB = 'pls-mdb',
  PLS_CUSTOM = 'pls-custom',
  GENERIC = 'generic',
}

export const clipListTypeEnumFormatter = (state: ClipListTypeEnum): string => {
  switch (state) {
    case ClipListTypeEnum.CLIP:
      return 'Clip';
    case ClipListTypeEnum.PLS_MDB:
      return 'MDB Playlist';
    case ClipListTypeEnum.PLS_CUSTOM:
      return 'Custom Playlist';
    case ClipListTypeEnum.GENERIC:
      return 'Generic';
    default:
  }
  return '';
};

export interface ClipList extends BaseModel {
  id: number;
  name: string;
  team: string;
  technology: string;
  brain: string;
  camera: string;
  count: number;
  tags: string[];
  description: string;
  s3Path: string;
  clipsToParamsHashPath: string;
  clipListFile?: File;
  type: ClipListTypeEnum;
}
