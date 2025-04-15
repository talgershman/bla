import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./edit-mest.component').then((c) => c.EditMestComponent),
  },
] as Route[];
