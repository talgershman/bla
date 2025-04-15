import {Route} from '@angular/router';

import {TourBaseResolver} from '../common/tour-base.resolver';
import {EditMestResolver} from './edit-mest/edit-mest.resolver';

export default [
  {
    path: '',
    loadChildren: () => import('./index-mest/index-mest.routes'),
  },
  {
    path: 'create',
    resolve: {viewData: TourBaseResolver},
    loadChildren: () => import('./create-mest/create-mest.routes'),
  },
  {
    path: 'edit/:id',
    resolve: {mest: EditMestResolver},
    loadChildren: () => import('./edit-mest/edit-mest.routes'),
  },
] as Route[];
