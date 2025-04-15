import {Route} from '@angular/router';

import {CreateDatasetResolver} from './create-dataset/create-dataset.resolver';
import {EditDatasetResolver} from './edit-dataset/edit-dataset.resolver';

export default [
  {
    path: '',
    loadChildren: () => import('./index-dataset/index-dataset.routes'),
  },
  {
    path: 'create',
    resolve: {viewData: CreateDatasetResolver},
    loadChildren: () => import('./create-dataset/create-dataset.routes'),
  },
  {
    path: 'edit/:id',
    resolve: {viewData: EditDatasetResolver},
    loadChildren: () => import('./edit-dataset/edit-dataset.routes'),
  },
] as Route[];
