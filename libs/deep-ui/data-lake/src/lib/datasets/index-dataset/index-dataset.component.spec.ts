import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeAgTableHarness, MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ScannedActionsSubject} from '@ngrx/store';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {CommonTableActions} from 'deep-ui/shared/components/src/lib/common';
import {
  DatasetCustomActions,
  DatasetTableComponent,
} from 'deep-ui/shared/components/src/lib/tables/dataset-table';
import {DataRetentionService, DatasetService, DeepUtilService} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, Dataset} from 'deep-ui/shared/models';
import {getFakeDataset} from 'deep-ui/shared/testing';
import {ToastrService} from 'ngx-toastr';
import {of} from 'rxjs';

import {JumpFileDialogComponent} from '../../components/dialogs/jump-file-dialog/jump-file-dialog.component';
import {IndexDatasetComponent} from './index-dataset.component';

const fakeDataset1 = getFakeDataset(true);
const fakeDataset2 = getFakeDataset(true);
const fakeDataset3 = getFakeDataset(true, null, {team: 'bad'});
const fakeDatasets = {datasets: [fakeDataset1, fakeDataset2, fakeDataset3]};
const dataRetentionInfo = {
  [DataRetentionKnownKeysEnum.DATASETS]: {
    default: 60,
    max: 365,
    label: 'Datasets',
    tooltip: 'Datasets will be deleted on the date selected',
    job_types: [],
    allowPermanent: true,
  },
};

describe('IndexDatasetComponent', () => {
  let spectator: Spectator<IndexDatasetComponent>;
  let datasetService: jasmine.SpyObj<DatasetService>;
  let dataRetentionService: SpyObject<DataRetentionService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IndexDatasetComponent,
    imports: [
      DatasetTableComponent,
      MeBreadcrumbsComponent,
      AgEntityListComponent,
      MatDialogModule,
      JumpFileDialogComponent,
    ],
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: fakeDatasets,
          },
        },
      },
      ScannedActionsSubject,
    ],
    providers: [DeepUtilService],
    mocks: [
      DatasetService,
      MeAzureGraphService,
      ToastrService,
      Router,
      MeUserPreferencesService,
      DataRetentionService,
    ],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    datasetService = spectator.inject(DatasetService);
    datasetService.getAgGridMulti.and.returnValue(
      of({
        rowData: [],
        rowCount: 0,
      }),
    );
    router = spectator.inject(Router);
    matDialog = spectator.inject(MatDialog);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    dataRetentionService = spectator.inject(DataRetentionService);
    dataRetentionService.getDatasetDataRetentionConfig.and.returnValue(dataRetentionInfo);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onTableActionClicked', () => {
    const action: MeAgTableActionItemEvent<Dataset> = {
      title: '',
      id: '',
      selected: getFakeDataset(true),
      selectedRowNode: null,
    };

    it('should call duplicate', () => {
      datasetService.downloadClipList.and.returnValue(null);
      action.id = CommonTableActions.DUPLICATE;
      spectator.detectChanges();

      spectator.component.onTableActionClicked(action);

      expect(router.navigate).toHaveBeenCalledWith(['./create'], {
        relativeTo: spectator.component['activatedRoute'],
        state: {
          dataset: action.selected,
        },
      });
    });

    it('should call jumpfile', () => {
      spyOn(matDialog, 'open');
      matDialog.open.and.returnValue({
        close: () => {},
        componentInstance: {dataset: fakeDataset1, closeDialog: of(null)},
      } as any);
      action.id = DatasetCustomActions.DOWNLOAD_JUMP_FILE;
      spectator.detectChanges();

      spectator.component.onTableActionClicked(action);

      expect(matDialog.open).toHaveBeenCalled();
    });
  });

  describe('onDelete', () => {
    it('should delete', async () => {
      spyOn(spectator.component, 'triggerRefresh');
      datasetService.delete.and.returnValue(of(null));
      datasetService.getAgGridMulti.and.returnValue(
        of({
          rowData: [fakeDataset1, fakeDataset2],
          rowCount: 2,
        }),
      );
      spectator.detectChanges();
      spectator.detectComponentChanges();
      await spectator.fixture.whenStable();
      await MeAgTableHarness.clickRow(spectator.fixture, 0);
      // click delete button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.delete-button'});
      // click delete button in dialog
      const deleteButtonElem = await docLoader.getHarness(
        MatButtonHarness.with({
          selector: '.dialog-panel-overlap .confirm-button',
        }),
      );
      await deleteButtonElem.click();

      expect(spectator.component.triggerRefresh).toHaveBeenCalled();
    });
  });
});
