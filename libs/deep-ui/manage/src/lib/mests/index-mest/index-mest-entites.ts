import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {EntityListActionButton} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {MEST} from 'deep-ui/shared/models';

export const breadcrumbs: MeBreadcrumbItem[] = [
  {
    title: 'MEST CMDs',
  },
];

export const actionButtons: EntityListActionButton<MEST>[] = [
  {
    isPrimary: false,
    id: 'delete',
    label: 'Delete',
    icon: 'delete',
    selectedRequired: true,
    isDisabled(entity: MEST): boolean {
      return !entity;
    },
  },
  {
    isPrimary: false,
    id: 'edit',
    label: 'Edit',
    icon: 'edit',
    selectedRequired: true,
    isDisabled(entity: MEST): boolean {
      return !entity;
    },
  },
  {
    isPrimary: true,
    id: 'create',
    icon: 'add',
    label: 'Create',
  },
];
