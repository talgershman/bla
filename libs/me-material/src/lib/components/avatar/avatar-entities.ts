import {MeUser} from '@mobileye/material/src/lib/common';

export interface MeAvatarItem {
  type: 'button' | 'separator' | 'profile' | 'header' | 'sub-header';
  title?: string;
  user?: MeUser;
  action?(): void;
}
