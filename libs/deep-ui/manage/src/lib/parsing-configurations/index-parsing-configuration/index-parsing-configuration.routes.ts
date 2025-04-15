import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./index-parsing-configuration.component').then(
        (c) => c.IndexParsingConfigurationComponent
      ),
  },
] as Route[];
