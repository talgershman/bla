import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MEST} from 'deep-ui/shared/models';

export const getBreadcrumbs = (mest: MEST): MeBreadcrumbItem[] => {
  return [
    {
      route: ['/manage/mests'],
      title: 'MEST CMDs',
    },
    {
      title: `Edit MEST CMD - ${mest.nickname}`,
    },
  ];
};
