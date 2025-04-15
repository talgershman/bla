import {HarnessLoader} from '@angular/cdk/testing';
import {AsyncPipe} from '@angular/common';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {VJwizardSetup} from 'deep-ui/shared/components/src/lib/testing';
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
} from 'deep-ui/shared/core';

import {CloudMcoComponent} from './cloud-mco.component';

describe('CloudMcoComponent', () => {
  let spectator: Spectator<CloudMcoComponent>;
  let launchService: SpyObject<LaunchService>;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let etlService: SpyObject<EtlService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

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
    ({loader, docLoader} = VJwizardSetup(
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
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
