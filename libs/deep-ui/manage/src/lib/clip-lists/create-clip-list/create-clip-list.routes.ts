import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./create-clip-list.component').then((c) => c.CreateClipListComponent),
  },
] as Route[];
