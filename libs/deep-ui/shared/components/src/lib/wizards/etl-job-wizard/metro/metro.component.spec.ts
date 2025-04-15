import {HarnessLoader} from '@angular/cdk/testing';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {VJwizardSetup} from 'deep-ui/shared/components/src/lib/testing';
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
import {ETL} from 'deep-ui/shared/models';
import {getFakeEtlNames} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {MetroComponent} from './metro.component';

describe('MetroComponent', () => {
  let spectator: Spectator<MetroComponent>;
  let launchService: SpyObject<LaunchService>;
  let clipListService: SpyObject<ClipListService>;
  let etlService: SpyObject<EtlService>;
  let onPremService: SpyObject<OnPremService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  let etlsArr: Array<ETL>;

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
    ],
    providers: [JobFormBuilderService],
    mocks: [MeAzureGraphService, EtlService, ClipListService, LaunchService, OnPremService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.budgetGroup = 'deep';
    launchService = spectator.inject(LaunchService);
    etlService = spectator.inject(EtlService);
    clipListService = spectator.inject(ClipListService);
    onPremService = spectator.inject(OnPremService);
    ({loader, docLoader, etlsArr} = VJwizardSetup(
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
    ));
    etlService.getEtlNames.and.returnValue(of(getFakeEtlNames(etlsArr)));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
