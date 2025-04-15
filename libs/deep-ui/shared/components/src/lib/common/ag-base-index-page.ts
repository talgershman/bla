import {GridApi} from '@ag-grid-community/core';
import {Location} from '@angular/common';
import {ChangeDetectorRef, Directive, inject, NgZone, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {
  MeAgTableActionItem,
  MeAgTableActionItemEvent,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeBreadcrumbItem} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {EntityListActionButton} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {JsonSnippetComponent} from 'deep-ui/shared/components/src/lib/dialogs/json-snippet';
import _startCase from 'lodash-es/startCase';

export enum CommonTableActions {
  DUPLICATE = 'duplicate',
  INFO = 'info',
  Download = 'download',
  EDIT = 'edit',
  DELETE = 'delete',
  REPORT_JOB = 'reportJobToDEEP',
  DATA_RETENTION = 'data-retention',
}

export const InfoTableAction: MeAgTableActionItem<any> = {
  title: _startCase(CommonTableActions.INFO),
  id: CommonTableActions.INFO,
};

export const DuplicateTableAction: MeAgTableActionItem<any> = {
  title: _startCase(CommonTableActions.DUPLICATE),
  id: CommonTableActions.DUPLICATE,
};

export const DownloadTableAction: MeAgTableActionItem<any> = {
  title: _startCase(CommonTableActions.Download),
  id: CommonTableActions.Download,
};

export const EditTableAction: MeAgTableActionItem<any> = {
  title: _startCase(CommonTableActions.EDIT),
  id: CommonTableActions.EDIT,
};

export const DeleteTableAction: MeAgTableActionItem<any> = {
  title: _startCase(CommonTableActions.DELETE),
  id: CommonTableActions.DELETE,
};

export const DataRetentionTableAction: MeAgTableActionItem<any> = {
  title: 'Data Retention',
  id: CommonTableActions.DATA_RETENTION,
};

export const ReportJobTableAction: MeAgTableActionItem<any> = {
  title: 'Report Job To DEEP',
  id: CommonTableActions.REPORT_JOB,
};

@UntilDestroy()
@Directive()
export abstract class AgBaseIndexPageDirective<T> implements OnInit {
  selected: Array<T>;

  private isFirstLoad = true;

  protected activatedRoute = inject(ActivatedRoute);
  protected router = inject(Router);
  protected dialog = inject(MatDialog);
  protected cd = inject(ChangeDetectorRef);
  protected location = inject(Location);
  protected fullStoryService = inject(FullStoryService);
  protected ngZone = inject(NgZone);

  abstract breadcrumbs: Array<MeBreadcrumbItem>;

  abstract actionButtons: EntityListActionButton<T>[];

  abstract getTeamProp(): string;

  abstract getIdProp(): string;

  abstract getNameProp(): string;

  abstract getEntityType(): string;

  abstract getPageName(): string;

  abstract onDelete(tableAction?: MeAgTableActionItemEvent<T>): void;

  technologiesOptions = this.activatedRoute.snapshot.data?.viewData
    ?.technologiesOptions as MeSelectOption[];

  queryParams = this.activatedRoute?.snapshot?.queryParams || {};

  protected gridApi: GridApi<T>;
  protected tableApiService: MeAgTableApiService<T>;

  ngOnInit() {
    const pageName = this.getPageName();
    this.fullStoryService.setPage({pageName: pageName});
  }
  onGridReady(tableApiService: MeAgTableApiService<T>): void {
    this.tableApiService = tableApiService;
    this.gridApi = this.tableApiService.getGridApi();
  }

  onActionButtonClicked(buttonId: string): void {
    switch (buttonId) {
      case 'create': {
        this.onCreatedActionButtonClicked();
        break;
      }
      case 'edit': {
        this.onEditActionClicked();
        break;
      }
      case 'view': {
        this.onViewActionButtonClicked();
        break;
      }
      case 'delete': {
        this.onDeleteActionClicked();
        break;
      }
      default:
    }
  }

  onSelectionChanged(selections: Array<T>): void {
    this.selected = selections;
  }

  async onTableActionClicked(action: MeAgTableActionItemEvent<T>): Promise<void> {
    if (action.id === CommonTableActions.DUPLICATE) {
      const copyObj = {...action.selected};
      // eslint-disable-next-line
      delete copyObj?.[this.getTeamProp()];
      await this.router.navigate(['./create'], {
        relativeTo: this.activatedRoute,
        state: {[this.getEntityType()]: action.selected},
      });
    } else if (action.id === CommonTableActions.INFO) {
      await this._loadJsonSnippetComponent();
      this.dialog.open(JsonSnippetComponent, {
        autoFocus: false,
        restoreFocus: false,
        data: action.selected,
        panelClass: 'dialog-panel-overlap',
      });
    } else if (action.id === CommonTableActions.Download) {
      this.onDownloadActionButtonClicked(action);
    } else if (action.id === CommonTableActions.EDIT) {
      this.onEditActionClicked(action);
    } else if (action.id === CommonTableActions.DELETE) {
      this.onDeleteActionClicked(action);
    }
  }

  async onTableActionClickedRunInZone(action: MeAgTableActionItemEvent<T>): Promise<void> {
    await this.ngZone.run(this.onTableActionClicked.bind(this, action));
  }

  onCreatedActionButtonClicked(): void {
    this.router.navigate(['./create'], {relativeTo: this.activatedRoute});
  }

  onEditActionClicked(tableAction?: MeAgTableActionItemEvent<T>): void {
    const id = this.getSelectedId(tableAction);
    this.router.navigate(['./edit', id], {relativeTo: this.activatedRoute});
  }

  onViewActionButtonClicked(): void {
    const id = this.getSelectedId();
    this.router.navigate(['./view', id], {relativeTo: this.activatedRoute});
  }

  onDeleteActionClicked(tableAction?: MeAgTableActionItemEvent<T>): void {
    const deletedHtml = this.getDeletedHtml(tableAction);
    const dialogRef = this.dialog.open(MeAreYouSureDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.title = 'Confirm Action';
    dialogRef.componentInstance.contentHtml = deletedHtml;
    dialogRef.componentInstance.cancelPlaceHolder = `Cancel`;
    dialogRef.componentInstance.confirmPlaceHolder = `Delete`;
    dialogRef.componentInstance.confirmed
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onDelete(tableAction));
  }

  // can be override
  // eslint-disable-next-line
  onDownloadActionButtonClicked(action: MeAgTableActionItemEvent<T>): void {}

  getSelectedId(tableAction?: MeAgTableActionItemEvent<T>): any {
    return tableAction
      ? tableAction.selected[this.getIdProp()]
      : this.selected[0][this.getIdProp()];
  }

  getSelectedName(tableAction?: MeAgTableActionItemEvent<T>): string {
    if (!this.selected?.length && !tableAction) {
      return '';
    }
    return tableAction
      ? tableAction.selected[this.getNameProp()]
      : this.selected[0][this.getNameProp()];
  }

  getDeletedHtml(tableAction?: MeAgTableActionItemEvent<T>): string {
    return `<div>Are you sure you want to delete - <span class='mat-title-medium text-sys-error'>${
      tableAction ? tableAction.selected[this.getNameProp()] : this.selected[0][this.getNameProp()]
    }</span></div>`;
  }

  onFiltersParamsChanged(params: Params): void {
    const prevParams = {};
    //only for first load we should not remove initial query params
    if (!this.isFirstLoad) {
      const _activeParams: Params = {
        ...(this.activatedRoute?.snapshot?.queryParams || {}),
      };
      for (const key in _activeParams) {
        if (_activeParams.hasOwnProperty(key)) {
          prevParams[key] = null;
        }
      }
    }
    this.isFirstLoad = false;
    const nextParams = {
      ...prevParams,
      ...(params || {}),
    };
    const url = this.router
      .createUrlTree([], {
        queryParams: nextParams,
        queryParamsHandling: 'merge',
      })
      ?.toString();

    this.location?.go(url);
  }

  private async _loadJsonSnippetComponent(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/json-snippet');
  }
}
