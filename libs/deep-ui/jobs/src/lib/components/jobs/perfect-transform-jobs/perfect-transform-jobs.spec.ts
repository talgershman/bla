import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {RouterTestingModule} from '@angular/router/testing';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {EtlJobWizardComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard';
import {DatasourceService} from 'deep-ui/shared/core';

import {PerfectTransformJobsComponent} from './perfect-transform-jobs.component';

describe('PerfectTransformJobsComponent', () => {
  let spectator: Spectator<PerfectTransformJobsComponent>;

  const createComponent = createComponentFactory({
    component: PerfectTransformJobsComponent,
    mocks: [MeDownloaderService, MeAzureGraphService, MatDialog],
    providers: [DatasourceService],
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      MatButtonModule,
      MatIconModule,
      EtlJobWizardComponent,
      MeTooltipDirective,
      MeServerSideTableComponent,
      MePortalSrcDirective,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
