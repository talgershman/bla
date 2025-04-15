import {Route} from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./jobs.component').then((c) => c.JobsComponent),
  },
] as Route[];
