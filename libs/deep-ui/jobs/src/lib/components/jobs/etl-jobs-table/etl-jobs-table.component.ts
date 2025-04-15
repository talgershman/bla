import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeDynamicFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeStepProgressBarComponent} from '@mobileye/material/src/lib/components/step-progress-bar';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {JsonSnippetComponent} from 'deep-ui/shared/components/src/lib/dialogs/json-snippet';
import {AgEtlJobDatasource, EtlJobService} from 'deep-ui/shared/core';
import {EtlJob, ETLJobSnakeCase} from 'deep-ui/shared/models';
import {firstValueFrom} from 'rxjs';

import {UpdateJobComponent} from '../../dialogs/update-job/update-job.component';
import {BaseJobsTableDirective} from '../base-jobs-table/base-jobs-table.directive';
import {EtlExpandContainerComponent} from './etl-expand-container/etl-expand-container.component';
import {getEtlJobTableColumns} from './etl-jobs-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-etl-jobs-table',
  templateUrl: './etl-jobs-table.component.html',
  styleUrl: './etl-jobs-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    MeDynamicFadeInOutAnimation(),
    MeDynamicFadeInOutAnimation(400, 'MeFadeInOutAnimation'),
  ],
  imports: [
    MeServerSideTableComponent,
    EtlExpandContainerComponent,
    MeTooltipDirective,
    MatButtonModule,
    MatIconModule,
    MeStepProgressBarComponent,
  ],
})
export class EtlJobsTableComponent extends BaseJobsTableDirective<EtlJob, EtlJobService> {
  private etlJobService = inject(EtlJobService);

  setDatasource = () => (this.agGridDataSource = new AgEtlJobDatasource(this.etlJobService));

  getTableColumnsDef = getEtlJobTableColumns;

  protected getService(): EtlJobService {
    return this.etlJobService;
  }

  protected async openInfoDialog(action: MeAgTableActionItemEvent<EtlJob>): Promise<void> {
    const service = this.getService();
    const jobUuid = action.selected.jobUuid;
    const data: any = await firstValueFrom(service.getSingle(jobUuid));
    const dialogRef = this.dialog.open(JsonSnippetComponent, {
      autoFocus: false,
      restoreFocus: false,
      data,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.extraDataToggleName = 'Hide full info';
    dialogRef.componentInstance.minData = this._getMinifiedData(data);
  }

  protected async onUpdateJob(action: MeAgTableActionItemEvent<EtlJob>): Promise<void> {
    await this._loadUpdateJobComponent();
    const ref = this.dialog.open(UpdateJobComponent, {
      autoFocus: false,
      restoreFocus: false,
      data: action.selected,
      panelClass: 'dialog-panel-overlap',
    });
    ref.componentInstance.etlJob = action.selected as EtlJob;
    ref.componentInstance.closeDialog.pipe(untilDestroyed(this)).subscribe(() => {
      ref.close();
      this.refreshData();
    });
  }

  private _getMinifiedData(job: ETLJobSnakeCase): any {
    return {
      ...{
        job_uuid: job.job_uuid,
        probe_id: job.probe_id,
        probe_version: job.probe_version,
        probe_name: job.probe_name,
        probe: job.probe,
        user_params: job.user_params,
        tags: job.tags,
        job_type: job.job_type,
        run_type: job.run_type,
        parsing_configuration: job.parsing_configuration,
        output_path: job.output_path,
        clip_list_id: job.clip_list_id,
        clip_list_s3_key: job['clip_list_s3_key'],
        metadata: job.metadata,
        mest_version_nickname: job.mest_version_nickname,
      },
      ...(job.metadata?.['mest_settings']?.['root_path']
        ? {root_path: job.metadata['mest_settings']['root_path']}
        : {}),
    };
  }

  private async _loadUpdateJobComponent(): Promise<void> {
    import('../../dialogs/update-job/update-job.component');
  }
}
