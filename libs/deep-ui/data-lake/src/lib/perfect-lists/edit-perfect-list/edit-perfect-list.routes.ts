import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./edit-perfect-list.component').then((c) => c.EditPerfectListComponent),
  },
] as Route[];
