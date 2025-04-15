import {MeGroupButton} from '@mobileye/material/src/lib/common';
import {LogsDirFilterType} from 'deep-ui/shared/core';

export const LOGS_DIR_FILTER_BUTTONS: MeGroupButton[] = [
  {
    id: LogsDirFilterType.NO_FILTER,
    label: 'No Filter',
  },
  {
    id: LogsDirFilterType.FILTER_BY_FILE,
    label: 'Filter by file',
  },
  {
    id: LogsDirFilterType.FILTER_BY_CLIP_LIST,
    label: 'Filter by clip list',
  },
];
