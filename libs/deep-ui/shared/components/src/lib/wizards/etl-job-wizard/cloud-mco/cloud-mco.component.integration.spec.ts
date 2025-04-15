import {LoadSuccessParams} from '@ag-grid-community/core';
import {HarnessLoader} from '@angular/cdk/testing';
import {AsyncPipe} from '@angular/common';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeInputHarness, waitForDeferredBlocks} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  fillConfigurationStep,
  fillEtlStep,
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
import {CloudMcoCmdStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/cloud-mco/cloud-mco-cmd-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {
  EtlService,
  JobFormBuilderService,
  LaunchService,
  OnPremService,
  ParsingConfigurationService,
  SubmitJobCompareVersionsCloudMcoRequest,
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
import {getFakeETLDataPrepOrGenericDataPrepOnly} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {CloudMcoComponent} from './cloud-mco.component';

describe('CloudMcoComponent - Integration', () => {
  let spectator: Spectator<CloudMcoComponent>;
  let launchService: SpyObject<LaunchService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let etlService: SpyObject<EtlService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  let etlsArr: Array<any>;
  let etlsData: {groups: Array<EtlGroup>; etls: Array<Array<ETL>>};
  let parsingArr: Array<any>;
  let parsingData: {
    groups: Array<ParsingConfigurationGroupResponse>;
    parsingConfigs: Array<Array<ParsingConfiguration>>;
  };

  const createComponent = createComponentFactory({
    component: CloudMcoComponent,
    imports: [
      MeWizardComponent,
      MeCdkStepComponent,
      CloudMcoCmdStepComponent,
      ParsingStepComponent,
      EtlStepComponent,
      RunConfigStepComponent,
      LoadingStepComponent,
      SubmitJobStepComponent,
      AsyncPipe,
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

    etlsArr.push(getFakeETLDataPrepOrGenericDataPrepOnly(true));

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

  describe('wizard flow', () => {
    it('should create full run', async () => {
      spectator.setInput('runType', EtlJobRunType.FULL_RUN);
      const submitRequest = getExpectedSubmitJobRequest(etlsArr[0], null, {
        flowType: EtlJobFlowsEnum.CLOUD_MCO,
        runType: spectator.component.runType(),
        mest: null,
        parsingConfiguration: null,
        mergeParsedData: false,
        createDatasourceFromParsedData: false,
        dataset: null,
        cloudMco: {
          command: 'some cmd text',
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

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await waitForDeferredBlocks(spectator.fixture);

      //fill cloud-mco-cmd-step
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.cloud-mco-container'},
        `some cmd text`,
      );
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
        flowType: EtlJobFlowsEnum.CLOUD_MCO,
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
        flowType: EtlJobFlowsEnum.CLOUD_MCO,
        runType: spectator.component.runType(),
        outputPath: null,
        mest: null,
        mergeParsedData: false,
        createDatasourceFromParsedData: false,
        dataset: null,
        cloudMco: {
          command: 'some cmd text',
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

      //fill cloud-mco-cmd-step
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.cloud-mco-container'},
        `some cmd text`,
      );
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
      const submitRequest: SubmitJobCompareVersionsCloudMcoRequest = {
        flowType: EtlJobFlowsEnum.CLOUD_MCO,
        runType: spectator.component.runType(),
        budgetGroup: 'deep',
        mainJob: {
          dataRetention: {
            [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
          },
          cloudMco: {
            command: 'cmd 1',
          },
          mergeParsedData: false,
          createDatasourceFromParsedData: false,
          forceParsing: true,
        },
        dependantJobs: [
          {
            dataRetention: {
              [DataRetentionKnownKeysEnum.PARSED_DATA]: getDateInXDays(),
            },
            cloudMco: {
              command: 'cmd 2',
            },
            mergeParsedData: false,
            createDatasourceFromParsedData: false,
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
      //fill cloud-mco-cmd-step
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Main Version"]'},
        `cmd 1`,
      );
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Dependent Version"]'},
        `cmd 2`,
      );
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
