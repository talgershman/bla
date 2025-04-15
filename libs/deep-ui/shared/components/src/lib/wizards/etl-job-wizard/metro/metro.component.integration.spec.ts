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
  getEtlsData,
  getExpectedSubmitJobRequest,
  goToNextStep,
  VJwizardSetup,
} from 'deep-ui/shared/components/src/lib/testing';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {
  ClipListService,
  EtlService,
  JobFormBuilderService,
  LaunchService,
  OnPremService,
} from 'deep-ui/shared/core';
import {ClipList, ETL, EtlGroup, EtlJobFlowsEnum, EtlTypeEnum} from 'deep-ui/shared/models';
import {of} from 'rxjs';

import {MetroComponent} from './metro.component';

describe('MetroComponent - Integration', () => {
  let spectator: Spectator<MetroComponent>;
  let launchService: SpyObject<LaunchService>;
  let clipListService: SpyObject<ClipListService>;
  let etlService: SpyObject<EtlService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  let etlsArr: Array<any>;
  let etlsData: {groups: Array<EtlGroup>; etls: Array<Array<ETL>>};
  let clipListsArr: Array<any>;

  const createComponent = createComponentFactory({
    component: MetroComponent,
    imports: [
      MeWizardComponent,
      MeCdkStepComponent,
      ClipListStepComponent,
      EtlStepComponent,
      RunConfigStepComponent,
      LoadingStepComponent,
      SubmitJobStepComponent,
      MatIconTestingModule,
    ],
    providers: [JobFormBuilderService],
    mocks: [MeAzureGraphService, EtlService, ClipListService, LaunchService, OnPremService],
    detectChanges: false,
  });

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    launchService = spectator.inject(LaunchService);
    etlService = spectator.inject(EtlService);
    clipListService = spectator.inject(ClipListService);
    onPremService = spectator.inject(OnPremService);
    ({etlsArr, loader, docLoader, clipListsArr} = VJwizardSetup(
      spectator.fixture,
      spectator.component,
      loader,
      docLoader,
      null,
      clipListService,
      null,
      etlService,
      onPremService,
      launchService,
      null,
      EtlTypeEnum.MODEL_INFERENCE,
    ));

    etlsData = getEtlsData(etlsArr);

    launchService.validateUserParams.and.returnValue(of({valid: true}));

    etlService.getAgGridMulti.and.returnValue(
      of({
        rowData: etlsData.groups,
        rowCount: etlsData.groups.length,
      } as LoadSuccessParams),
    );

    const genericClipList: Array<ClipList> = clipListsArr.filter(
      (clipList: ClipList) => clipList.type === 'generic',
    );
    clipListService.getAgGridMulti.and.returnValue(
      of({
        rowData: genericClipList,
        rowCount: genericClipList.length,
      } as LoadSuccessParams),
    );
  });

  it('should send full run request', async () => {
    const submitRequest = getExpectedSubmitJobRequest(etlsData.etls[0][0], null, {
      flowType: EtlJobFlowsEnum.METRO,
      runType: null,
      parsingOnly: null,
      mergeParsedData: null,
      createDatasourceFromParsedData: null,
      forceParsing: null,
      mest: null,
      parsingConfiguration: null,
      dataset: {
        s3Path: clipListsArr[4].s3Path,
        clipListId: clipListsArr[4].id,
        clipsToParamsHashPath: clipListsArr[4].clipsToParamsHashPath,
      },
      probe: {
        id: etlsData.etls[0][0].id as unknown as string,
        params: {
          logic: {
            id: 2,
            configuration: {
              other: true,
            },
          },
          genericDataPrep: {
            id: 1,
            configuration: {
              skip: true,
              upload_files: [
                {
                  type: 'file',
                  path: 'file1',
                },
                {
                  type: 'folder',
                  path: 'folder1',
                },
              ],
            },
          },
        },
      },
    });
    const key = 'dataRetention';
    submitRequest[key] = null;

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
    });
    await goToNextStep(spectator.fixture, loader, 'Finish');
    await spectator.fixture.whenStable();

    expect(launchService.submitJob).toHaveBeenCalledWith(submitRequest);
  });
});
