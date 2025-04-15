import {Route} from '@angular/router';

import {EditPerfectListResolver} from './edit-perfect-list/edit-perfect-list.resolver';
import {IndexPerfectListResolver} from './index-perfect-list/index-perfect-list.resolver';

export default [
  {
    path: '',
    resolve: {viewData: IndexPerfectListResolver},
    loadChildren: () => import('./index-perfect-list/index-perfect-list.routes'),
  },
  {
    path: 'create',
    loadChildren: () => import('./create-perfect-list/create-perfect-list.routes'),
  },
  {
    path: 'edit/:id',
    resolve: {entity: EditPerfectListResolver},
    loadChildren: () => import('./edit-perfect-list/edit-perfect-list.routes'),
  },
] as Route[];
