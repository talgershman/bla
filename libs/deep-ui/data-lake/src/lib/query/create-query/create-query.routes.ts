import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./create-query.component').then((c) => c.CreateQueryComponent),
  },
] as Route[];
