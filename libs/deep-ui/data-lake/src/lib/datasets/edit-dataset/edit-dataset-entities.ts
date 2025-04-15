import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {Dataset} from 'deep-ui/shared/models';

export const getBreadcrumbs = (dataset: Dataset): MeBreadcrumbItem[] => {
  return [
    {
      route: ['/data-lake/datasets'],
      title: 'Datasets',
    },
    {
      title: `Edit Dataset - ${dataset.name}`,
    },
  ];
};
