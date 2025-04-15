import {Route} from '@angular/router';
import {MeIsUserAdminGuard} from 'deep-ui/shared/guards';

export default [
  {
    path: 'json-message-fiddle',
    canMatch: [MeIsUserAdminGuard],
    loadChildren: () => import('./json-message-fiddle/json-message-fiddle.routes'),
  },
] as Route[];
