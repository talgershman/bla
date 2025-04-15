import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {EntityListActionButton} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {ETL} from 'deep-ui/shared/models';

export const breadcrumbs: MeBreadcrumbItem[] = [
  {
    title: 'ETLs',
  },
];

export const actionButtons: EntityListActionButton<ETL>[] = [
  {
    isPrimary: false,
    id: 'delete',
    label: 'Delete',
    icon: 'delete',
    selectedRequired: true,
  },
  {
    isPrimary: false,
    id: 'view',
    label: 'View',
    icon: 'visibility',
    selectedRequired: true,
  },
  {
    isPrimary: false,
    id: 'edit',
    label: 'New Revision',
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
