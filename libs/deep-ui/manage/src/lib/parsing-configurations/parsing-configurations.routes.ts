import {Route} from '@angular/router';

import {TourBaseResolver} from '../common/tour-base.resolver';
import {ViewParsingConfigurationResolver} from './view-parsing-configuration/view-parsing-configuration.resolver';

export default [
  {
    path: '',
    loadChildren: () => import('./index-parsing-configuration/index-parsing-configuration.routes'),
  },
  {
    path: 'create',
    resolve: {viewData: TourBaseResolver},
    loadChildren: () =>
      import('./create-parsing-configuration/create-parsing-configuration.routes'),
  },
  {
    path: 'view/:id',
    resolve: {parsingConfiguration: ViewParsingConfigurationResolver},
    loadChildren: () => import('./view-parsing-configuration/view-parsing-configuration.routes'),
  },
] as Route[];
