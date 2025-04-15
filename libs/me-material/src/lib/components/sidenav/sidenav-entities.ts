import {Params} from '@angular/router';

export interface MenuItem {
  title?: string;
  isSeparator?: boolean;
  route?: string;
  queryParams?: Params;
  icon?: string;
  selected?: boolean;
  subMenu?: boolean;
  isDisabled?: boolean;
}

export const SIDE_NAV_SESSION_KEY = 'sideNavState';
