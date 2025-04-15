import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MenuItem} from './sidenav-entities';

@Component({
  selector: 'me-sidenav',
  template: '<div></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavMockComponent {
  @Input() menuItems: MenuItem[];
}
