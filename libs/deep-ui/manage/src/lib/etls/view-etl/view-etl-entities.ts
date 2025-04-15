import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {ETL} from 'deep-ui/shared/models';

export const getBreadcrumbs = (etl: ETL): MeBreadcrumbItem[] => {
  return [
    {
      route: ['/manage/etls'],
      title: 'ETLs',
    },
    {
      title: `${etl.name}`,
    },
    {
      title: `Version - ${etl.version}`,
    },
  ];
};
