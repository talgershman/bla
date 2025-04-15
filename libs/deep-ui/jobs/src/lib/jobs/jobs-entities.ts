import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeChipsGroupButton} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {JobsDynamicViewEnum} from 'deep-ui/shared/components/src/lib/common';

export const breadcrumbs: MeBreadcrumbItem[] = [
  {
    title: 'Jobs',
  },
];

export const buttons: Array<MeChipsGroupButton> = [
  {
    label: 'ETL',
    id: JobsDynamicViewEnum.ETL,
  },
  {
    label: 'Perfect Transform',
    id: JobsDynamicViewEnum.PERFECT_TRANSFORM,
  },
];

export const JOBS_DEFAULT_VIEW = JobsDynamicViewEnum.ETL;
