import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeDynamicFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeStepProgressBarComponent} from '@mobileye/material/src/lib/components/step-progress-bar';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import {JsonSnippetComponent} from 'deep-ui/shared/components/src/lib/dialogs/json-snippet';
import {AgPerfectTransformJobDatasource, PerfectTransformJobsService} from 'deep-ui/shared/core';
import {PerfectTransformJob} from 'deep-ui/shared/models';
import {firstValueFrom} from 'rxjs';

import {BaseJobsTableDirective} from '../base-jobs-table/base-jobs-table.directive';
import {PerfectTransformExpandContainerComponent} from './perfect-transform-expand-container/perfect-transform-expand-container.component';
import {getPerfectTransformJobsTableColumns} from './perfect-transform-jobs-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-perfect-transform-jobs-table',
  templateUrl: './perfect-transform-jobs-table.component.html',
  styleUrl: './perfect-transform-jobs-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    MeDynamicFadeInOutAnimation(),
    MeDynamicFadeInOutAnimation(400, 'MeFadeInOutAnimation'),
  ],
  imports: [
    MeServerSideTableComponent,
    PerfectTransformExpandContainerComponent,
    MeTooltipDirective,
    MatButtonModule,
    MatIconModule,
    MeStepProgressBarComponent,
  ],
})
export class PerfectTransformJobsTableComponent extends BaseJobsTableDirective<
  PerfectTransformJob,
  PerfectTransformJobsService
> {
  private perfectTransformJobsService = inject(PerfectTransformJobsService);

  setDatasource = () =>
    (this.agGridDataSource = new AgPerfectTransformJobDatasource(this.perfectTransformJobsService));

  getTableColumnsDef = getPerfectTransformJobsTableColumns;

  protected getService(): PerfectTransformJobsService {
    return this.perfectTransformJobsService;
  }

  protected async openInfoDialog(
    action: MeAgTableActionItemEvent<PerfectTransformJob>,
  ): Promise<void> {
    const service = this.getService();
    const jobUuid = action.selected.jobUuid;
    const data: any = await firstValueFrom(service.getSingle(jobUuid));
    this.dialog.open(JsonSnippetComponent, {
      autoFocus: false,
      restoreFocus: false,
      data,
      panelClass: 'dialog-panel-overlap',
    });
  }

  //eslint-disable-next-line
  protected async onUpdateJob(_: MeAgTableActionItemEvent<PerfectTransformJob>): Promise<void> {}
}
