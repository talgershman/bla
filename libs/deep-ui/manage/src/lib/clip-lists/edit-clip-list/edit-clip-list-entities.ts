import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {ClipList} from 'deep-ui/shared/models';

export const getBreadcrumbs = (clipList: ClipList): MeBreadcrumbItem[] => {
  return [
    {
      route: ['/manage/clip-lists'],
      title: 'Clip Lists',
    },
    {
      title: `Edit Clip List - ${clipList.name}`,
    },
  ];
};
