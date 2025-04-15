import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./index-datasource.component').then((c) => c.IndexDatasourceComponent),
  },
] as Route[];
