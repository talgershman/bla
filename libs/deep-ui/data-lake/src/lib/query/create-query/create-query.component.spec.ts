import {CdkStepperModule} from '@angular/cdk/stepper';
import {Location} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {QueryDashboardControlComponent} from '../../components/controls/query-dashboard-control/query-dashboard-control.component';
import {QueryStepperComponent} from '../../components/steppers/query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../../components/steppers/stepper-container/stepper-container.component';
import {ExecuteQueryWebSocketsManagerService} from '../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {CreateQueryComponent} from './create-query.component';
import {StandaloneQueryComponent} from './standalone-query/standalone-query.component';

describe('CreateQueryComponent', () => {
  let spectator: Spectator<CreateQueryComponent>;

  const createComponent = createComponentFactory({
    component: CreateQueryComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      QueryDashboardControlComponent,
      MatButtonModule,
      QueryStepperComponent,
      StepperContainerComponent,
      CdkStepperModule,
      ReactiveFormsModule,
      RouterTestingModule,
      StandaloneQueryComponent,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({
            view: DataSourceDynamicViewEnum.PERFECTS,
          }),
          snapshot: {
            data: {
              viewData: {
                subQueries: [],
                selectedDataSources: [],
                onLoadGoToEditQueryIndex: null,
              },
            },
          },
        },
      },
    ],
    mocks: [
      DatasourceService,
      ExecuteQueryWebSocketsManagerService,
      MeAzureGraphService,
      Router,
      Location,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.selectedDataSources = [];
    spectator.component.subQueries = [];
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
