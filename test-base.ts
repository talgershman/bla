import {ToastrModule} from 'ngx-toastr';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';

import {CacheOptionsToken, MeCacheService} from '@mobileye/material/src/lib/services/cache';
import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';
import {MeSnackbarComponent, MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {
  MeTourActionManager,
  MeTourActionManagerMock,
  MeTourService,
} from '@mobileye/material/src/lib/services/tour';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeWindowService} from '@mobileye/material/src/lib/services/window';
import {MeZipService} from '@mobileye/material/src/lib/services/zip';
import {NgModule} from '@angular/core';
import {Router} from '@angular/router';
import {
  DeepUtilService,
  isUserAdminSelector,
  selectSessionState,
  userSelector,
  userTeamsSelector,
} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideEnvironmentNgxMask} from 'ngx-mask';
import {MatDialogModule} from '@angular/material/dialog';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {HttpClientTestingModule, provideHttpClientTesting} from '@angular/common/http/testing';
import {V2OperationOptions} from '@fullstory/snippet';
import {MatIconTestingModule} from '@angular/material/icon/testing';

@NgModule()
export class FixNavigationTriggeredOutsideAngularZoneNgModule {
  constructor(_router: Router) {}
}

export const config = {
  imports: [
    FixNavigationTriggeredOutsideAngularZoneNgModule,
    MeSnackbarComponent,
    MatMenuModule,
    MatDialogModule,
    MatIconTestingModule,
    HttpClientTestingModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    provideMockStore({
      selectors: [
        {
          selector: selectSessionState,
          value: {
            isAdmin: true,
            teams: ['deep-fpa-objects', 'deep-fpa-rem'],
            rawTeams: ['deep-fpa-objects', 'deep-fpa-rem'],
            user: {
              userName: 'fakeUser@mobileye.com',
            },
          } as any,
        },
        {
          selector: userTeamsSelector,
          value: ['deep-fpa-objects', 'deep-fpa-rem'],
        },
        {
          selector: userSelector,
          value: {
            user: {
              userName: 'fakeUser@mobileye.com',
            },
          },
        },
        {
          selector: isUserAdminSelector,
          value: false,
        },
      ],
    }),
    MeErrorHandlerService,
    MeZipService,
    MeTourService,
    DeepUtilService,
    MePortalService,
    MeUserPreferencesService,
    MeCacheService,
    MeWindowService,
    MatSnackBar,
    MeSnackbarService,
    {
      provide: FullStoryService,
      useValue: {
        trackEvent: (_: V2OperationOptions['trackEvent']) => {},
        setPage: (pageName: string, _: Record<string, any> = {}) => {},
        getCurrentSessionUrl: async () => {
          return Promise.resolve('');
        },
      },
    },
    provideEnvironmentNgxMask(),
    {
      provide: CacheOptionsToken,
      useValue: {
        isLocalEnv: false,
        persistentKeyPrefix: 'deep_testing_cache',
      },
    },
    {
      provide: MeTimerService,
      useValue: {interval: () => of(1), timer: () => of(1)},
    },
    {
      provide: MeTourActionManager,
      useClass: MeTourActionManagerMock,
    },
    {
      provide: 'AG_GRID_LICENSE',
      useValue: environment.agGridLicense,
    },
    {
      provide: 'USER_PREFERENCES_OPTIONS',
      useValue: {
        url: environment.onPremProxyApi,
        user$: of({
          user: 'Demo user',
          userName: 'demo@mobileye.com',
        }),
      },
    },
  ],
};
