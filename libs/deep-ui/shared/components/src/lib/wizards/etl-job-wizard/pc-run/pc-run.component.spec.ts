import {CdkStepperModule} from '@angular/cdk/stepper';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  MeUploadFileComponent,
  MeUploadFileComponentMock,
} from '@mobileye/material/src/lib/components/upload-file';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {VJwizardSetup} from 'deep-ui/shared/components/src/lib/testing';
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
} from 'deep-ui/shared/core';

import {PCRunComponent} from './pc-run.component';

describe('PCRunComponent', () => {
  let spectator: Spectator<PCRunComponent>;
  let mestService: SpyObject<MestService>;
  let launchService: SpyObject<LaunchService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let etlService: SpyObject<EtlService>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let onPremService: SpyObject<OnPremService>;

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

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    mestService = spectator.inject(MestService);
    launchService = spectator.inject(LaunchService);
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    etlService = spectator.inject(EtlService);
    assetManagerService = spectator.inject(AssetManagerService);
    onPremService = spectator.inject(OnPremService);
    VJwizardSetup(
      spectator.fixture,
      spectator.component,
      null,
      null,
      mestService,
      null,
      parsingConfigurationService,
      etlService,
      onPremService,
      launchService,
      assetManagerService,
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
