import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadChildren: () => import('./index-datasource/index-datasource.routes'),
  },
] as Route[];
