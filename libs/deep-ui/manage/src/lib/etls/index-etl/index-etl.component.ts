import {Component, inject} from '@angular/core';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {AgBaseIndexPageDirective} from 'deep-ui/shared/components/src/lib/common';
import {
  EtlCustomActions,
  EtlTableComponent,
} from 'deep-ui/shared/components/src/lib/tables/etl-table';
import {EtlService} from 'deep-ui/shared/core';
import {ETL} from 'deep-ui/shared/models';
import {of, Subject} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

import {actionButtons, breadcrumbs} from './index-etl-entities';

@Component({
  selector: 'de-index-etl',
  templateUrl: './index-etl.component.html',
  styleUrls: ['./index-etl.component.scss'],
  imports: [MeBreadcrumbsComponent, AgEntityListComponent, EtlTableComponent],
})
export class IndexEtlComponent extends AgBaseIndexPageDirective<ETL> {
  breadcrumbs = breadcrumbs;
  actionButtons = actionButtons;

  triggerTableRefresh = new Subject<void>();

  private etlService = inject(EtlService);
  private snackbarService = inject(MeSnackbarService);

  getEntityType(): string {
    return 'etls';
  }

  getIdProp(): string {
    return 'id';
  }

  getNameProp(): string {
    return 'name';
  }

  getTeamProp(): string {
    return 'team';
  }

  getPageName(): string {
    return 'index-etl';
  }

  override async onTableActionClicked(action: MeAgTableActionItemEvent<ETL>): Promise<void> {
    await super.onTableActionClicked(action);
    const actionEnum = action.id as EtlCustomActions;
    switch (actionEnum) {
      case EtlCustomActions.COPY_PARAMS: {
        const etlParams = this.etlService.extractEtlParams(action.selected);
        const json = JSON.stringify(etlParams, null, 2);
        copy(json);
        this.snackbarService.onCopyToClipboard();
        break;
      }
      default:
    }
  }

  override getDeletedHtml(tableAction?: MeAgTableActionItemEvent<ETL>): string {
    const name = tableAction ? tableAction.selected.name : this.selected[0].name;
    const version = tableAction ? tableAction.selected.version : this.selected[0].version;
    return `<div>Are you sure you want to delete : <span class='mat-title-medium text-sys-error'>${name}</span>, version: <span class='mat-title-medium text-sys-error'>${version}</span></div>`;
  }

  onDelete(_?: MeAgTableActionItemEvent<ETL>): void {
    const {id, name} = this.selected[0];
    this.gridApi.setGridOption('loading', true);
    this.etlService
      .delete(`${id}`, name)
      .pipe(
        catchError(() => of(false)),
        first(),
        untilDestroyed(this),
      )
      .subscribe((response) => {
        this.tableApiService?.hideOverlay();
        if (response !== false) {
          this.triggerTableRefresh.next();
        }
      });
  }
}
