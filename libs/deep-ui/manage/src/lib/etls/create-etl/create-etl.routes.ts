import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./create-etl.component').then((c) => c.CreateEtlComponent),
  },
] as Route[];
