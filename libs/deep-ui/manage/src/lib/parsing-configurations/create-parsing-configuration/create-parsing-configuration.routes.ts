import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./create-parsing-configuration.component').then(
        (c) => c.CreateParsingConfigurationComponent
      ),
  },
] as Route[];
