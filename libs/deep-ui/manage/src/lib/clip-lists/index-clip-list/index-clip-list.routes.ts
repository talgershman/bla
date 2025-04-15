import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./index-clip-list.component').then((c) => c.IndexClipListComponent),
  },
] as Route[];
