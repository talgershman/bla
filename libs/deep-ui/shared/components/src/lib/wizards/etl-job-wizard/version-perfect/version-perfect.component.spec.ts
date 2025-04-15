import {CdkStepperModule} from '@angular/cdk/stepper';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {VJwizardSetup} from 'deep-ui/shared/components/src/lib/testing';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {ClipListStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/clip-list-step';
import {DatasourcesStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/datasources-step';
import {MestsStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/mests-step';
import {ParsingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/parsing-step';
import {RunConfigStepComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard/steps/run-config-step';
import {
  AssetManagerService,
  ClipListService,
  DatasourceService,
  EtlService,
  JobFormBuilderService,
  LaunchService,
  MestService,
  OnPremService,
  ParsingConfigurationService,
} from 'deep-ui/shared/core';

import {VersionPerfectComponent} from './version-perfect.component';

describe('VersionPerfectComponent', () => {
  let spectator: Spectator<VersionPerfectComponent>;
  let mestService: SpyObject<MestService>;
  let launchService: SpyObject<LaunchService>;
  let clipListService: SpyObject<ClipListService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let etlService: SpyObject<EtlService>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: VersionPerfectComponent,
    imports: [
      EtlStepComponent,
      DatasourcesStepComponent,
      MestsStepComponent,
      SubmitJobStepComponent,
      ClipListStepComponent,
      MeWizardComponent,
      MeCdkStepComponent,
      CdkStepperModule,
      LoadingStepComponent,
      RunConfigStepComponent,
      ParsingStepComponent,
      MatProgressSpinnerModule,
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
      DatasourceService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    mestService = spectator.inject(MestService);
    launchService = spectator.inject(LaunchService);
    clipListService = spectator.inject(ClipListService);
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    etlService = spectator.inject(EtlService);
    assetManagerService = spectator.inject(AssetManagerService);
    onPremService = spectator.inject(OnPremService);
    ({loader, docLoader} = VJwizardSetup(
      spectator.fixture,
      spectator.component,
      loader,
      docLoader,
      mestService,
      clipListService,
      parsingConfigurationService,
      etlService,
      onPremService,
      launchService,
      assetManagerService,
    ));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
