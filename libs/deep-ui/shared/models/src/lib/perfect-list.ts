import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {BaseModel} from 'deep-ui/shared/common';
import _startCase from 'lodash-es/startCase';

export enum PerfectListTypeEnum {
  DIRECTORY = 'directory',
  FILE = 'file',
  PerfectSearch = 'perfectSearch',
}

export const PerfectListTypeOptions: Array<MeSelectOption> = [
  {
    id: PerfectListTypeEnum.DIRECTORY,
    value: _startCase(PerfectListTypeEnum.DIRECTORY),
    tooltip: 'The directory location for where the perfect lists are located',
  },
  {
    id: PerfectListTypeEnum.FILE,
    value: _startCase(PerfectListTypeEnum.FILE),
    tooltip: 'Use for a subset of a perfect list file or a specific file',
  },
  {
    id: PerfectListTypeEnum.PerfectSearch,
    value: 'PerfectSearch',
    tooltip: 'The URL generated from PerfectSearch share search criteria button',
  },
];

export interface PerfectList extends BaseModel {
  id: number;
  name: string;
  team: string;
  type: PerfectListTypeEnum;
  technology: string;
  rawDataOwner: string;
  locationsOnMobileye: string[];
  count: number;
  tags: string[];
  description: string;
  s3Path: string;
  file?: string;
  perfectSearchUrl?: string;
  status: 'active' | 'in_progress' | 'updating' | 'failed' | 'syncing';
}
