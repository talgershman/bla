import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {ETL} from 'deep-ui/shared/models';

export const getBreadcrumbs = (etl: ETL): MeBreadcrumbItem[] => {
  return [
    {
      title: 'ETLs',
      route: ['/manage/etls'],
    },
    {
      title: `New revision - ${etl.name}`,
    },
    {
      title: `Version - ${etl.version}`,
    },
  ];
};
