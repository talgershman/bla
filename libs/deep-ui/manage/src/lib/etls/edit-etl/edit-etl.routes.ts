import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./edit-etl.component').then((c) => c.EditEtlComponent),
  },
] as Route[];
