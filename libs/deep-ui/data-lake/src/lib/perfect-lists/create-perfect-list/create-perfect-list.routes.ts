import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./create-perfect-list.component').then((c) => c.CreatePerfectListComponent),
  },
] as Route[];
