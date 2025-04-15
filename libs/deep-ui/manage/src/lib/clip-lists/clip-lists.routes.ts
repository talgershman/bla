import {Route} from '@angular/router';

import {CreateClipListResolver} from './create-clip-list/create-clip-list.resolver';
import {EditClipListResolver} from './edit-clip-list/edit-clip-list.resolver';
import {IndexClipListResolver} from './index-clip-list/index-clip-list.resolver';

export default [
  {
    path: '',
    resolve: {viewData: IndexClipListResolver},
    loadChildren: () => import('./index-clip-list/index-clip-list.routes'),
  },
  {
    path: 'create',
    resolve: {viewData: CreateClipListResolver},
    loadChildren: () => import('./create-clip-list/create-clip-list.routes'),
  },
  {
    path: 'edit/:id',
    resolve: {clipList: EditClipListResolver},
    loadChildren: () => import('./edit-clip-list/edit-clip-list.routes'),
  },
] as Route[];
