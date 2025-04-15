import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';

import {MeBreadcrumbItem} from './breadcrumbs-entities';

@Component({
  selector: 'me-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, MatButtonModule, MePortalTargetDirective],
})
export class MeBreadcrumbsComponent {
  @Input()
  breadcrumbs: MeBreadcrumbItem[];

  @Input()
  showTourButton: boolean;

  @Output()
  tourClick = new EventEmitter<void>();
}
