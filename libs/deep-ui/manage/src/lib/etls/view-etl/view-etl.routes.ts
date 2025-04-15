import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./view-etl.component').then((c) => c.ViewEtlComponent),
  },
] as Route[];
