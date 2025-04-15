import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./json-message-fiddle.component').then((x) => x.JsonMessageFiddleComponent),
  },
] as Route[];
