import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./index-mest.component').then((c) => c.IndexMestComponent),
  },
] as Route[];
