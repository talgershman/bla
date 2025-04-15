import {CdkStepperModule} from '@angular/cdk/stepper';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {getFakeQueryJson} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {ExecuteQueryWebSocketsManagerService} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {DatasetFormComponent} from '../../forms/dataset-form/dataset-form.component';
import {QueryStepperComponent} from '../query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../stepper-container/stepper-container.component';
import {DatasetStepperComponent} from './dataset-stepper.component';

describe('DatasetStepperComponent', () => {
  let spectator: Spectator<DatasetStepperComponent>;
  let datasetService: SpyObject<DatasetService>;

  const createComponent = createComponentFactory({
    component: DatasetStepperComponent,
    imports: [
      StepperContainerComponent,
      CdkStepperModule,
      DatasetFormComponent,
      QueryStepperComponent,
      RouterTestingModule,
    ],
    mocks: [
      MeAzureGraphService,
      ExecuteQueryWebSocketsManagerService,
      DatasetService,
      DatasourceService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    datasetService = spectator.inject(DatasetService);
    datasetService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    spectator.component.selectedDataSources = [];
    spectator.component.subQueries = [];
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });

  it('should create', async () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('handleEditSubQueryClicked', () => {
    it('should call', async () => {
      spectator.detectChanges();
      const queryJson = getFakeQueryJson('', true);

      spectator.component.handleEditSubQueryClicked(queryJson[0]);

      expect(spectator.component).toBeTruthy();
    });
  });

  describe('handleMoveBackedFromStepper', () => {
    it('should call', async () => {
      spectator.detectChanges();

      spectator.component.handleMoveBackedFromStepper();

      expect(spectator.component).toBeTruthy();
    });
  });

  describe('handleAddSubQueryClicked', () => {
    it('should call', async () => {
      spectator.detectChanges();

      spectator.component.handleAddSubQueryClicked();

      expect(spectator.component).toBeTruthy();
    });
  });
});
