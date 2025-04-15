import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./view-parsing-configuration.component').then(
        (c) => c.ViewParsingConfigurationComponent
      ),
  },
] as Route[];
