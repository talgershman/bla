import {CdkStepperModule} from '@angular/cdk/stepper';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService, DatasourceService, VersionDatasourceService} from 'deep-ui/shared/core';
import {SelectedSubQuery} from 'deep-ui/shared/models';
import {getFakeMestDatasource, getFakeQEAttributes, getFakeQueryJson} from 'deep-ui/shared/testing';
import {of, Subject} from 'rxjs';

import {QueryBuilderComponent} from '../../query-builder/query-builder.component';
import {SelectDatasourceComponent} from '../../selection/select-datasource/select-datasource.component';
import {StepperContainerComponent} from '../stepper-container/stepper-container.component';
import {QueryStepperComponent} from './query-stepper.component';

const dataSources = [
  getFakeMestDatasource(true).fakeDataSource,
  getFakeMestDatasource(true).fakeDataSource,
];

describe('QueryStepperComponent', () => {
  let spectator: Spectator<QueryStepperComponent>;
  let datasourceService: SpyObject<DatasourceService>;
  const triggerFirstStep = new Subject<void>();
  const triggerEditSubQuery = new Subject<SelectedSubQuery>();
  const fakeAttr = getFakeQEAttributes();

  const createComponent = createComponentFactory({
    component: QueryStepperComponent,
    imports: [
      CdkStepperModule,
      StepperContainerComponent,
      QueryBuilderComponent,
      SelectDatasourceComponent,
    ],
    mocks: [MeAzureGraphService, DatasetService, DatasourceService, MeLoadingService],
    providers: [VersionDatasourceService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    datasourceService = spectator.inject(DatasourceService);
    datasourceService.getMulti.and.returnValue(of(dataSources));
    datasourceService.getSingle.withArgs(dataSources[0].id).and.returnValue(of(dataSources[0]));
    datasourceService.getSingle.withArgs(dataSources[1].id).and.returnValue(of(dataSources[1]));
    datasourceService.getAttributes.and.returnValue(of(fakeAttr));
    spectator.component.selectedDataSources = [];
    spectator.component.subQueries = [];
    spectator.component.triggerFirstStep$ = triggerFirstStep.asObservable();
    spectator.component.triggerEditSubQuery$ = triggerEditSubQuery.asObservable();
  });

  it('should create', async () => {
    triggerFirstStep.next();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component).toBeTruthy();
  });

  describe('onEditSubQuery', async () => {
    it('should move to query builder step', async () => {
      triggerFirstStep.next();
      spectator.detectChanges();
      spyOn(spectator.component, 'movedBackFromStepper');

      await spectator.fixture.whenStable();
      const datasource = getFakeMestDatasource(true).fakeDataSource;
      spectator.component.selectedDataSources = [datasource];
      spectator.component.subQueries = getFakeQueryJson(datasource.id);

      await spectator.component.onAddQueryClicked(spectator.component.subQueries[0]);

      expect(spectator.component.movedBackFromStepper).toHaveBeenCalled();
    });
  });

  describe('onAddQueryClicked', async () => {
    it('should emit move back', async () => {
      triggerFirstStep.next();
      spectator.detectChanges();
      spyOn(spectator.component, 'movedBackFromStepper');

      await spectator.fixture.whenStable();
      const datasource = getFakeMestDatasource(true).fakeDataSource;
      spectator.component.selectedDataSources = [datasource];
      spectator.component.subQueries = getFakeQueryJson(datasource.id);

      await spectator.component.onAddQueryClicked(spectator.component.subQueries[0]);

      expect(spectator.component.movedBackFromStepper).toHaveBeenCalled();
    });
  });

  describe('onUpdateQueryClicked', async () => {
    it('should emit move back', async () => {
      triggerFirstStep.next();
      spectator.detectChanges();
      spyOn(spectator.component, 'movedBackFromStepper');

      await spectator.fixture.whenStable();
      spectator.component.selectedDataSources = [dataSources[0]];
      spectator.component.subQueries = getFakeQueryJson(dataSources[0].id);

      await spectator.component.onUpdateQueryClicked(spectator.component.subQueries[0]);

      expect(spectator.component.movedBackFromStepper).toHaveBeenCalled();
    });
  });

  describe('onSelectedDatasource', async () => {
    it('should move to query builder', async () => {
      triggerFirstStep.next();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spyOn(spectator.component, 'moveToQueryBuilderStep');

      spectator.component.selectedDataSources = [dataSources[0]];
      spectator.component.subQueries = getFakeQueryJson(dataSources[0].id);

      await spectator.component.onSelectedDatasource({
        attributes: fakeAttr,
        dataSource: dataSources[0],
        version: null,
      });

      expect(spectator.component.moveToQueryBuilderStep).toHaveBeenCalled();
    });
  });
});
