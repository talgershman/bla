import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import {MeAvatarItem} from '@mobileye/material/src/lib/components/avatar';
import {MeSidenavService} from '@mobileye/material/src/lib/components/sidenav';

import {MeLinkItem} from './header-entities';

@Component({
  selector: 'me-header',
  template: '<div></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderMockComponent {
  sideNavService = inject(MeSidenavService);

  @Input()
  userMenuItems: MeAvatarItem[];

  @Input()
  headerText: string;

  @Input()
  linksItems: Array<MeLinkItem>;

  @Output()
  toggleSideNav = new EventEmitter<boolean>();
}
