import {Component, Input, input, output} from '@angular/core';
import {MeUser} from '@mobileye/material/src/lib/common';
import {MeAvatarItem} from '@mobileye/material/src/lib/components/avatar';
import {
  MeHeaderComponent,
  MeLinkItem,
  MeTourItem,
} from '@mobileye/material/src/lib/components/header';
import {MenuItem, MeSidenavComponent} from '@mobileye/material/src/lib/components/sidenav';

@Component({
  selector: 'me-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [MeHeaderComponent, MeSidenavComponent],
})
export class MeLayoutComponent {
  @Input()
  linksItems: Array<MeLinkItem>;

  @Input()
  tourItems: Array<MeTourItem>;

  @Input()
  menuItems: MenuItem[];

  @Input()
  userMenuItems: MeAvatarItem[];

  @Input()
  headerText: string;

  @Input()
  isUpdateAvailable: boolean;

  @Input()
  isSupportedBrowser: boolean;

  @Input()
  errorWarningText: string;

  isAdminUser = input<boolean>();

  adminSettingsClicked = output<void>();

  user = input<MeUser>(null);
}
