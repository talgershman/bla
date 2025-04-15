import {LoadSuccessParams} from '@ag-grid-community/core';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  fillClipListStep,
  fillConfigurationStep,
  fillEtlStep,
  fillParsingStep,
  getEtlsData,
  getParsingData,
  goToNextStep,
  VJwizardSetup,
} from 'deep-ui/shared/components/src/lib/testing';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {
  AssetManagerService,
  ClipListService,
  EtlService,
  JobFormBuilderService,
  LaunchService,
  OnPremService,
  ParsingConfigurationService,
  SubmitJobAVPipeline,
  SubmitJobRefJobId,
} from 'deep-ui/shared/core';
import {
  ClipList,
  ETL,
  EtlGroup,
  EtlJobFlowsEnum,
  EtlJobRunType,
  ParsingConfiguration,
  ParsingConfigurationGroupResponse,
} from 'deep-ui/shared/models';
import {getFakeETLDataPrepOrGenericDataPrepOnly} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AvPipelineComponent} from './av-pipeline.component';

describe('AvPipelineComponent - Integration', () => {
  let spectator: Spectator<AvPipelineComponent>;
  let launchService: SpyObject<LaunchService>;
  let clipListService: SpyObject<ClipListService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let etlService: SpyObject<EtlService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  let etlsArr: Array<any>;
  let etlsData: {groups: Array<EtlGroup>; etls: Array<Array<ETL>>};
  let clipListsArr: Array<any>;
  let parsingArr: Array<any>;
  let parsingData: {
    groups: Array<ParsingConfigurationGroupResponse>;
    parsingConfigs: Array<Array<ParsingConfiguration>>;
  };

  const createComponent = createComponentFactory({
    component: AvPipelineComponent,
    imports: [
      MeWizardComponent,
      MeCdkStepComponent,
      ClipListStepComponent,
      EtlStepComponent,
      RunConfigStepComponent,
      ParsingStepComponent,
      LoadingStepComponent,
      SubmitJobStepComponent,
      MatIconTestingModule,
    ],
    providers: [JobFormBuilderService],
    mocks: [
      MeAzureGraphService,
      AssetManagerService,
      ClipListService,
      ParsingConfigurationService,
      EtlService,
      LaunchService,
      OnPremService,
    ],
    detectChanges: false,
  });

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    spectator.setInput('flowType', EtlJobFlowsEnum.AV_PIPELINE);
    launchService = spectator.inject(LaunchService);
    etlService = spectator.inject(EtlService);
    clipListService = spectator.inject(ClipListService);
    onPremService = spectator.inject(OnPremService);
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    ({etlsArr, parsingArr, clipListsArr, loader, docLoader} = VJwizardSetup(
      spectator.fixture,
      spectator.component,
      loader,
      docLoader,
      null,
      clipListService,
      parsingConfigurationService,
      etlService,
      onPremService,
      launchService,
      assetManagerService,
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

    const genericClipList: Array<ClipList> = clipListsArr.filter(
      (clipList: ClipList) => clipList.type === 'generic',
    );
    clipListService.getAgGridMulti.and.returnValue(
      of({
        rowData: genericClipList,
        rowCount: genericClipList.length,
      } as LoadSuccessParams),
    );

    parsingConfigurationService.getAgGridMulti.and.returnValue(
      of({
        rowData: parsingData.groups,
        rowCount: parsingData.groups.length,
      } as LoadSuccessParams),
    );
    spectator.component.dataRetentionInfoObj = {};

    launchService.validateUserParams.and.returnValue(of({valid: true}));
  });

  it('should create full run', async () => {
    spectator.setInput('runType', EtlJobRunType.FULL_RUN);
    const submitRequest: SubmitJobAVPipeline = {
      flowType: EtlJobFlowsEnum.AV_PIPELINE,
      runType: EtlJobRunType.FULL_RUN,
      budgetGroup: 'deep',
      dataRetention: null,
      outputPath: 'output_path_1',
      tags: ['tag1', 'tag2'],
      team: 'deep-fpa-objects',
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
      parsingOnly: false,
      mergeParsedData: false,
      createDatasourceFromParsedData: false,
      forceParsing: false,
      dataset: {
        s3Path: clipListsArr[4].s3Path,
        clipListId: clipListsArr[4].id,
        clipsToParamsHashPath: clipListsArr[4].clipsToParamsHashPath,
      },
    };
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();
    spectator.fixture.detectChanges();

    await fillClipListStep(spectator.fixture, loader);
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
    spectator.fixture.detectChanges();
    const submitRequest: SubmitJobRefJobId = {
      flowType: EtlJobFlowsEnum.AV_PIPELINE,
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
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();
    spectator.fixture.detectChanges();
    await spectator.fixture.whenStable();
    spectator.fixture.detectChanges();

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
    const submitRequest: SubmitJobAVPipeline = {
      flowType: EtlJobFlowsEnum.AV_PIPELINE,
      runType: EtlJobRunType.DATA_CREATION,
      budgetGroup: 'deep',
      dataRetention: null,
      tags: ['tag1', 'new-tag'],
      team: 'deep-fpa-objects',
      mergeParsedData: false,
      createDatasourceFromParsedData: false,
      forceParsing: false,
      dataset: {
        s3Path: clipListsArr[4].s3Path,
        clipListId: clipListsArr[4].id,
        clipsToParamsHashPath: clipListsArr[4].clipsToParamsHashPath,
      },
      parsingConfiguration: {
        id: 10 * parsingArr[0].id + 1,
      },
      parsingOnly: true,
    };
    delete submitRequest.outputPath;
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    await fillClipListStep(spectator.fixture, loader);
    await goToNextStep(spectator.fixture, loader);

    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    await fillParsingStep(spectator.fixture, loader, parsingData, {parsingConfigurationService});
    await goToNextStep(spectator.fixture, loader);

    await fillConfigurationStep(spectator.fixture, docLoader, loader, {
      tags: ['tag1', 'new-tag'],
      firstUploadFileText: null,
      newItemUploadFileText: null,
    });
    await goToNextStep(spectator.fixture, loader, 'Finish');
    await spectator.fixture.whenStable();

    expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
  });
});
