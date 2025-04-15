import {LoadSuccessParams} from '@ag-grid-community/core';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ActivatedRoute} from '@angular/router';
import {
  MeUploadFileComponent,
  MeUploadFileComponentMock,
} from '@mobileye/material/src/lib/components/upload-file';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {waitForDeferredBlocks} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  fillConfigurationStep,
  fillEtlStep,
  fillLogFileStep,
  fillMestStep,
  fillParsingStep,
  getDateInXDays,
  getEtlsData,
  getExpectedSubmitJobRequest,
  getParsingData,
  goToNextStep,
  VJwizardSetup,
} from 'deep-ui/shared/components/src/lib/testing';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {LogFileStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/log-file-step';
import {MestsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/mests-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {
  AssetManagerService,
  ClipListService,
  EtlService,
  JobFormBuilderService,
  LaunchService,
  MestService,
  OnPremService,
  ParsingConfigurationService,
  SubmitJobCompareVersionsRequest,
  SubmitJobRefJobId,
} from 'deep-ui/shared/core';
import {
  DataRetentionKnownKeysEnum,
  ETL,
  EtlGroup,
  EtlJobFlowsEnum,
  EtlJobRunType,
  ParsingConfiguration,
  ParsingConfigurationGroupResponse,
} from 'deep-ui/shared/models';
import {of} from 'rxjs';

import {PCRunComponent} from './pc-run.component';

describe('PCRunComponent - Integration', () => {
  let spectator: Spectator<PCRunComponent>;
  let mestService: SpyObject<MestService>;
  let launchService: SpyObject<LaunchService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let etlService: SpyObject<EtlService>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let onPremService: SpyObject<OnPremService>;
  let mestsArr: Array<any>;
  let etlsArr: Array<any>;
  let etlsData: {groups: Array<EtlGroup>; etls: Array<Array<ETL>>};
  let parsingArr: Array<any>;
  let parsingData: {
    groups: Array<ParsingConfigurationGroupResponse>;
    parsingConfigs: Array<Array<ParsingConfiguration>>;
  };
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PCRunComponent,
    imports: [
      EtlStepComponent,
      MestsStepComponent,
      SubmitJobStepComponent,
      ClipListStepComponent,
      RunConfigStepComponent,
      ParsingStepComponent,
      MeWizardComponent,
      MeCdkStepComponent,
      CdkStepperModule,
      LoadingStepComponent,
      LogFileStepComponent,
      MatProgressSpinnerModule,
      MatIconTestingModule,
    ],
    providers: [JobFormBuilderService],
    mocks: [
      MeAzureGraphService,
      AssetManagerService,
      MestService,
      ClipListService,
      ParsingConfigurationService,
      EtlService,
      LaunchService,
      OnPremService,
      ActivatedRoute,
    ],
    overrideComponents: [
      [
        MeUploadFileComponent,
        {
          remove: {
            imports: [MeUploadFileComponent],
          },
          add: {
            imports: [MeUploadFileComponentMock],
          },
        },
      ],
    ],
    detectChanges: false,
  });

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    mestService = spectator.inject(MestService);
    launchService = spectator.inject(LaunchService);
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    etlService = spectator.inject(EtlService);
    assetManagerService = spectator.inject(AssetManagerService);
    onPremService = spectator.inject(OnPremService);
    ({mestsArr, etlsArr, parsingArr, docLoader, loader} = VJwizardSetup(
      spectator.fixture,
      spectator.component,
      loader,
      docLoader,
      mestService,
      null,
      parsingConfigurationService,
      etlService,
      onPremService,
      launchService,
      assetManagerService,
    ));

    etlsData = getEtlsData(etlsArr);

    etlService.getAgGridMulti.and.returnValue(
      of({
        rowData: etlsData.groups,
        rowCount: etlsData.groups.length,
      } as LoadSuccessParams),
    );

    parsingData = getParsingData(parsingArr);

    parsingConfigurationService.getAgGridMulti.and.returnValue(
      of({
        rowData: parsingData.groups,
        rowCount: parsingData.groups.length,
      } as LoadSuccessParams),
    );

    launchService.validateUserParams.and.returnValue(of({valid: true}));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('wizard flow', () => {
    it('should create full run - prev job id', async () => {
      spectator.component.refJobId = '11111111-1111-1111-9111-111111111111';
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const submitRequest: SubmitJobRefJobId = {
        flowType: EtlJobFlowsEnum.PC_RUN,
        budgetGroup: 'deep',
        runType: spectator.component.runType(),
        dataRetention: null,
        jobIdParsedData: '11111111-1111-1111-9111-111111111111',
        probe: {
          id: etlsData.etls[0][0].id as unknown as string,
          params: {
            probeLogic: {
              id: 2,
              configuration: {
                other: true,
              },
            },
            dataPrep: {
              id: 1,
              configuration: {
                skip: true,
                upload_files: [
                  {
                    type: 'file',
                    path: 'file1',
                  },
                ],
              },
            },
          },
        },
        outputPath: 'output_path_1',
        tags: ['tag1', 'tag2'],
        team: 'deep-fpa-objects',
      };

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        outputPath: 'output_path_1',
        firstUploadFileText: 'file1',
        newItemUploadFileText: null,
      });
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });

    it('should create full run - upload file & mergeParsedData', async () => {
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const firstRequest = getExpectedSubmitJobRequest(etlsData.etls[0][0], mestsArr[0], {
        flowType: EtlJobFlowsEnum.PC_RUN,
        runType: spectator.component.runType(),
        mergeParsedData: true,
        createDatasourceFromParsedData: true,
        parsingConfiguration: null,
        dataset: {
          s3Path: 'some-key',
          clipsToParamsHashPath: 'some-hash',
        },
        probe: {
          id: etlsData.etls[0][0].id as unknown as string,
          params: {
            probeLogic: {
              id: 2,
              configuration: {
                other: true,
              },
            },
            dataPrep: {
              id: 1,
              configuration: {
                skip: true,
                upload_files: [
                  {
                    type: 'file',
                    path: 'file1',
                  },
                ],
              },
            },
          },
        },
      });
      const secondRequest = getExpectedSubmitJobRequest(etlsData.etls[0][0], mestsArr[1], {
        flowType: EtlJobFlowsEnum.PC_RUN,
        runType: spectator.component.runType(),
        mergeParsedData: true,
        createDatasourceFromParsedData: true,
        dataset: {
          s3Path: 'some-key',
          clipsToParamsHashPath: 'some-hash',
        },
        parsingConfiguration: null,
        probe: {
          id: etlsData.etls[0][0].id as unknown as string,
          params: {
            probeLogic: {
              id: 2,
              configuration: {
                other: true,
              },
            },
            dataPrep: {
              id: 1,
              configuration: {
                skip: true,
                upload_files: [
                  {
                    type: 'file',
                    path: 'file1',
                  },
                ],
              },
            },
          },
        },
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await waitForDeferredBlocks(spectator.fixture);
      await fillLogFileStep(spectator.fixture, loader, spectator.component.logFileStep, {
        fileName: 'some-file',
      });
      await goToNextStep(spectator.fixture, loader);

      await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        outputPath: 'output_path_1',
        firstUploadFileText: 'file1',
        newItemUploadFileText: null,
        mergeParsedData: true,
        createDatasourceFromParsedData: true,
      });
      await goToNextStep(spectator.fixture, loader);

      // fill first row
      await fillMestStep(spectator.fixture, docLoader, loader);
      // fill second row
      await fillMestStep(spectator.fixture, docLoader, loader, {
        selectedRow: 1,
        rootPath: '/some-root/',
      });

      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledTimes(2);
      expect(launchService.submitJob.calls.allArgs()).toEqual([[firstRequest], [secondRequest]]);
    });

    it('should create compare versions - upload file & mergeParsedData', async () => {
      launchService.submitJob.and.returnValue(
        of([
          {
            isCreated: true,
            jobUuid: 'job-id-123',
          },
          {
            isCreated: true,
            jobUuid: 'job-id-124',
          },
        ]),
      );
      spectator.setInput('runType', EtlJobRunType.COMPARE_VERSIONS);
      const submitRequest: SubmitJobCompareVersionsRequest = {
        flowType: EtlJobFlowsEnum.PC_RUN,
        runType: spectator.component.runType(),
        budgetGroup: 'deep',
        team: 'deep-fpa-objects',
        common: {
          outputPath: 'output_path_1',
          dataset: {
            s3Path: 'some-key',
            clipsToParamsHashPath: 'some-hash',
          },
          probe: {
            id: etlsData.etls[0][0].id as unknown as string,
            params: {
              probeLogic: {
                id: 2,
                configuration: {
                  other: true,
                },
              },
              dataPrep: {
                id: 1,
                configuration: {
                  skip: true,
                  upload_files: [
                    {
                      type: 'file',
                      path: 'file1',
                    },
                  ],
                },
              },
            },
          },
        },
        mainJob: {
          tags: ['tag1', 'tag2'],
          mergeParsedData: true,
          createDatasourceFromParsedData: true,
          forceParsing: true,
          dataRetention: {
            [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
          },
          mest: {
            id: mestsArr[0].id,
            rootPath: '/some-root/',
            isOverride: false,
            params: null,
            nickname: mestsArr[0].nickname,
            executable: `/path/${mestsArr[0].executables[0]}`,
            lib: `/path/${mestsArr[0].libs[0]}`,
            brainLib: `/path/${mestsArr[0].brainLibs[0]}`,
            args: 'some arg',
            skipMestRetry: false,
          },
        },
        dependantJobs: [
          {
            tags: ['tag1', 'tag2'],
            mergeParsedData: true,
            createDatasourceFromParsedData: true,
            forceParsing: true,
            dataRetention: {
              [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
            },
            mest: {
              id: mestsArr[1].id,
              rootPath: '/some-root/',
              isOverride: false,
              params: null,
              nickname: mestsArr[1].nickname,
              executable: `/path/${mestsArr[1].executables[0]}`,
              lib: `/path/${mestsArr[1].libs[0]}`,
              brainLib: `/path/${mestsArr[1].brainLibs[0]}`,
              args: 'some arg',
              skipMestRetry: false,
            },
          },
        ],
      };
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await waitForDeferredBlocks(spectator.fixture);
      await fillLogFileStep(spectator.fixture, loader, spectator.component.logFileStep, {
        fileName: 'some-file',
      });
      await goToNextStep(spectator.fixture, loader);

      await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        outputPath: 'output_path_1',
        firstUploadFileText: 'file1',
        newItemUploadFileText: null,
        mergeParsedData: true,
        createDatasourceFromParsedData: true,
        forceParsing: true,
      });
      await goToNextStep(spectator.fixture, loader);

      // fill first row
      await fillMestStep(spectator.fixture, docLoader, loader, {
        isMainVersion: true,
      });
      // fill second row
      await fillMestStep(spectator.fixture, docLoader, loader, {
        selectedRow: 1,
        rootPath: '/some-root/',
      });
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });

    it('should create data creation', async () => {
      spectator.setInput('runType', EtlJobRunType.DATA_CREATION);
      const submitRequest = getExpectedSubmitJobRequest(etlsData.etls[0][0], mestsArr[0], {
        flowType: EtlJobFlowsEnum.PC_RUN,
        runType: spectator.component.runType(),
        mergeParsedData: false,
        dataset: {
          s3Path: 'some-key',
          clipsToParamsHashPath: 'some-hash',
        },
        parsingConfiguration: {
          id: 10 * parsingArr[0].id + 1,
        },
        parsingOnly: true,
        outputPath: null,
        tags: ['tag1', 'new-tag'],
        probe: null,
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await waitForDeferredBlocks(spectator.fixture);
      await fillLogFileStep(spectator.fixture, loader, spectator.component.logFileStep, {
        fileName: 'some-file',
      });
      await goToNextStep(spectator.fixture, loader);

      await fillParsingStep(spectator.fixture, loader, parsingData, {parsingConfigurationService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        tags: ['tag1', 'new-tag'],
        firstUploadFileText: null,
        newItemUploadFileText: null,
      });

      await goToNextStep(spectator.fixture, loader);

      await fillMestStep(spectator.fixture, docLoader, loader);
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });
  });
});
