import {CdkStepperModule} from '@angular/cdk/stepper';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MeDialogContainerComponent} from '@mobileye/material/src/lib/components/dialog-container';
import {MeCdkStepComponent, MeWizardComponent} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {EtlStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/etl-step';
import {LoadingStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/loading-step';
import {SubmitJobStepComponent} from 'deep-ui/shared/components/src/lib/wizards/common-steps/submit-job-step';
import {
  AssetManagerService,
  DatasourceService,
  EtlService,
  LaunchService,
  PerfectListService,
} from 'deep-ui/shared/core';
import {FullStoryResponseTimeInterceptor} from 'deep-ui/shared/http';
import {Datasource, EtlTypeEnum} from 'deep-ui/shared/models';
import {
  getFakeETL,
  getFakeEtlNames,
  getFakePerfectDatasource,
  getFakePerfectList,
} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {PerfectTransformWizardComponent} from './perfect-transform-wizard.component';
import {DatasourceDetailsStepComponent} from './steps/datasource-details-step/datasource-details-step.component';
import {PerfectListStepComponent} from './steps/perfect-list-step/perfect-list-step.component';
import {SelectFlowStepComponent} from './steps/select-flow-step/select-flow-step.component';
import {UpdateMsgStepComponent} from './steps/update-msg-step/update-msg-step.component';

const fakePerfectLists = [
  getFakePerfectList(true),
  getFakePerfectList(true, {id: 999}),
  getFakePerfectList(true),
];
const fakeEtl = getFakeETL(true, {id: 1}, EtlTypeEnum.PERFECT_TRANSFORM);
const mainDatasource: Datasource = getFakePerfectDatasource(true, {
  etlId: 1,
  siblingsId: ['1'],
  perfectListIds: [999],
  technology: 'AV',
}).fakeDataSource;

const siblingDatasource: Datasource = getFakePerfectDatasource(true, {
  id: '1',
  siblingsId: ['2'],
  perfectListIds: [999],
  technology: 'AV',
}).fakeDataSource;

const etls = [
  fakeEtl,
  getFakeETL(true, {}, EtlTypeEnum.PERFECT_TRANSFORM),
  {
    ...fakeEtl,
    id: 2,
  },
];

const etlNames = getFakeEtlNames(etls);

describe('PerfectTransformWizardComponent', () => {
  let spectator: Spectator<PerfectTransformWizardComponent>;
  let perfectListService: SpyObject<PerfectListService>;
  let dataSourceService: SpyObject<DatasourceService>;
  let etlService: SpyObject<EtlService>;
  let fullStoryService: SpyObject<FullStoryService>;

  const createComponent = createComponentFactory({
    component: PerfectTransformWizardComponent,
    imports: [
      MeWizardComponent,
      CdkStepperModule,
      EtlStepComponent,
      MeDialogContainerComponent,
      MatButtonModule,
      MatDialogModule,
      MatIconModule,
      PerfectListStepComponent,
      DatasourceDetailsStepComponent,
      UpdateMsgStepComponent,
      MatFormFieldModule,
      LoadingStepComponent,
      SubmitJobStepComponent,
      MatDialogModule,
      SelectFlowStepComponent,
      MeCdkStepComponent,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
      FullStoryResponseTimeInterceptor,
    ],
    mocks: [
      LaunchService,
      EtlService,
      PerfectListService,
      AssetManagerService,
      MeAzureGraphService,
      DatasourceService,
      FullStoryService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    perfectListService = spectator.inject(PerfectListService);
    dataSourceService = spectator.inject(DatasourceService);
    etlService = spectator.inject(EtlService);
    fullStoryService = spectator.inject<FullStoryService>(FullStoryService);

    perfectListService.getMulti.and.returnValue(of(fakePerfectLists));
    dataSourceService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    etlService.getMulti.and.returnValue(of({probes: etls}));
    etlService.getEtlNames.and.returnValue(of(etlNames));
    fullStoryService.trackEvent.and.returnValue(null);

    spectator.component.runType.set('UPDATE');

    spectator.component.selectedDatasource = mainDatasource;
    spectator.component.initialEtl = fakeEtl;
    spectator.component.siblingsDatasources = [siblingDatasource];
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
