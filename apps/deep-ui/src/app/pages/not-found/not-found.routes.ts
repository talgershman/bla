import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./not-found.component').then((c) => c.NotFoundComponent),
  },
] as Route[];
