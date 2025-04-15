import {Directive, inject} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MeAgCustomDetailComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-detail';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {createDirectiveFactory, SpectatorDirective} from '@ngneat/spectator';
import {AgEtlJobDatasource, DeepUtilService, EtlJobService} from 'deep-ui/shared/core';
import {EtlJob, JobEntity} from 'deep-ui/shared/models';

import {getEtlJobTableColumns} from '../etl-jobs-table/etl-jobs-table-entities';
import {BaseJobsTableDirective} from './base-jobs-table.directive';

@Directive({
  selector: '[deTestSsrmTable]',
})
class TestBaseJobsTableDirective extends BaseJobsTableDirective<EtlJob, EtlJobService> {
  private etlJobService = inject(EtlJobService);
  setDatasource = () => (this.agGridDataSource = new AgEtlJobDatasource(this.etlJobService));
  getTableColumnsDef = getEtlJobTableColumns;
  protected getService(): EtlJobService {
    return this.etlJobService;
  }
  //eslint-disable-next-line
  protected async openInfoDialog(action: MeAgTableActionItemEvent<JobEntity>): Promise<void> {}
  //eslint-disable-next-line
  protected async onUpdateJob(action: MeAgTableActionItemEvent<JobEntity>): Promise<void> {}
}

describe('BaseJobsTableDirective', () => {
  let spectator: SpectatorDirective<BaseJobsTableDirective<EtlJob, EtlJobService>>;

  const createDirective = createDirectiveFactory({
    directive: TestBaseJobsTableDirective,
    detectChanges: false, // Disable automatic change detection at creation
    mocks: [MatDialog],
    providers: [EtlJobService, DeepUtilService],
  });

  beforeEach(() => {
    spectator = createDirective('<div deTestSsrmTable></div>');
  });

  it('should create the directive', () => {
    expect(spectator.directive).toBeTruthy();
  });

  it('should initialize properties correctly', () => {
    expect(spectator.directive.searchPlaceHolder).toBe('Search ETL name');
    expect(spectator.directive.masterDetail).toBe(true);
    expect(spectator.directive.detailCellRenderer).toBe(MeAgCustomDetailComponent);
    expect(spectator.directive.columnBeforeAction).toBe('duration');
  });

  // Test for event handling
  it('should emit tableActionClicked on non-specific action', async () => {
    const actionEvent = {
      id: 'someOtherAction',
      selected: {jobUuid: 'a-b-c'},
    } as MeAgTableActionItemEvent<any>;
    spyOn(spectator.directive.tableActionClicked, 'emit');

    await spectator.directive.onActionClicked(actionEvent);

    expect(spectator.directive.tableActionClicked.emit).toHaveBeenCalledWith(actionEvent);
  });
});
