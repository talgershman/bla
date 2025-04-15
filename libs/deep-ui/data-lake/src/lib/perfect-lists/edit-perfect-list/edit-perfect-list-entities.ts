import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {PerfectList} from 'deep-ui/shared/models';

export const getBreadcrumbs = (perfectList: PerfectList): MeBreadcrumbItem[] => {
  return [
    {
      route: ['/data-lake/perfect-lists'],
      title: 'Perfect Lists',
    },
    {
      title: `Edit Perfect List - ${perfectList.name}`,
    },
  ];
};
