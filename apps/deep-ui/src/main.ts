import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ApplicationRef,
  enableProdMode,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import {MAT_RIPPLE_GLOBAL_OPTIONS} from '@angular/material/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '@angular/material/tooltip';
import {bootstrapApplication, enableDebugTools} from '@angular/platform-browser';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {PreloadAllModules, provideRouter, withPreloading} from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';
import {MeSidenavService} from '@mobileye/material/src/lib/components/sidenav';
import {
  ME_HTTP_ERROR_INTERCEPTOR_OPTIONS,
  MeHttpErrorInterceptor,
} from '@mobileye/material/src/lib/http/http-error';
import {MeTrimRequestBodyInterceptor} from '@mobileye/material/src/lib/http/trim-request-body';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {MeCacheModule} from '@mobileye/material/src/lib/services/cache';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';
import {MeRouteService} from '@mobileye/material/src/lib/services/route';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {MeThemeManager} from '@mobileye/material/src/lib/services/theme-manager';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {MeTourActionManager, MeTourService} from '@mobileye/material/src/lib/services/tour';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeWindowService} from '@mobileye/material/src/lib/services/window';
import {MeZipService} from '@mobileye/material/src/lib/services/zip';
import {provideEffects} from '@ngrx/effects';
import {provideStore, Store} from '@ngrx/store';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {USER_PREF_RE_TRIGGER_PREFIX} from 'deep-ui/shared/components/src/lib/common';
import {
  cacheOptions,
  globalRippleConfig,
  globalTooltipConfig,
  MSALGuardConfigFactory,
  MSALInstanceFactory,
  MSALInterceptorConfigFactory,
  toasterConfig,
} from 'deep-ui/shared/configs';
import {
  AppState,
  BroadcastEffects,
  CommonEffects,
  JobEffects,
  metaReducers,
  reducers,
  SnackbarEffects,
  ToastEffects,
  userSelector,
} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {MeIsUserAdminGuard, MeUpdateUserSessionGuard} from 'deep-ui/shared/guards';
import {
  FullStoryResponseTimeInterceptor,
  FullStorySessionInterceptor,
  UserGroupsInterceptor,
} from 'deep-ui/shared/http';
import {provideEnvironmentNgxMask} from 'ngx-mask';
import {provideToastr} from 'ngx-toastr';

import {AppComponent} from './app/app.component';
import {initialNavigation, routes} from './app/app-routing';

if (window.location.hostname !== 'localhost') {
  enableProdMode();
}

// eslint-disable-next-line
const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [
      provideZoneChangeDetection({
        eventCoalescing: true,
        runCoalescing: true,
      }),
      provideRouter(routes, withPreloading(PreloadAllModules), initialNavigation),
      provideHttpClient(withInterceptorsFromDi()),
      importProvidersFrom(MatDialogModule, MeCacheModule.forRoot(cacheOptions)),
      provideStore(reducers, {
        metaReducers,
      }),
      provideStoreDevtools({maxAge: 25, logOnly: environment.isProduction, connectInZone: true}),
      provideEffects(SnackbarEffects, CommonEffects, JobEffects, BroadcastEffects, ToastEffects),
      provideEnvironmentNgxMask(),
      MeWindowService,
      MeDownloaderService,
      MeRouteService,
      MeLoadingService,
      MeAzureGraphService,
      MeSidenavService,
      MeErrorHandlerService,
      MeZipService,
      MeUserPreferencesService,
      MatSnackBar,
      MeSnackbarService,
      MeThemeManager,
      {
        provide: 'AG_GRID_LICENSE',
        useValue: environment.agGridLicense,
      },
      {
        provide: 'USER_PREFERENCES_OPTIONS',
        useFactory: (store: Store<AppState>) => {
          return {
            url: environment.onPremProxyApi,
            user$: store.select(userSelector),
            keysBlackList: [USER_PREF_RE_TRIGGER_PREFIX],
          };
        },
        deps: [Store],
      },
      {
        provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
        useValue: globalTooltipConfig,
      },
      {
        provide: MAT_RIPPLE_GLOBAL_OPTIONS,
        useValue: globalRippleConfig,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MeTrimRequestBodyInterceptor,
        multi: true,
      },
      {
        provide: ME_HTTP_ERROR_INTERCEPTOR_OPTIONS,
        useValue: {
          healthCheckUrl: `${environment.stateReflectorApi}health/`,
          healthCheckEndPoint: `deep.`,
          onPremUrl: environment.onPremProxyApi,
        },
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MeHttpErrorInterceptor,
        deps: [ME_HTTP_ERROR_INTERCEPTOR_OPTIONS, HttpClient, MeErrorHandlerService],
        multi: true,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: UserGroupsInterceptor,
        multi: true,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: FullStorySessionInterceptor,
        multi: true,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: FullStoryResponseTimeInterceptor,
        multi: true,
      },
      {
        provide: MSAL_INSTANCE,
        useFactory: MSALInstanceFactory,
      },
      {
        provide: MSAL_GUARD_CONFIG,
        useFactory: MSALGuardConfigFactory,
      },
      {
        provide: MSAL_INTERCEPTOR_CONFIG,
        useFactory: MSALInterceptorConfigFactory,
      },
      FullStoryResponseTimeInterceptor,
      MsalService,
      MsalGuard,
      MsalBroadcastService,
      MeBroadcastService,
      MeTourService,
      MeTourActionManager,
      MePortalService,
      MeUpdateUserSessionGuard,
      MeIsUserAdminGuard,
      MeTimerService,
      provideAnimationsAsync(),
      provideToastr(toasterConfig),
    ],
  });

bootstrap()
  .then((moduleRef) => {
    // moduleRef.bootstrap(MsalRedirectComponent)
    if (environment.isDevelopment) {
      const applicationRef = moduleRef.injector.get(ApplicationRef);
      const componentRef = applicationRef.components[0];
      // allows to run `ng.profiler.timeChangeDetection();`
      enableDebugTools(componentRef);
    }
  })
  .catch((err) => console.log(err));
