import {Route} from '@angular/router';

export default [
  {
    path: 'mests',
    loadChildren: () => import('./mests/mests.routes'),
  },
  {
    path: 'etls',
    loadChildren: () => import('./etls/etls.routes'),
  },
  {
    path: 'clip-lists',
    loadChildren: () => import('./clip-lists/clip-lists.routes'),
  },
  {
    path: 'parsing-configurations',
    loadChildren: () => import('./parsing-configurations/parsing-configurations.routes'),
  },
] as Route[];
