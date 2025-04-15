import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {Store} from '@ngrx/store';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {AgBaseIndexPageDirective} from 'deep-ui/shared/components/src/lib/common';
import {PerfectListTableComponent} from 'deep-ui/shared/components/src/lib/tables/perfect-list-table';
import {AppState, deletePerfectListErrorAction, PerfectListService} from 'deep-ui/shared/core';
import {PerfectList} from 'deep-ui/shared/models';
import {of, Subject} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

import {actionButtons, breadcrumbs} from './index-perfect-list-entites';

@Component({
  selector: 'de-index-perfect-list',
  templateUrl: './index-perfect-list.component.html',
  styleUrls: ['./index-perfect-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeBreadcrumbsComponent, AgEntityListComponent, PerfectListTableComponent],
})
export class IndexPerfectListComponent
  extends AgBaseIndexPageDirective<PerfectList>
  implements OnInit
{
  breadcrumbs = breadcrumbs;
  actionButtons = actionButtons;

  triggerTableRefresh = new Subject<void>();

  queryParams = this.activatedRoute?.snapshot?.queryParams || {};

  private perfectListService = inject(PerfectListService);
  private store: Store<AppState> = inject(Store);
  getTeamProp(): string {
    return 'team';
  }
  getIdProp(): string {
    return 'id';
  }
  getNameProp(): string {
    return 'name';
  }
  getEntityType(): string {
    return 'perfectList';
  }

  getPageName(): string {
    return 'index-perfect-list';
  }

  onDelete(tableAction?: MeAgTableActionItemEvent<PerfectList>): void {
    const id = this.getSelectedId(tableAction);
    const name = this.getSelectedName(tableAction);
    this.gridApi.setGridOption('loading', true);
    this.perfectListService
      .delete(id, name)
      .pipe(
        catchError((error) => of(error)),
        first(),
      )
      .subscribe((response) => {
        this.tableApiService?.hideOverlay();
        if (response?.error?.error) {
          this.store.dispatch(
            deletePerfectListErrorAction({
              title: 'Error',
              bodyText: response.error.error,
            }),
          );
        } else {
          this.triggerRefresh();
        }
      });
  }

  triggerRefresh(): void {
    this.triggerTableRefresh.next();
  }

  override onDownloadActionButtonClicked(action: MeAgTableActionItemEvent<PerfectList>): void {
    this.perfectListService.downloadPerfectList(action.selected);
  }
}
