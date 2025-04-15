import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {EntityListActionButton} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {Dataset} from 'deep-ui/shared/models';

export const breadcrumbs: MeBreadcrumbItem[] = [
  {
    title: 'Datasets',
  },
];

export const actionButtons: EntityListActionButton<Dataset>[] = [
  {
    isPrimary: false,
    id: 'delete',
    label: 'Delete',
    icon: 'delete',
    selectedRequired: true,
  },
  {
    isPrimary: false,
    id: 'edit',
    label: 'Edit',
    icon: 'edit',
    selectedRequired: true,
  },
  {
    isPrimary: true,
    id: 'create',
    icon: 'add',
    label: 'Create',
  },
];
