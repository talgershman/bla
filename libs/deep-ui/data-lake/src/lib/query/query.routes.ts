import {Route} from '@angular/router';

import {CreateQueryResolver} from './create-query/create-query.resolver';

export default [
  {
    path: '',
    resolve: {viewData: CreateQueryResolver},
    loadChildren: () => import('./create-query/create-query.routes'),
  },
] as Route[];
