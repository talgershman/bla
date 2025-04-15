import {LoadSuccessParams} from '@ag-grid-community/core';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatRadioGroupHarness} from '@angular/material/radio/testing';
import {MatSlideToggleHarness} from '@angular/material/slide-toggle/testing';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAgSelectFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-select-filter';
import {MeDialogContainerComponent} from '@mobileye/material/src/lib/components/dialog-container';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {
  MeAgTableHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
} from '@mobileye/material/src/lib/testing';
import {addDaysToDate, dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {BudgetGroupService} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {fillEtlStep, getEtlsData, goToNextStep} from 'deep-ui/shared/components/src/lib/testing';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {
  AgDatasourceService,
  AssetManagerService,
  DataRetentionService,
  DatasourceService,
  EtlService,
  LaunchService,
  PerfectListService,
} from 'deep-ui/shared/core';
import {FullStoryResponseTimeInterceptor} from 'deep-ui/shared/http';
import {
  DataRetentionKnownKeysEnum,
  Datasource,
  ETL,
  EtlGroup,
  EtlTypeEnum,
  PerfectJobFlowsEnum,
} from 'deep-ui/shared/models';
import {
  getFakeETL,
  getFakeEtlNames,
  getFakePerfectDatasource,
  getFakePerfectList,
} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {PerfectTransformWizardComponent} from './perfect-transform-wizard.component';
import {DatasourceDetailsStepComponent} from './steps/datasource-details-step/datasource-details-step.component';
import {PerfectListStepComponent} from './steps/perfect-list-step/perfect-list-step.component';
import {SelectFlowStepComponent} from './steps/select-flow-step/select-flow-step.component';
import {UpdateMsgStepComponent} from './steps/update-msg-step/update-msg-step.component';

const fakePerfectLists = [
  getFakePerfectList(true, {id: 999, technology: 'AV'}),
  getFakePerfectList(true, {technology: 'AV'}),
  getFakePerfectList(true, {technology: 'AV'}),
];
const fakeDatasources = [
  getFakePerfectDatasource(true, {technology: 'AV', perfectListIds: [fakePerfectLists[0].id]})
    .fakeDataSource,
  getFakePerfectDatasource(true, {technology: 'AV'}).fakeDataSource,
  getFakePerfectDatasource(true, {technology: 'AV'}).fakeDataSource,
];
const fakeEtl = getFakeETL(
  true,
  {name: 'AV', version: 'old-version', id: 1},
  EtlTypeEnum.PERFECT_TRANSFORM,
);
const mainDatasource: Datasource = getFakePerfectDatasource(true, {
  etlId: fakeEtl.id,
  etlName: fakeEtl.name,
  siblingsId: ['1'],
  perfectListIds: [999],
  technology: 'AV',
}).fakeDataSource;

const siblingDatasource: Datasource = getFakePerfectDatasource(true, {
  id: '1',
  etlName: fakeEtl.name,
  siblingsId: ['2'],
  perfectListIds: [999],
  technology: 'AV',
}).fakeDataSource;

const etls = [
  fakeEtl,
  getFakeETL(true, {}, EtlTypeEnum.PERFECT_TRANSFORM),
  getFakeETL(
    true,
    {id: fakeEtl.id + 1, name: fakeEtl.name, version: 'new-version', team: fakeEtl.team},
    EtlTypeEnum.PERFECT_TRANSFORM,
  ),
];

const etlNames = getFakeEtlNames(etls);

describe('PerfectTransformWizardComponent - Integration', () => {
  let spectator: Spectator<PerfectTransformWizardComponent>;
  let perfectListService: SpyObject<PerfectListService>;
  let dataSourceService: SpyObject<DatasourceService>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let etlService: SpyObject<EtlService>;
  let budgetGroupService: SpyObject<BudgetGroupService>;
  let etlsData: {groups: Array<EtlGroup>; etls: Array<Array<ETL>>};
  let launchService: SpyObject<LaunchService>;
  let dataRetentionService: SpyObject<DataRetentionService>;
  let fullStoryService: SpyObject<FullStoryService>;

  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PerfectTransformWizardComponent,
    imports: [
      MeWizardComponent,
      CdkStepperModule,
      EtlStepComponent,
      MeDialogContainerComponent,
      MatButtonModule,
      MatDialogModule,
      MatIconModule,
      PerfectListStepComponent,
      DatasourceDetailsStepComponent,
      UpdateMsgStepComponent,
      MatFormFieldModule,
      LoadingStepComponent,
      SubmitJobStepComponent,
      MatDialogModule,
      SelectFlowStepComponent,
      RouterTestingModule,
      MeAgSelectFilterComponent,
      MeCdkStepComponent,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
      FullStoryResponseTimeInterceptor,
    ],
    mocks: [
      LaunchService,
      EtlService,
      DataRetentionService,
      PerfectListService,
      AssetManagerService,
      MeAzureGraphService,
      DatasourceService,
      AgDatasourceService,
      ActivatedRoute,
      BudgetGroupService,
      FullStoryService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    perfectListService = spectator.inject(PerfectListService);
    dataSourceService = spectator.inject(DatasourceService);
    agDatasourceService = spectator.inject(AgDatasourceService);
    etlService = spectator.inject(EtlService);
    launchService = spectator.inject(LaunchService);
    dataRetentionService = spectator.inject(DataRetentionService);
    budgetGroupService = spectator.inject(BudgetGroupService);
    fullStoryService = spectator.inject<FullStoryService>(FullStoryService);

    perfectListService.getMulti.and.returnValue(of(fakePerfectLists));
    dataSourceService.getMulti.and.returnValue(of(fakeDatasources));
    agDatasourceService.getMulti.and.returnValue(
      of({
        rowData: fakeDatasources,
        rowCount: -1,
      } as LoadSuccessParams),
    );
    dataSourceService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    etlService.getEtlNames.and.returnValue(of(etlNames));
    etlService.getMulti.and.returnValue(of(etls));
    etlsData = getEtlsData(etls);
    etlService.getAgGridMulti.and.returnValue(
      of({
        rowData: etlsData.groups,
        rowCount: etlsData.groups.length,
      } as LoadSuccessParams),
    );
    perfectListService.getAgGridMulti.and.returnValue(
      of({
        rowData: fakePerfectLists,
        rowCount: fakePerfectLists.length,
      } as LoadSuccessParams),
    );
    launchService.submitJob.and.returnValue(
      of({
        isCreated: true,
        jobUuid: 'job-id-123',
      }),
    );
    budgetGroupService.getBudgetGroups.and.returnValue(
      of({
        groups: [
          {
            id: 'deep',
            value: 'deep',
            tooltip: '',
            isDisabled: false,
          } as MeSelectOption,
        ],
        isValid: true,
        error: '',
      }),
    );
    fullStoryService.trackEvent.and.returnValue(null);
    spectator.component.disableRefreshInterval = true;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('CREATE flow', () => {
    beforeEach(() => {
      spectator.component.runType.set('CREATE');
    });

    it('valid flow, should send submit job', async () => {
      const dataRetentionInfo = {
        [DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: {
          default: 60,
          max: 365,
          label: 'Perfects Data Source',
          tooltip: 'Perfects Data Source will be deleted on the date selected',
          job_types: [PerfectJobFlowsEnum.PERFECT_TRANSFORM],
          allowPermanent: false,
        },
      };
      const dataRetentionObj = {
        [DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE]: toShortDate(
          addDaysToDate(
            dateNow(),
            dataRetentionInfo[DataRetentionKnownKeysEnum.PERFECTS_DATA_SOURCE].default,
          ),
        ),
      };
      spectator.component.dataRetentionInfoObj = dataRetentionInfo;
      dataRetentionService.getPerfectDataRetentionObj.and.returnValue(dataRetentionObj);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // select etl list
      await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
      await goToNextStep(spectator.fixture, loader);

      // select perfect list
      await MeAgTableHarness.clickRow(spectator.fixture, 1);
      await goToNextStep(spectator.fixture, loader);

      // insert datasource details
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'datasource name 1',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        spectator.component.datasourceDetailsStep.deepTeamOptions[0],
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Raw Data Owner"]'},
        spectator.component.datasourceDetailsStep.rawDataOwnerOptions[0],
      );

      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith({
        flowType: 'PERFECT_TRANSFORM',
        runType: 'CREATE',
        budgetGroup: 'deep',
        probeId: etlsData.etls[0][0].id,
        perfectListIds: [fakePerfectLists[1].id],
        name: 'datasource name 1',
        rawDataOwner: spectator.component.datasourceDetailsStep.rawDataOwnerOptions[0],
        team: spectator.component.datasourceDetailsStep.deepTeamOptions[0],
        technology: fakePerfectLists[1].technology,
        dataRetention: dataRetentionObj,
        params: {
          perfectTransform: {
            id: 1,
            configuration: {temp: 1},
          },
        },
      });
    });
  });

  describe('New Revision flow', () => {
    beforeEach(() => {
      spectator.component.runType.set('UPDATE');
      spectator.component.selectedDatasource = mainDatasource;
      spectator.component.initialEtl = fakeEtl;
      spectator.component.selectedEtl = fakeEtl;
      spectator.component.siblingsDatasources = [siblingDatasource];
    });

    it('valid flow - only change is a perfect list that needs re-sync', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // skip effected datasource step
      await goToNextStep(spectator.fixture, loader);
      // select the same etl version and go next
      await goToNextStep(spectator.fixture, loader);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.selectedEtl = fakeEtl;
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // toggle sync for existing perfect list
      await MeAgTableHarness.waitForTable(spectator.fixture);
      const firstRowSyncToggleHarness = await loader.getHarness(
        MatSlideToggleHarness.with({
          ancestor: 'de-select-perfect-list .sync-column-container',
        }),
      );
      await firstRowSyncToggleHarness.toggle();
      await goToNextStep(spectator.fixture, loader, 'Next');
      await spectator.fixture.whenStable();

      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith({
        flowType: 'PERFECT_TRANSFORM',
        runType: 'UPDATE',
        budgetGroup: 'deep',
        probeId: fakeEtl.id,
        perfectListIds: [fakePerfectLists[0].id],
        dataSourceId: mainDatasource.id,
        dataRetention: null,
        params: {
          perfectTransform: {
            id: 1,
            configuration: {temp: 1},
          },
        },
      });
    });

    it('valid flow - add another perfect list', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // skip effected datasource step
      await goToNextStep(spectator.fixture, loader);
      // skip select etl step
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.selectedEtl = fakeEtl;
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await goToNextStep(spectator.fixture, loader);
      // add a new perfect list and click finish
      await MeAgTableHarness.clickRow(spectator.fixture, 1);
      await goToNextStep(spectator.fixture, loader, 'Next');
      await spectator.fixture.whenStable();

      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith({
        flowType: 'PERFECT_TRANSFORM',
        runType: 'UPDATE',
        budgetGroup: 'deep',
        probeId: fakeEtl.id,
        perfectListIds: [fakePerfectLists[1].id],
        dataSourceId: mainDatasource.id,
        dataRetention: null,
        params: {
          perfectTransform: {
            id: 1,
            configuration: {temp: 1},
          },
        },
      });
    });

    it('with a new ETL version', async () => {
      etlService.getAgGridMulti.and.returnValues(
        of({
          rowData: [etlsData.groups[0]],
          rowCount: 1,
        } as LoadSuccessParams),
        of({
          rowData: etlsData.etls[0],
          rowCount: etlsData.etls[0].length,
        } as LoadSuccessParams),
      );
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // skip effected datasource step
      await goToNextStep(spectator.fixture, loader);
      await spectator.fixture.whenStable();
      spectator.fixture.detectChanges();
      //change etl version
      await fillEtlStep(spectator.fixture, loader, etlsData, {
        selectedRow: 2,
        skipSelectName: true,
      });
      await goToNextStep(spectator.fixture, loader);
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.selectedEtl = fakeEtl;
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // add a new perfect list ( sync list is all ready pre-selected )
      await MeAgTableHarness.clickRow(spectator.fixture, 1);
      await goToNextStep(spectator.fixture, loader, 'Next');
      await spectator.fixture.whenStable();

      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith({
        flowType: 'PERFECT_TRANSFORM',
        runType: 'UPDATE',
        budgetGroup: 'deep',
        probeId: etlsData.etls[0][2].id,
        perfectListIds: [fakePerfectLists[0].id, fakePerfectLists[1].id],
        dataSourceId: mainDatasource.id,
        dataRetention: null,
        params: {
          perfectTransform: {
            id: 1,
            configuration: {temp: 1},
          },
        },
      });
    });
  });

  describe('Create from Existing', () => {
    beforeEach(() => {
      spectator.component.runType.set('CREATE');
      spectator.component.duplicateDatasource = mainDatasource;
      spectator.component.duplicateDatasourceEtl = fakeEtl;
    });

    it('should create from datasource', async () => {
      etlService.getAgGridMulti.and.returnValues(
        of({
          rowData: etlsData.groups,
          rowCount: 3,
        } as LoadSuccessParams),
        of({
          rowData: etlsData.etls[0],
          rowCount: etlsData.etls[0].length,
        } as LoadSuccessParams),
      );
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.fixture.detectChanges();
      // select a new etl version
      await fillEtlStep(spectator.fixture, loader, etlsData, {
        selectedRow: 1,
      });
      await goToNextStep(spectator.fixture, loader);
      await spectator.fixture.whenStable();

      // same perfect lists as duplicate
      await goToNextStep(spectator.fixture, loader);

      // insert datasource details
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'datasource name 1',
      );

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        spectator.component.datasourceDetailsStep.deepTeamOptions[0],
      );

      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith({
        flowType: 'PERFECT_TRANSFORM',
        runType: 'CREATE',
        budgetGroup: 'deep',
        probeId: etlsData.etls[0][1].id,
        perfectListIds: mainDatasource.perfectListIds,
        name: 'datasource name 1',
        rawDataOwner: mainDatasource.rawDataOwner,
        team: spectator.component.datasourceDetailsStep.deepTeamOptions[0],
        technology: mainDatasource.technology,
        dataRetention: null,
        params: {
          perfectTransform: {
            id: 1,
            configuration: {temp: 1},
          },
        },
      });
    });
  });

  describe('Add Job', () => {
    beforeEach(() => {
      spectator.component.showSelectFlowStep = true;
    });

    describe('- New Revision flow', () => {
      beforeEach(() => {
        etlService.getSingle.and.returnValue(of(fakeEtl));
        etlService.getMulti.and.returnValue(of(etls));
        etlService.getEtlNames.and.returnValue(of(etlNames));
      });

      it('valid flow, should send submit job', async () => {
        // select update flow
        const flowOptions = await loader.getHarness(MatRadioGroupHarness);
        await flowOptions.checkRadioButton({label: 'Create a new revision for a Data Source'});

        // select a data source
        await MeAgTableHarness.waitForTable(spectator.fixture);
        await MeAgTableHarness.clickGroupByIndex(spectator.fixture, 0);
        await goToNextStep(spectator.fixture, loader, 'Next');

        // skip ETL step
        await goToNextStep(spectator.fixture, loader, 'Next');

        // toggle sync for existing perfect list
        await MeAgTableHarness.waitForTable(spectator.fixture);
        const firstRowSyncToggleHarness = await loader.getHarness(
          MatSlideToggleHarness.with({
            ancestor: 'de-select-perfect-list .sync-column-container',
          }),
        );
        await firstRowSyncToggleHarness.toggle();

        await goToNextStep(spectator.fixture, loader, 'Next');
        await spectator.fixture.whenStable();

        await MeChipHarness.addTag(
          spectator.fixture,
          loader,
          {ancestor: '.tags-control'},
          'new-tag',
        );

        await MeInputHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.description-control'},
          `some desc text`,
        );

        await goToNextStep(spectator.fixture, loader, 'Finish');
        await spectator.fixture.whenStable();

        expect(launchService.submitJob).toHaveBeenCalledWith({
          flowType: 'PERFECT_TRANSFORM',
          runType: 'UPDATE',
          budgetGroup: 'deep',
          perfectListIds: [fakePerfectLists[0].id],
          dataSourceId: fakeDatasources[0].id,
          probeId: fakeEtl.id,
          tags: ['new-tag'],
          description: 'some desc text',
          dataRetention: null,
          params: {
            perfectTransform: {
              id: 1,
              configuration: {temp: 1},
            },
          },
        });
      });
    });

    describe('Create flow', () => {
      it('valid flow, should send submit job', async () => {
        // skip select flow step , default value is create
        await goToNextStep(spectator.fixture, loader);

        spectator.detectChanges();
        await spectator.fixture.whenStable();
        spectator.fixture.detectChanges();
        // select etl list
        await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
        await goToNextStep(spectator.fixture, loader);

        // select perfect list
        await MeAgTableHarness.clickRow(spectator.fixture, 1);
        await goToNextStep(spectator.fixture, loader);

        // insert datasource details
        await MeInputHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '[title="Name"]'},
          'datasource name 1',
        );

        await MeSelectHarness.selectOptionByText(
          spectator.fixture,
          loader,
          docLoader,
          {ancestor: '[title="Team"]'},
          spectator.component.datasourceDetailsStep.deepTeamOptions[0],
        );

        await MeSelectHarness.selectOptionByText(
          spectator.fixture,
          loader,
          docLoader,
          {ancestor: '[title="Raw Data Owner"]'},
          spectator.component.datasourceDetailsStep.rawDataOwnerOptions[0],
        );

        await MeChipHarness.addTag(
          spectator.fixture,
          loader,
          {ancestor: '.tags-control'},
          'new-tag',
        );

        await MeInputHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.description-control'},
          `some desc text`,
        );

        await goToNextStep(spectator.fixture, loader, 'Finish');
        await spectator.fixture.whenStable();

        expect(launchService.submitJob).toHaveBeenCalledWith({
          flowType: 'PERFECT_TRANSFORM',
          runType: 'CREATE',
          budgetGroup: 'deep',
          probeId: etlsData.etls[0][0].id,
          perfectListIds: [fakePerfectLists[1].id],
          name: 'datasource name 1',
          rawDataOwner: spectator.component.datasourceDetailsStep.rawDataOwnerOptions[0],
          team: spectator.component.datasourceDetailsStep.deepTeamOptions[0],
          technology: fakePerfectLists[1].technology,
          tags: ['new-tag'],
          description: 'some desc text',
          dataRetention: null,
          params: {
            perfectTransform: {
              id: 1,
              configuration: {temp: 1},
            },
          },
        });
      });
    });
  });
});
