import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./create-dataset.component').then((c) => c.CreateDatasetComponent),
  },
] as Route[];
