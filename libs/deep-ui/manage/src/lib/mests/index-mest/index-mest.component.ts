import {Component, inject, OnInit} from '@angular/core';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {AgBaseIndexPageDirective} from 'deep-ui/shared/components/src/lib/common';
import {MestTableComponent} from 'deep-ui/shared/components/src/lib/tables/mest-table';
import {MestService} from 'deep-ui/shared/core';
import {MEST} from 'deep-ui/shared/models';
import {of, Subject} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

import {actionButtons, breadcrumbs} from './index-mest-entites';

@Component({
  selector: 'de-index-mest',
  templateUrl: './index-mest.component.html',
  styleUrls: ['./index-mest.component.scss'],
  imports: [MeBreadcrumbsComponent, AgEntityListComponent, MestTableComponent],
})
export class IndexMestComponent extends AgBaseIndexPageDirective<MEST> implements OnInit {
  breadcrumbs = breadcrumbs;
  actionButtons = actionButtons;

  triggerTableRefresh = new Subject<void>();

  teamProp = 'group'; // todo: remove once backend is ready with team prop in all entities

  private mestService = inject(MestService);
  getTeamProp(): string {
    return 'group';
  }
  getIdProp(): string {
    return 'id';
  }
  getNameProp(): string {
    return 'nickname';
  }
  getEntityType(): string {
    return 'mest';
  }

  getPageName(): string {
    return 'index-mest';
  }
  onDelete(tableAction?: MeAgTableActionItemEvent<MEST>): void {
    const id = this.getSelectedId(tableAction);
    const name = this.getSelectedName(tableAction);
    this.gridApi.setGridOption('loading', true);
    this.mestService
      .delete(id, name)
      .pipe(
        catchError(() => of(null)),
        first(),
      )
      .subscribe((response) => {
        this.tableApiService?.hideOverlay();
        if (response) {
          this.triggerRefresh();
        }
      });
  }

  triggerRefresh(): void {
    this.triggerTableRefresh.next();
  }
}
