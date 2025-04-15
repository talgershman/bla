import {LoadSuccessParams} from '@ag-grid-community/core';
import {HarnessLoader} from '@angular/cdk/testing';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {getEtlsData, VJwizardSetup} from 'deep-ui/shared/components/src/lib/testing';
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
} from 'deep-ui/shared/core';
import {ETL, EtlGroup, EtlJobFlowsEnum} from 'deep-ui/shared/models';
import {getFakeETLDataPrepOrGenericDataPrepOnly} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AvPipelineComponent} from './av-pipeline.component';

describe('AvPipelineComponent ', () => {
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
    ({etlsArr, loader, docLoader} = VJwizardSetup(
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
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
