import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./edit-clip-list.component').then((c) => c.EditClipListComponent),
  },
] as Route[];
