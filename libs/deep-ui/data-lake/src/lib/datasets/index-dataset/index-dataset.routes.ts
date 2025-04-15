import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./index-dataset.component').then((c) => c.IndexDatasetComponent),
  },
] as Route[];
