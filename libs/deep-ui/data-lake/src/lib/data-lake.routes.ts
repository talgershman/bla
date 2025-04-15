import {Route} from '@angular/router';

export default [
  {
    path: 'datasets',
    loadChildren: () => import('./datasets/datasets.routes'),
  },
  {
    path: 'data-sources',
    loadChildren: () => import('./datasources/datasources.routes'),
  },
  {
    path: 'perfect-lists',
    loadChildren: () => import('./perfect-lists/perfect-lists.routes'),
  },
  {
    path: 'query',
    loadChildren: () => import('./query/query.routes'),
  },
] as Route[];
