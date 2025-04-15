import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./create-mest.component').then((c) => c.CreateMestComponent),
  },
] as Route[];
