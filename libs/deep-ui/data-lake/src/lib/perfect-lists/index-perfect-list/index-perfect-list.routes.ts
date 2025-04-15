import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./index-perfect-list.component').then((c) => c.IndexPerfectListComponent),
  },
] as Route[];
