import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {ParsingConfiguration} from 'deep-ui/shared/models';

export const getBreadcrumbs = (parsingConfiguration: ParsingConfiguration): MeBreadcrumbItem[] => {
  return [
    {
      route: ['/manage/parsing-configurations'],
      title: 'Parsing Configurations',
    },
    {
      title: `${parsingConfiguration.name}`,
    },
  ];
};
