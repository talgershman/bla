import {Component, inject, OnInit} from '@angular/core';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {AgBaseIndexPageDirective} from 'deep-ui/shared/components/src/lib/common';
import {ClipListTableComponent} from 'deep-ui/shared/components/src/lib/tables/clip-list-table';
import {ClipListService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';
import {of, Subject} from 'rxjs';
import {catchError, first, switchMap, tap} from 'rxjs/operators';

import {actionButtons, breadcrumbs} from './index-clip-list-entities';

@UntilDestroy()
@Component({
  selector: 'de-index-clip-list',
  templateUrl: './index-clip-list.component.html',
  styleUrls: ['./index-clip-list.component.scss'],
  imports: [MeBreadcrumbsComponent, AgEntityListComponent, ClipListTableComponent],
})
export class IndexClipListComponent extends AgBaseIndexPageDirective<ClipList> implements OnInit {
  breadcrumbs = breadcrumbs;
  actionButtons = actionButtons;

  triggerTableRefresh = new Subject<void>();

  private clipListService = inject(ClipListService);
  private snackbarService = inject(MeSnackbarService);
  private downloaderService = inject(MeDownloaderService);
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
    return 'clipList';
  }

  getPageName(): string {
    return 'index-clip-list';
  }
  onDownloadActionButtonClicked(action: MeAgTableActionItemEvent<ClipList>): void {
    this.clipListService
      .downloadClipList(action.selected)
      .pipe(
        switchMap((response: {url: string}) => this.downloaderService.downloadFile(response.url)),
        catchError(() => of(null)),
        tap(() => this.snackbarService.onDownloadStarted()),
        first(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onDelete(tableAction?: MeAgTableActionItemEvent<ClipList>): void {
    const id = this.getSelectedId(tableAction);
    this.gridApi.setGridOption('loading', true);
    this.clipListService
      .delete(id)
      .pipe(
        catchError(() => of(null)),
        first(),
        untilDestroyed(this),
      )
      .subscribe((clipList: ClipList) => {
        this.tableApiService?.hideOverlay();
        if (clipList) {
          this.snackbarService.onDelete(clipList.name);
          this.triggerTableRefresh.next();
        }
      });
  }
}
