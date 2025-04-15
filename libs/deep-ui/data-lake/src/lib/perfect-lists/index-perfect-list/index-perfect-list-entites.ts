import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {EntityListActionButton} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {environment} from 'deep-ui/shared/environments';
import {PerfectList} from 'deep-ui/shared/models';

export const breadcrumbs: MeBreadcrumbItem[] = [
  {
    title: 'Perfect Lists',
  },
];

export const actionButtons: EntityListActionButton<PerfectList>[] = [
  {
    isPrimary: false,
    id: 'delete',
    label: 'Delete',
    icon: 'delete',
    selectedRequired: true,
    isDisabled(entity: PerfectList): boolean {
      return (
        environment.disableDatasetRoutes ||
        !entity ||
        (entity?.status !== 'active' && entity?.status !== 'failed')
      );
    },
  },
  {
    isPrimary: false,
    id: 'edit',
    label: 'Edit',
    icon: 'edit',
    selectedRequired: true,
    isDisabled(entity: PerfectList): boolean {
      return (
        environment.disableDatasetRoutes ||
        !entity ||
        entity?.status === 'syncing' ||
        entity?.status === 'in_progress' ||
        entity.status === 'updating'
      );
    },
  },
  {
    isPrimary: true,
    id: 'create',
    icon: 'add',
    label: 'Create',
  },
];
