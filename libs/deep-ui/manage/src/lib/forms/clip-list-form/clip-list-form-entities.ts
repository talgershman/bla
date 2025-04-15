import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {ClipListTypeEnum, clipListTypeEnumFormatter} from 'deep-ui/shared/models';

export const typeOptions: MeSelectOption[] = [
  {
    id: ClipListTypeEnum.CLIP,
    value: clipListTypeEnumFormatter(ClipListTypeEnum.CLIP),
    tooltip: 'Clip list from MDB',
  },
  {
    id: ClipListTypeEnum.PLS_MDB,
    value: clipListTypeEnumFormatter(ClipListTypeEnum.PLS_MDB),
  },
  {
    id: ClipListTypeEnum.PLS_CUSTOM,
    value: clipListTypeEnumFormatter(ClipListTypeEnum.PLS_CUSTOM),
    tooltip: 'A custom PLS Clip List',
  },
  {
    id: ClipListTypeEnum.GENERIC,
    value: clipListTypeEnumFormatter(ClipListTypeEnum.GENERIC),
    tooltip: 'Clip files from S3',
  },
];
