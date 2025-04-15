import {Route} from '@angular/router';

import {CreateEtlResolver} from './create-etl/create-etl.resolver';
import {ViewEtlResolver} from './view-etl/view-etl.resolver';

export default [
  {
    path: '',
    loadChildren: () => import('./index-etl/index-etl.routes'),
  },
  {
    path: '',
    loadChildren: () => import('./index-etl/index-etl.routes'),
  },
  {
    path: 'create',
    resolve: {viewData: CreateEtlResolver},
    loadChildren: () => import('./create-etl/create-etl.routes'),
  },
  {
    path: 'edit/:id',
    resolve: {viewData: ViewEtlResolver},
    loadChildren: () => import('./edit-etl/edit-etl.routes'),
  },
  {
    path: 'view/:id',
    resolve: {viewData: ViewEtlResolver},
    loadChildren: () => import('./view-etl/view-etl.routes'),
  },
] as Route[];
