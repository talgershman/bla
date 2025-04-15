import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {copyArrayObject} from '@mobileye/material/src/lib/utils';
import {DeepUtilService} from 'deep-ui/shared/core';

import {EntityListActionButton} from './entity-list-entites';

@Component({
  selector: 'de-ag-entity-list',
  templateUrl: './ag-entity-list.component.html',
  styleUrls: ['./ag-entity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MeTooltipDirective, MatIconModule, MePortalSrcDirective],
})
export class AgEntityListComponent<T> {
  @Input('actionsButtons')
  set setActionButtons(actionsButtons: EntityListActionButton<T>[]) {
    const buttons: EntityListActionButton<T>[] = copyArrayObject(actionsButtons);
    const btn = buttons.find((btn: EntityListActionButton<T>) => btn.id === 'delete');

    if (btn) {
      if (btn.isDisabled) {
        const staticIsDisabled = btn.isDisabled;
        btn.isDisabled = (entity: T) =>
          staticIsDisabled(entity) ||
          !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(entity, this.teamProperty);
      } else {
        btn.isDisabled = (entity: T) =>
          !this.selected?.length ||
          !this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(entity, this.teamProperty);
      }
      btn.tooltip = (entity: T) => {
        if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(entity, this.teamProperty)) {
          return `You are not allowed to delete this, only a member of the team: ${
            entity[this.teamProperty]
          } can delete this.`;
        }
        return '';
      };
    }
    this.actionsButtons = buttons;
  }

  @Input()
  selected: Array<T>;

  @Input()
  teamProperty: 'group' | 'team' = 'team';

  @Output()
  actionButtonClicked = new EventEmitter<string>();

  actionsButtons: EntityListActionButton<T>[];

  private deepUtilService = inject(DeepUtilService);
}
