import {LoadSuccessParams} from '@ag-grid-community/core';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {waitForDeferredBlocks} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  fillC2LFilterStep,
  fillConfigurationStep,
  fillEtlStep,
  fillOutputsStep,
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
import {ClipToLogLogsFilterStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-to-log-logs-filter-step';
import {ClipToLogOutputsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-to-log-outputs-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {
  EtlService,
  JobFormBuilderService,
  LaunchService,
  OnPremService,
  ParsingConfigurationService,
  SubmitJobCompareVersionsClipToLogRequest,
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

import {ClipToLogComponent} from './clip-to-log.component';

describe('ClipToLogComponent - Integration', () => {
  let spectator: Spectator<ClipToLogComponent>;
  let launchService: SpyObject<LaunchService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let etlService: SpyObject<EtlService>;
  let onPremService: SpyObject<OnPremService>;
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
    component: ClipToLogComponent,
    imports: [
      MeWizardComponent,
      CdkStepperModule,
      ClipToLogOutputsStepComponent,
      ClipToLogLogsFilterStepComponent,
      EtlStepComponent,
      RunConfigStepComponent,
      ParsingStepComponent,
      MatDialogModule,
      LoadingStepComponent,
      SubmitJobStepComponent,
      MatIconTestingModule,
      MeCdkStepComponent,
    ],
    providers: [JobFormBuilderService],
    mocks: [
      MeAzureGraphService,
      ParsingConfigurationService,
      EtlService,
      LaunchService,
      OnPremService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    launchService = spectator.inject(LaunchService);
    launchService.uploadClipToLogFile.and.returnValue(
      of({
        s3Path: 'path1/folder2',
      }),
    );
    launchService.validateUserParams.and.returnValue(of({valid: true}));
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    etlService = spectator.inject(EtlService);
    onPremService = spectator.inject(OnPremService);
    ({etlsArr, parsingArr, loader, docLoader} = VJwizardSetup(
      spectator.fixture,
      spectator.component,
      loader,
      docLoader,
      null,
      null,
      parsingConfigurationService,
      etlService,
      onPremService,
      launchService,
      null,
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
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('wizard flow', () => {
    beforeEach(() => {
      launchService.validateClipToLogOutputs.and.returnValue(
        of({s3Path: 'some-key', metadata: null}),
      );
    });

    it('should create full run', async () => {
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const submitRequest = getExpectedSubmitJobRequest(etlsArr[0], null, {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        mergeParsedData: null,
        createDatasourceFromParsedData: null,
        mest: null,
        parsingConfiguration: null,
        clip2log: {
          itrksDir: '/some/path/',
        },
        dataset: {
          s3Path: 'some-key',
        },
        metadata: null,
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
      await waitForDeferredBlocks(spectator.fixture);
      await fillC2LFilterStep(
        spectator.fixture,
        loader,
        {
          fileName: 'file_1',
          file: {
            s3Path: 'path1/folder2',
          },
        },
        spectator.component.filterStep,
      );
      await goToNextStep(spectator.fixture, loader);

      await fillOutputsStep(spectator.fixture, loader);
      await goToNextStep(spectator.fixture, loader);

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

    it('should create full run with jobIdParsedData', async () => {
      spectator.component.refJobId = '11111111-1111-1111-9111-111111111111';
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const submitRequest: SubmitJobRefJobId = {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        budgetGroup: 'deep',
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

    it('should create data creation', async () => {
      spectator.setInput('runType', EtlJobRunType.DATA_CREATION);
      const submitRequest = getExpectedSubmitJobRequest(etlsArr[0], null, {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        mergeParsedData: null,
        createDatasourceFromParsedData: null,
        outputPath: null,
        mest: null,
        clip2log: {
          itrksDir: '/some/path/',
        },
        dataset: {
          s3Path: 'some-key',
        },
        metadata: {filtered_list_id: 432},
        parsingConfiguration: {
          id: 10 * parsingArr[0].id + 1,
        },
        parsingOnly: true,
        probe: null,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await waitForDeferredBlocks(spectator.fixture);
      await fillC2LFilterStep(
        spectator.fixture,
        loader,
        {
          fileName: 'file_1',
          file: {
            s3Path: 'path1/folder2',
          },
          clipListId: 432,
        },
        spectator.component.filterStep,
      );
      await goToNextStep(spectator.fixture, loader);

      await fillOutputsStep(spectator.fixture, loader);
      await goToNextStep(spectator.fixture, loader);

      await fillParsingStep(spectator.fixture, loader, parsingData, {parsingConfigurationService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        newItemUploadFileText: null,
        firstUploadFileText: null,
      });
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });

    it('should create compare versions', async () => {
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
      const submitRequest: SubmitJobCompareVersionsClipToLogRequest = {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        budgetGroup: 'deep',
        mainJob: {
          dataRetention: {
            [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
          },
          dataset: {
            s3Path: 'some-key',
          },
          clip2log: {
            itrksDir: '/main-itrk-dir/',
          },
          forceParsing: true,
        },
        dependantJobs: [
          {
            dataRetention: {
              [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
            },
            dataset: {
              s3Path: 'some-key',
            },
            clip2log: {
              itrksDir: '/dep-itrk-dir/',
            },
            forceParsing: true,
          },
        ],
        common: {
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
        },
        tags: ['tag1', 'tag2'],
        team: 'deep-fpa-objects',
      };
      await waitForDeferredBlocks(spectator.fixture);
      await fillC2LFilterStep(spectator.fixture, loader, {});
      await goToNextStep(spectator.fixture, loader);

      await fillOutputsStep(spectator.fixture, loader, {
        mainLogsDirsText: '/dep-log-dir/',
        mainItrksDirText: '/main-itrk-dir/',
        dependentItrksDirText: '/dep-itrk-dir/',
        dependentLogsDirsText: '/dep-log-dir/',
      });
      await goToNextStep(spectator.fixture, loader);

      await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        outputPath: 'output_path_1',
        firstUploadFileText: 'file1',
        newItemUploadFileText: null,
        forceParsing: true,
      });
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });
  });

  describe('wizard flow with filtered list', () => {
    beforeEach(() => {
      launchService.validateClipToLogOutputs.and.returnValue(
        of({s3Path: 'some-key', metadata: {k: 'some-k'}}),
      );
      launchService.uploadClipToLogFile.and.returnValue(
        of({
          s3Path: 'some-key',
        }),
      );
    });

    it('should create full run', async () => {
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const submitRequest = getExpectedSubmitJobRequest(etlsArr[0], null, {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        mergeParsedData: null,
        createDatasourceFromParsedData: null,
        mest: null,
        parsingConfiguration: null,
        clip2log: {
          itrksDir: '/some/path/',
        },
        dataset: {
          s3Path: 'some-key',
        },
        metadata: {
          k: 'some-k',
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
      await waitForDeferredBlocks(spectator.fixture);
      await fillC2LFilterStep(spectator.fixture, loader, {});
      await goToNextStep(spectator.fixture, loader);

      await fillOutputsStep(spectator.fixture, loader, {fileName: 'name'});
      await goToNextStep(spectator.fixture, loader);

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

    it('should create full run with jobIdParsedData', async () => {
      spectator.component.refJobId = '11111111-1111-1111-9111-111111111111';
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const submitRequest: SubmitJobRefJobId = {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        budgetGroup: 'deep',
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

    it('should create data creation', async () => {
      spectator.setInput('runType', EtlJobRunType.DATA_CREATION);
      const submitRequest = getExpectedSubmitJobRequest(etlsArr[0], null, {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        mergeParsedData: null,
        createDatasourceFromParsedData: null,
        outputPath: null,
        mest: null,
        clip2log: {
          itrksDir: '/some/path/',
        },
        dataset: {
          s3Path: 'some-key',
        },
        metadata: {
          k: 'some-k',
        },
        parsingConfiguration: {
          id: 10 * parsingArr[0].id + 1,
        },
        parsingOnly: true,
        probe: null,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await waitForDeferredBlocks(spectator.fixture);
      await fillC2LFilterStep(spectator.fixture, loader);
      await goToNextStep(spectator.fixture, loader);

      await fillOutputsStep(spectator.fixture, loader, {fileName: 'name'});
      await goToNextStep(spectator.fixture, loader);

      await fillParsingStep(spectator.fixture, loader, parsingData, {parsingConfigurationService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        newItemUploadFileText: null,
        firstUploadFileText: null,
      });
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });

    it('should create compare versions', async () => {
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
      const submitRequest: SubmitJobCompareVersionsClipToLogRequest = {
        flowType: EtlJobFlowsEnum.CLIP_2_LOG,
        runType: spectator.component.runType(),
        budgetGroup: 'deep',
        mainJob: {
          dataRetention: {
            [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
          },
          dataset: {
            s3Path: 'some-key',
          },
          clip2log: {
            itrksDir: '/main-itrk-dir/',
          },
          metadata: {
            k: 'some-k',
          },
          forceParsing: true,
        },
        dependantJobs: [
          {
            dataRetention: {
              [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
            },
            dataset: {
              s3Path: 'some-key',
            },
            clip2log: {
              itrksDir: '/dep-itrk-dir/',
            },
            metadata: {
              k: 'some-k',
            },
            forceParsing: true,
          },
        ],
        common: {
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
        },
        tags: ['tag1', 'tag2'],
        team: 'deep-fpa-objects',
      };
      await waitForDeferredBlocks(spectator.fixture);
      await fillC2LFilterStep(spectator.fixture, loader, {});
      await goToNextStep(spectator.fixture, loader);

      await fillOutputsStep(spectator.fixture, loader, {
        mainLogsDirsText: '/dep-log-dir/',
        mainItrksDirText: '/main-itrk-dir/',
        dependentItrksDirText: '/dep-itrk-dir/',
        dependentLogsDirsText: '/dep-log-dir/',
        fileName: 'name',
      });
      await goToNextStep(spectator.fixture, loader);

      await fillEtlStep(spectator.fixture, loader, etlsData, {etlService});
      await goToNextStep(spectator.fixture, loader);

      await fillConfigurationStep(spectator.fixture, docLoader, loader, {
        outputPath: 'output_path_1',
        firstUploadFileText: 'file1',
        newItemUploadFileText: null,
        forceParsing: true,
      });
      await goToNextStep(spectator.fixture, loader, 'Finish');
      await spectator.fixture.whenStable();

      expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
    });
  });
});
