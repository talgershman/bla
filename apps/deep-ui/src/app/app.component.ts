import {AsyncPipe} from '@angular/common';
import {Component, inject, OnInit, ViewContainerRef} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {Router, RouterOutlet} from '@angular/router';
import {MsalBroadcastService, MsalService} from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import {FullStory, init as initFullStory} from '@fullstory/browser';
import {MeUser} from '@mobileye/material/src/lib/common';
import {MeTourItem} from '@mobileye/material/src/lib/components/header';
import {MeLayoutComponent} from '@mobileye/material/src/lib/components/layout';
import {BroadcastNameEnum, MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeThemeManager} from '@mobileye/material/src/lib/services/theme-manager';
import {
  ME_TOURS_USER_PREFERENCE_KEY,
  MeTour,
  MeTourService,
} from '@mobileye/material/src/lib/services/tour';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import {startOfToday} from 'date-fns';
import {
  allTours,
  fullStoryOrgDevId,
  fullStoryOrgProdId,
  getUserMenuItems,
  linkItems,
  menuItems,
} from 'deep-ui/shared/configs';
import {
  AppState,
  AssetManagerService,
  broadcastEffectsActions,
  DataRetentionService,
  selectIsNewUIVersion,
  selectSessionState,
  setActiveUserFromApp,
  userSelector,
  userTeamsSelector,
} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {BehaviorSubject, combineLatest, Observable, of, Subject} from 'rxjs';
import {catchError, distinctUntilChanged, filter, map, takeUntil, tap} from 'rxjs/operators';

import {AdminSettingsDialogComponent} from './components/dialogs/admin-settings-dialog/admin-settings-dialog.component';
import {CreateJiraForDeepTeamDialogComponent} from './components/dialogs/create-jira-for-deep-team-dialog/create-jira-for-deep-team-dialog.component';
import {LoginComponent} from './pages/login/login.component';

enum LoginTemplateTypes {
  InApp,
  LoginIn,
  Loading,
  Error,
}

const FIRST_SEEN_USER_PREFERENCE_KEY = 'firstSeen';

const BROWSER_WARNING_MSG =
  'DEEP only support Chromium based browsers and Firefox. Note: if you keep using this browser - some things might not work.';

const DEEP_TEAMS_WARNING_MSG =
  'It looks like your user is not assigned to any DEEP team. Open a Jira ticket for DEEP by click the user menu on the top right corner.';

@UntilDestroy()
@Component({
  selector: 'de-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [MeLayoutComponent, RouterOutlet, LoginComponent, AsyncPipe, MatFormFieldModule],
})
export class AppComponent implements OnInit {
  private msalService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private assetManagerService = inject(AssetManagerService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private broadcastService = inject(MeBroadcastService);
  private tourService = inject(MeTourService);
  private dataRetentionService = inject(DataRetentionService);
  private viewContainerRef = inject(ViewContainerRef);
  private store = inject<Store<AppState>>(Store);
  private userPreferencesService = inject(MeUserPreferencesService);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private fullStoryService = inject(FullStoryService);
  private themeManager = inject(MeThemeManager);

  errorHeaderMsg: string;

  window = window;

  isIframe = false;

  title = 'DEEP';

  environment = environment;

  LoginTemplateTypes = LoginTemplateTypes;

  userMenuItems$;

  menuItems = menuItems;

  linkItems = linkItems;

  tourItems: Array<MeTourItem> = [];

  isUpdateAvailable$: Observable<boolean>;

  isSupportedBrowser: boolean;

  msalError: string;

  user: MeUser;

  isAdminUser = false;

  private isLoggedIn = new BehaviorSubject<LoginTemplateTypes>(LoginTemplateTypes.Loading);

  isLoggedIn$ = this.isLoggedIn.asObservable().pipe(distinctUntilChanged());

  private readonly _destroying$ = new Subject<void>();

  private userTeams: Array<string> = [];

  constructor() {
    this.fullStoryService.log({
      msg: `UI version - ${this.environment.packageVersion}`,
      level: 'info',
    });
    this.isIframe = window !== window.parent && !window.opener;
    this._initFullStory();
    this._bindEvents();
    this.isUpdateAvailable$ = this.store.select(selectIsNewUIVersion);
    this._bindBoardCastEvents();
  }

  ngOnInit(): void {
    this._initUserMenu();
    this._checkForNoDeepTeamWarning();
    this._setHeaderWarningText();
    this._createTours();
    this._registerIcons();
  }

  onAdminSettingClicked(): void {
    this.dialog.open(AdminSettingsDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
    });
  }

  private _initFullStory(): void {
    const isProd = window.location.hostname === 'deep.mobileye.com';
    const isFullStoryDisabled = this.isFullStoryDisabled();
    this.fullStoryService.setDisableService(isFullStoryDisabled);
    if (!isFullStoryDisabled) {
      initFullStory(
        {
          orgId: isProd ? fullStoryOrgProdId : fullStoryOrgDevId,
          devMode: false,
          startCaptureManually: true,
          namespace: 'deep-ui',
        },
        () => {
          this._handleFSInit();
        },
      );
    }
  }

  private _handleFSInit(): void {
    this.fullStoryService.setFullStoryToActive();
    this.fullStoryService.log({msg: 'FS INIT', level: 'info'});
    this._setFullStoryUser(this.user);
    this.fullStoryService.flushAll();
  }

  private _setFullStoryUser(user: MeUser): void {
    this.fullStoryService.log({msg: `User: ${this.user?.userName}`, level: 'info'});
    if (!this.user?.userName) {
      return;
    }
    FullStory('setIdentity', {
      uid: user?.userName || 'User temp',
      properties: {
        displayName: user?.name,
        userName: user?.userName,
        email: user?.userName,
      },
      schema: {
        properties: {
          displayName: 'str',
          userName: 'str',
          email: 'str',
        },
      },
    });
  }

  private _registerIcons(): void {
    this.matIconRegistry
      .addSvgIcon(
        'gitlab',
        this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/gitlab.svg'),
      )
      .addSvgIcon(
        'suggestion',
        this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/suggestion.svg'),
      );
  }

  private _initUserMenu(): void {
    this.userMenuItems$ = this.store.select(selectSessionState).pipe(
      map((state: any) =>
        getUserMenuItems(state.user, state.isAdmin, {
          userTeams: state.rawTeams,
          logout: this._logout.bind(this),
          deepTeamDialog: this._openDeepTeamDialog.bind(this),
          goToJsonFiddleRoute: this._goToJsonFiddleRoute.bind(this),
        }),
      ),
    );
  }

  private _checkForNoDeepTeamWarning(): void {
    this._getUsersTeams()
      .pipe(untilDestroyed(this))
      .subscribe((teams) => {
        //clear the previous error if found that user has a team
        if (this.errorHeaderMsg === DEEP_TEAMS_WARNING_MSG && teams.length) {
          this.errorHeaderMsg = '';
        } else if (!this.errorHeaderMsg && !teams.length) {
          this.errorHeaderMsg = DEEP_TEAMS_WARNING_MSG;
        }
      });
  }

  private _getUsersTeams(): Observable<Array<string>> {
    return this.store
      .select(userTeamsSelector)
      .pipe(tap((teams: Array<string>) => (this.userTeams = teams)));
  }

  private _getCurrentUser(): Observable<MeUser> {
    return this.store.select(userSelector);
  }

  private _bindBoardCastEvents(): void {
    this.broadcastService.createBroadcast(BroadcastNameEnum.New_Version_Indicator);
    this._listenBroadcastNewUIVersionDetected();
  }

  private _bindEvents(): void {
    this._bindMsalEvents();
    this.isUpdateAvailable$ = this.store.select(selectIsNewUIVersion);
    this.broadcastService.createBroadcast(BroadcastNameEnum.New_Version_Indicator);
    this._listenBroadcastNewUIVersionDetected();
    this._bindFullStoryEvents();
  }

  private _bindFullStoryEvents(): void {
    if (this.isFullStoryDisabled()) {
      return;
    }
    this._bindFSUserIdEvent();
    this._bindFSUserPropsEvent();
  }

  private _bindFSUserIdEvent(): void {
    this._getCurrentUser()
      .pipe(
        untilDestroyed(this),
        filter((user) => !!user),
        tap(() => {
          this.fullStoryService.startCapture();
        }),
      )
      .subscribe();
  }

  private _bindFSUserPropsEvent(): void {
    combineLatest([this._getTheme(), this._getUsersTeams()])
      .pipe(untilDestroyed(this))
      .subscribe(([isDarkMode, teams]) => {
        const firstSeen = this._getFirstSeen();
        this.fullStoryService.log({
          msg: `User teams: ${teams}, is dark mode: ${isDarkMode}`,
          level: 'info',
        });
        FullStory('setProperties', {
          type: 'user',
          properties: {
            teams: teams,
            isDarkMode: isDarkMode,
            ...(firstSeen && {firstSeen: firstSeen}),
          },
          schema: {
            properties: {
              teams: 'strs',
              isDarkMode: 'bool',
              ...(firstSeen && {firstSeen: 'date'}),
            },
          },
        });
      });
  }

  private _bindToursEvents(): void {
    this.tourService
      .getToursObservable()
      .pipe(untilDestroyed(this))
      .subscribe((tours: Array<MeTour>) => {
        const toursPref = this.userPreferencesService.getUserPreferencesByKey(
          ME_TOURS_USER_PREFERENCE_KEY,
        );
        const arrIds = this.tourItems.map((item) => item.title) || [];
        for (const [index, tour] of tours.entries()) {
          if (!arrIds.includes(tour.menuTitle)) {
            const item: MeTourItem = {
              title: tour.menuTitle,
              watched: toursPref?.[tour.id]?.watched || tour.watched,
              isNew: tour.isNew,
              route: tour.route,
              click: this._onTourITemClick.bind(this),
            };
            this.tourItems = [...this.tourItems, item];
          } else {
            this.tourItems[index].watched = toursPref?.[tour.id]?.watched || tour.watched;
            this.tourItems = [...this.tourItems];
          }
        }
      });
  }

  private _onTourITemClick(item: MeTourItem): void {
    this.router.navigate(item.route, {
      state: {startTour: true},
    });
  }

  private _bindMsalEvents(): void {
    this.msalService.handleRedirectObservable().pipe(untilDestroyed(this)).subscribe();
    this.msalService
      .handleRedirectObservable()
      .pipe(
        catchError((err) => of({error: err})),
        takeUntil(this._destroying$),
      )
      .subscribe((response: AuthenticationResult) => {
        if (!!response && 'error' in response) {
          console.error(response.error);
        }
      });
    // Optional - This will enable ACCOUNT_ADDED and ACCOUNT_REMOVED events emitted when a user logs in or out of another tab or window
    this.msalService.instance.enableAccountStorageEvents();

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.ACCOUNT_ADDED ||
            msg.eventType === EventType.ACCOUNT_REMOVED,
        ),
        catchError((err) => of({error: err})),
        untilDestroyed(this),
      )
      .subscribe((result: EventMessage) => {
        if (result.error) {
          console.error(result.error);
        } else if (this.msalService.instance.getAllAccounts().length === 0) {
          window.location.pathname = '/';
          return;
        }
        const payload = result.payload as AuthenticationResult;
        this.msalService.instance.setActiveAccount(payload.account);
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        catchError((err) => of({error: err})),
        untilDestroyed(this),
      )
      .subscribe((response: any) => {
        if (typeof response !== 'string') {
          this.msalError = response.error;
          this.isLoggedIn.next(LoginTemplateTypes.Error);
        } else {
          this.msalError = null;
          this._setTemplateByUserState();
        }
      });
  }

  private _setHeaderWarningText(): void {
    const isSupportedBrowser = this._isChromiumBrowser() || this._isFirefoxBrowser();
    if (!isSupportedBrowser) {
      this.errorHeaderMsg = BROWSER_WARNING_MSG;
    }
  }

  private _createTours(): void {
    this.tourService.createTours(allTours, this.viewContainerRef);
    this._bindToursEvents();
  }

  private _onBroadcastNewMessage(ev: MessageEvent): void {
    if (ev.data?.showNewIndicator) {
      this.store.dispatch(broadcastEffectsActions.updateOtherTabs());
    } else if (ev.data?.reload) {
      location.reload();
    }
  }

  private _listenBroadcastNewUIVersionDetected(): void {
    this.broadcastService.onMessage(
      BroadcastNameEnum.New_Version_Indicator,
      this._onBroadcastNewMessage.bind(this),
    );
  }

  private async _logout(): Promise<void> {
    this.store.dispatch(setActiveUserFromApp({activeAccount: null}));
    const activeAccount = this._getAccount();
    await this.msalService.logoutRedirect({
      account: activeAccount,
      postLogoutRedirectUri: environment.redirectUri,
    });
  }

  private _isChromiumBrowser(): boolean {
    // eslint-disable-next-line
    return !!window['chrome'];
  }

  private _isFirefoxBrowser(): boolean {
    // eslint-disable-next-line
    return typeof window['InstallTrigger'] !== 'undefined';
  }

  private _setTemplateByUserState(): void {
    const activeAccount = this._getAccount();
    if (activeAccount) {
      this._sendStartAppRequests();
      this._updateUserInSession(activeAccount);
      this._getUsersTeams()
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          if (this._showUserGroupsWarningDialog()) {
            if (!activeAccount?.idTokenClaims?.groups) {
              this._logout();
            } else {
              this._openDeepTeamDialog();
            }
          }
        });
      this.isLoggedIn.next(LoginTemplateTypes.InApp);
    } else {
      this.isLoggedIn.next(LoginTemplateTypes.LoginIn);
    }
  }

  private _goToJsonFiddleRoute(): void {
    this.router.navigate(['./admin/json-message-fiddle']);
  }

  private _openDeepTeamDialog(): void {
    combineLatest([this._getCurrentUser(), this._getUsersTeams()])
      .pipe(untilDestroyed(this))
      .subscribe(([, teams]) => {
        const refComp = this.dialog.open(CreateJiraForDeepTeamDialogComponent, {
          autoFocus: false,
          restoreFocus: false,
          panelClass: 'dialog-panel-no-padding',
        });
        refComp.componentInstance.userTeams = teams;
        const shortUser = this.user.userName.split('@')[0];
        refComp.componentInstance.currentUser = shortUser;
      });
  }

  private _updateUserInSession(activeAccount: AccountInfo): void {
    this.msalService.instance.setActiveAccount(activeAccount);
    this.user = {
      name: activeAccount?.name,
      userName: activeAccount?.username,
    };
    this.store.dispatch(setActiveUserFromApp({activeAccount}));
    this.setInitialAdminUser(activeAccount);
  }

  private setInitialAdminUser(activeAccount: AccountInfo): void {
    const idToken: any = activeAccount.idTokenClaims as any;
    const groups = idToken?.groups?.map((group) => group.trim()) || [];
    this.isAdminUser = groups.includes('deep-admin');
  }

  private _getAccount(): AccountInfo {
    let activeAccount = this.msalService.instance.getActiveAccount();
    if (!activeAccount && this.msalService.instance.getAllAccounts().length === 1) {
      activeAccount = this.msalService.instance.getAllAccounts()[0];
    }
    return activeAccount;
  }

  private _showUserGroupsWarningDialog(): boolean {
    return this.userTeams.length === 0;
  }

  private _sendStartAppRequests(): void {
    this.assetManagerService.getTechnologiesOptions().subscribe();
    this.dataRetentionService.getDataRetentionConfig().subscribe();
  }

  private _getTheme(): Observable<boolean> {
    return this.themeManager.isDark$;
  }

  private isFullStoryDisabled(): boolean {
    const isLocalHost = window.location.hostname === 'localhost';
    return environment.isProduction && isLocalHost;
  }

  private _getFirstSeen(): Date {
    const firstSeen = this.userPreferencesService.getUserPreferencesByKey(
      FIRST_SEEN_USER_PREFERENCE_KEY,
      true,
    );
    if (firstSeen === 'ignore') {
      return null;
    }
    if (firstSeen) {
      return firstSeen;
    }
    const today = startOfToday();
    this.userPreferencesService.addUserPreferences(FIRST_SEEN_USER_PREFERENCE_KEY, today);
    return today;
  }
}
