import {MsalGuardConfiguration, MsalInterceptorConfiguration} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import {environment} from 'deep-ui/shared/environments';

const isIE =
  window.navigator.userAgent.indexOf('MSIE ') > -1 ||
  window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal

export function loggerCallback(logLevel: LogLevel, message: string): void {
  // eslint-disable-next-line
  switch (logLevel) {
    case LogLevel.Error:
      console.error(message);
      return;
    case LogLevel.Info:
      if (environment.isProduction) {
        return;
      }
      console.info(message);
      return;
    case LogLevel.Verbose:
      if (environment.isProduction) {
        return;
      }
      console.debug(message);
      return;
    case LogLevel.Warning:
      console.warn(message);
      return;
  }
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '9f2dac29-010f-4307-9a78-3813057c0c35',
      authority: 'https://login.microsoftonline.com/4f85ba13-6953-46a6-9c5b-7599fd80e9aa',
      redirectUri: environment.redirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE, // set to true for IE 11. Remove this line to use Angular Universal
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', [
    'user.read',
    'profile',
    'openid',
  ]);
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/*', ['GroupMember.Read.All']);
  protectedResourceMap.set('https://deep.mobileye.com/*', ['user.read']);
  protectedResourceMap.set('https://dev1.deep.mobileye.com/*', ['user.read']);
  protectedResourceMap.set('https://staging.deep.mobileye.com/*', ['user.read']);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['user.read'],
    },
    loginFailedRoute: '/login',
  };
}
