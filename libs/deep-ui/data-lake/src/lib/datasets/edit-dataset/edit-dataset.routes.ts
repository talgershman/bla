import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./edit-dataset.component').then((c) => c.EditDatasetComponent),
  },
] as Route[];
