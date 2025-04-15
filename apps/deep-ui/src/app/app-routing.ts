import {
  Routes,
  UrlMatchResult,
  UrlSegment,
  withDisabledInitialNavigation,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import {MsalGuard} from '@azure/msal-angular';
import {BrowserUtils} from '@azure/msal-browser';
import {environment} from 'deep-ui/shared/environments';
import {MeUpdateUserSessionGuard} from 'deep-ui/shared/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: environment.authenticatedDefaultPath,
    pathMatch: 'full',
  },
  {
    path: 'login',
    redirectTo: environment.authenticatedDefaultPath,
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [MsalGuard, MeUpdateUserSessionGuard],
    children: [
      {
        // old default route, will remove in the future
        path: 'validation-jobs',
        redirectTo: 'jobs',
        pathMatch: 'full',
      },
      {
        matcher: (segments: UrlSegment[]): UrlMatchResult | null => {
          if (segments.length && segments[0].path === 'data') {
            segments[0].path = 'data-lake';
            return {consumed: segments, posParams: {}};
          }
          return null;
        },
        redirectTo: 'data-lake',
        pathMatch: 'full',
      },
      {
        // old default route, will remove in the future
        path: 'etl-jobs',
        redirectTo: 'jobs',
        pathMatch: 'full',
      },
      {
        path: 'jobs',
        loadChildren: () => import('deep-ui/jobs').then((m) => m.JobsRoutes),
      },
      {
        path: 'manage',
        loadChildren: () => import('deep-ui/manage').then((m) => m.ManageRoutes),
      },
      {
        path: 'data-lake',
        loadChildren: () => import('deep-ui/data-lake').then((m) => m.DataLakeRoutes),
      },
      {
        path: 'admin',
        loadChildren: () => import('deep-ui/admin').then((m) => m.AdminRoutes),
      },
    ],
  },
  {
    path: '**',
    loadChildren: () => import('./pages/not-found/not-found.routes'),
  },
];

export const initialNavigation =
  !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup()
    ? withEnabledBlockingInitialNavigation() // Set to enabledBlocking to use Angular Universal
    : withDisabledInitialNavigation();
