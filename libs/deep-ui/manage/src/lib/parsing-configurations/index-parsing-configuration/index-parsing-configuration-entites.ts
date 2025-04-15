import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {EntityListActionButton} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {ParsingConfiguration} from 'deep-ui/shared/models';

export const breadcrumbs: MeBreadcrumbItem[] = [
  {
    title: 'Parsing Configurations',
  },
];

export const actionButtons: EntityListActionButton<ParsingConfiguration>[] = [
  {
    isPrimary: false,
    id: 'view',
    label: 'View',
    icon: 'visibility',
    selectedRequired: true,
    isDisabled(entity: ParsingConfiguration): boolean {
      return entity?.id === undefined;
    },
  },
  {
    isPrimary: true,
    id: 'create',
    icon: 'add',
    label: 'Create',
  },
];
