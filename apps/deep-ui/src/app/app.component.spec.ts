import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MAT_RIPPLE_GLOBAL_OPTIONS} from '@angular/material/core';
import {MatIconRegistry} from '@angular/material/icon';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter, RouterModule} from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalModule,
  MsalService,
} from '@azure/msal-angular';
import {MeLayoutComponent} from '@mobileye/material/src/lib/components/layout';
import {MeSidenavComponent, MeSidenavService} from '@mobileye/material/src/lib/components/sidenav';
import {MeToastComponent} from '@mobileye/material/src/lib/components/toast';
import {MeHttpErrorInterceptor} from '@mobileye/material/src/lib/http/http-error';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {MeCacheModule} from '@mobileye/material/src/lib/services/cache';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {MeRouteService} from '@mobileye/material/src/lib/services/route';
import {MeThemeManager} from '@mobileye/material/src/lib/services/theme-manager';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {MeWindowService} from '@mobileye/material/src/lib/services/window';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {
  cacheOptions,
  globalRippleConfig,
  globalTooltipConfig,
  MSALGuardConfigFactory,
  MSALInstanceFactory,
  MSALInterceptorConfigFactory,
  toasterConfig,
} from 'deep-ui/shared/configs';
import {BroadCastReducers, SessionReducers, userTeamsSelector} from 'deep-ui/shared/core';
import {ToastrModule} from 'ngx-toastr';

import {AppComponent} from './app.component';
import {MeCheckForUpdateService} from './check-for-update.service';
import {CreateJiraForDeepTeamDialogComponent} from './components/dialogs/create-jira-for-deep-team-dialog/create-jira-for-deep-team-dialog.component';

describe('AppComponent', () => {
  let spectator: Spectator<AppComponent>;
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: AppComponent,
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      MeLayoutComponent,
      RouterModule,
      MeToastComponent,
      MsalModule,
      CreateJiraForDeepTeamDialogComponent,
      MeSidenavComponent,
      HttpClientTestingModule,
      MeCacheModule.forRoot(cacheOptions),
      ToastrModule.forRoot(toasterConfig),
    ],
    providers: [
      MatIconRegistry,
      MeWindowService,
      MeRouteService,
      MeLoadingService,
      MeAzureGraphService,
      MeSidenavService,
      MeThemeManager,
      provideRouter([]),
      provideMockStore({
        initialState: {
          [BroadCastReducers.broadcastFeatureKey]: BroadCastReducers.initialState,
          [SessionReducers.sessionFeatureKey]: SessionReducers.initialState,
        },
      }),
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
        useClass: MeHttpErrorInterceptor,
        multi: true,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
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
      MsalService,
      MsalGuard,
      MsalBroadcastService,
      MeCheckForUpdateService,
      MeBroadcastService,
      MeTourService,
    ],
    mocks: [FullStoryService],
  });

  beforeEach((): void => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    store.overrideSelector(userTeamsSelector, ['deep-fpa-temp', 'deep-algo-temp2']);
  });

  it('should create the app', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it(`should have as title 'DEEP'`, () => {
    spectator.detectChanges();

    expect(spectator.component.title).toEqual('DEEP');
  });
});
