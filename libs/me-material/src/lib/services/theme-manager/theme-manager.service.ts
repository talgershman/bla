import {DOCUMENT} from '@angular/common';
import {inject, Injectable} from '@angular/core';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {take} from 'rxjs/operators';

const THEME_TYPE_PREFERENCE_KEY = 'theme-type';
export type THEME_TYPES = 'dark' | 'light';

@Injectable()
export class MeThemeManager {
  private document = inject(DOCUMENT);
  private userPreferencesService = inject(MeUserPreferencesService);
  private _isDarkSub = new BehaviorSubject(false);
  isDark$ = this._isDarkSub.asObservable();
  private _window = this.document.defaultView;

  constructor() {
    this.setTheme(this.getPreferredTheme());
    if (this._window !== null && this._window.matchMedia) {
      this._window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = this.getStoredTheme();
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
          this.setTheme(this.getPreferredTheme());
        }
      });
    }
  }

  getStoredTheme(): THEME_TYPES {
    const type: THEME_TYPES = this.userPreferencesService.getUserPreferencesByKey(
      THEME_TYPE_PREFERENCE_KEY,
    ) as THEME_TYPES;
    if (!type) {
      return 'light';
    }
    return type;
  }
  setStoredTheme(theme: THEME_TYPES) {
    this.userPreferencesService.addUserPreferences(THEME_TYPE_PREFERENCE_KEY, theme);
  }

  getPreferredTheme(): THEME_TYPES {
    const storedTheme = this.getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    if (this._window !== null && this._window.matchMedia) {
      return this._window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  setTheme(theme: string): void {
    if (this._window !== null && this._window.matchMedia) {
      if (theme === 'auto' && this._window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.document.documentElement.setAttribute('data-bs-theme', 'dark');
        this._isDarkSub.next(true);
      } else {
        this.document.documentElement.setAttribute('data-bs-theme', theme);
        this._isDarkSub.next(theme === 'dark');
      }
      this.setMaterialTheme();
    }
  }

  setMaterialTheme() {
    this.isDark$.pipe(take(1)).subscribe((isDark) => {
      if (isDark) {
        const href = 'dark-theme.css';
        getLinkElementForKey('dark-theme').setAttribute('href', href);
        this.document.documentElement.classList.add('dark-theme');
      } else {
        this.removeStyle('dark-theme');
        this.document.documentElement.classList.remove('dark-theme');
      }
    });
  }

  removeStyle(key: string) {
    const existingLinkElement = getExistingLinkElementByKey(key);
    if (existingLinkElement) {
      this.document.head.removeChild(existingLinkElement);
    }
  }

  changeTheme(theme: THEME_TYPES) {
    this.setStoredTheme(theme);
    this.setTheme(theme);
  }
}

function getLinkElementForKey(key: string) {
  return getExistingLinkElementByKey(key) || createLinkElementWithKey(key);
}

function getExistingLinkElementByKey(key: string) {
  return document.head.querySelector(`link[rel="stylesheet"].${getClassNameForKey(key)}`);
}

function createLinkElementWithKey(key: string) {
  const linkEl = document.createElement('link');
  linkEl.setAttribute('rel', 'stylesheet');
  linkEl.classList.add(getClassNameForKey(key));
  document.head.appendChild(linkEl);
  return linkEl;
}

function getClassNameForKey(key: string) {
  return `style-manager-${key}`;
}
