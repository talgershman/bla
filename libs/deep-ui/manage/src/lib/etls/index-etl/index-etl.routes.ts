import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./index-etl.component').then((c) => c.IndexEtlComponent),
  },
] as Route[];
